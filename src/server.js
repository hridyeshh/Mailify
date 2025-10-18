import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import schedule from 'node-schedule';
import multer from 'multer';
import fs from 'fs';
import { JobApplicationMailer } from './job_mailer.js';
import { aiGenerator } from './ai_message_generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
    dest: path.join(__dirname, '../temp/'),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize mailer
let mailer;
try {
    mailer = new JobApplicationMailer();
    console.log('✅ JobApplicationMailer initialized successfully\n');
} catch (error) {
    console.error('❌ Failed to initialize mailer:', error.message);
    process.exit(1);
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// Parse recipients from input (comma or newline separated)
function parseRecipients(recipientsText) {
    if (!recipientsText || typeof recipientsText !== 'string') {
        return [];
    }
    
    // Split by comma or newline
    const emails = recipientsText
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);
    
    return emails;
}

// Validate request data
function validateEmailRequest(body) {
    const errors = [];
    
    // Check recipients
    if (!body.recipients || body.recipients.trim().length === 0) {
        errors.push('Recipients field is required');
    } else {
        const emails = parseRecipients(body.recipients);
        if (emails.length === 0) {
            errors.push('At least one recipient email is required');
        } else {
            const invalidEmails = emails.filter(email => !isValidEmail(email));
            if (invalidEmails.length > 0) {
                errors.push(`Invalid email address(es): ${invalidEmails.join(', ')}`);
            }
        }
    }
    
    // Check subject
    if (!body.subject || body.subject.trim().length === 0) {
        errors.push('Subject field is required');
    }
    
    // Check message
    if (!body.message || body.message.trim().length === 0) {
        errors.push('Message field is required');
    }
    
    return errors;
}

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        senderEmail: mailer.senderEmail 
    });
});

// Test email connection
app.post('/api/test-connection', async (req, res) => {
    try {
        const isValid = await mailer.testConnection();
        res.json({ 
            success: isValid,
            message: isValid ? 'Email configuration is valid' : 'Email configuration test failed'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Generate AI message
app.post('/api/generate-message', async (req, res) => {
    try {
        const { 
            recipientName = 'Hiring Manager',
            recipientEmail = '',
            companyName = '',
            jobTitle = 'Software Development position',
            additionalContext = '',
            userDetails = null
        } = req.body;

        console.log('\n🤖 Received AI message generation request');
        console.log(`   Recipient: ${recipientName}`);
        console.log(`   Company: ${companyName}`);
        console.log(`   Position: ${jobTitle}`);

        // Generate message using AI
        const generatedMessage = await aiGenerator.generateMessage({
            recipientName,
            recipientEmail,
            companyName,
            jobTitle,
            additionalContext,
            userDetails
        });

        res.json({
            success: true,
            message: generatedMessage,
            metadata: {
                recipientName,
                companyName,
                jobTitle,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error generating AI message:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: aiGenerator.getFallbackMessage({
                recipientName: req.body.recipientName,
                companyName: req.body.companyName,
                jobTitle: req.body.jobTitle
            })
        });
    }
});

// Generate multiple AI message variations
app.post('/api/generate-variations', async (req, res) => {
    try {
        const { 
            recipientName = 'Hiring Manager',
            recipientEmail = '',
            companyName = '',
            jobTitle = 'Software Development position',
            additionalContext = '',
            count = 3
        } = req.body;

        console.log(`\n🤖 Generating ${count} message variations`);

        // Generate message variations
        const variations = await aiGenerator.generateMessageVariations({
            recipientName,
            recipientEmail,
            companyName,
            jobTitle,
            additionalContext
        }, Math.min(count, 5)); // Limit to 5 variations max

        res.json({
            success: true,
            variations: variations,
            count: variations.length,
            metadata: {
                recipientName,
                companyName,
                jobTitle,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error generating message variations:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Generate AI message from uploaded resume
app.post('/api/generate-message-from-resume', upload.single('resume'), async (req, res) => {
    let tempFilePath = null;
    
    try {
        console.log('\n📥 Received resume upload request');
        
        if (!req.file) {
            console.error('❌ No file in request');
            return res.status(400).json({
                success: false,
                error: 'No resume file uploaded'
            });
        }

        tempFilePath = req.file.path;
        console.log('📄 Resume uploaded:', req.file.originalname);
        console.log('📁 Temp file path:', tempFilePath);
        console.log('🤖 Starting AI message generation from resume...');

        // Create a custom AI generator with the uploaded file
        const { AIMessageGenerator } = await import('./ai_message_generator.js');
        const customGenerator = new AIMessageGenerator();
        
        console.log('✅ AI Generator created');
        
        // Override the resume path temporarily
        customGenerator.resumePath = tempFilePath;
        
        console.log('📤 Calling AI to generate message...');
        
        // Generate message using the uploaded resume
        const generatedMessage = await customGenerator.generateMessage({
            recipientName: '',
            recipientEmail: '',
            companyName: 'your company',
            jobTitle: '',
            additionalContext: 'Create a generic template message that starts with "Hello," and uses "your company" as placeholder'
        });

        console.log('✅ AI message generated successfully from uploaded resume');

        res.json({
            success: true,
            message: generatedMessage,
            metadata: {
                fileName: req.file.originalname,
                fileSize: req.file.size,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error generating message from resume:');
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message,
            fallback: aiGenerator.getFallbackMessage({})
        });
    } finally {
        // Clean up temporary file
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try {
                fs.unlinkSync(tempFilePath);
                console.log('🗑️  Temporary file cleaned up');
            } catch (cleanupError) {
                console.error('⚠️  Failed to cleanup temp file:', cleanupError.message);
            }
        }
    }
});

// Send immediate email
app.post('/api/send-email', async (req, res) => {
    try {
        // Validate request
        const validationErrors = validateEmailRequest(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }
        
        const { recipients, subject, message } = req.body;
        const emails = parseRecipients(recipients);
        
        // For the custom message feature, we won't use the auto-generated message
        // Instead, we'll send a custom email
        const results = [];
        
        for (const email of emails) {
            try {
                // Use the updated sendEmail method with custom subject and message
                const result = await mailer.sendEmail({
                    recipientEmail: email,
                    recipientName: '',
                    companyName: '',
                    resumePath: null,
                    customSubject: subject,
                    customMessage: message,
                    resumeFile: req.body.resumeFile || null
                });
                
                results.push(result);
                
                // Add small delay between emails to avoid rate limiting
                if (emails.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                results.push({
                    success: false,
                    recipient: email,
                    error: error.message
                });
            }
        }
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        res.json({
            success: successCount > 0,
            totalSent: successCount,
            totalFailed: failCount,
            results: results
        });
        
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Schedule email
app.post('/api/schedule-email', async (req, res) => {
    try {
        // Validate request
        const validationErrors = validateEmailRequest(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                errors: validationErrors
            });
        }
        
        const { recipients, subject, message, sendAt } = req.body;
        
        if (!sendAt) {
            return res.status(400).json({
                success: false,
                errors: ['Schedule time (sendAt) is required']
            });
        }
        
        const sendDate = new Date(sendAt);
        if (sendDate <= new Date()) {
            return res.status(400).json({
                success: false,
                errors: ['Schedule time must be in the future']
            });
        }
        
        const emails = parseRecipients(recipients);
        
        // Create a custom schedule for emails with custom subject/message
        const scheduleId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const scheduleData = {
            id: scheduleId,
            type: 'batch',
            isBatch: true,
            recipients: emails.map(email => ({
                email: email,
                customSubject: subject,
                customMessage: message
            })),
            delaySeconds: 1,
            sendAt: sendDate.toISOString(),
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Create scheduled job
        const job = schedule.scheduleJob(sendDate, async () => {
            console.log(`\nExecuting scheduled custom email batch (${emails.length} emails)`);
            
            const results = [];
            for (const recipientData of scheduleData.recipients) {
                const result = await mailer.sendEmail({
                    recipientEmail: recipientData.email,
                    recipientName: '',
                    companyName: '',
                    resumePath: null,
                    customSubject: recipientData.customSubject,
                    customMessage: recipientData.customMessage
                });
                results.push(result);
                
                // Small delay between emails
                if (scheduleData.recipients.length > 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            scheduleData.status = 'sent';
            scheduleData.sentAt = new Date().toISOString();
            mailer.activeSchedules.delete(scheduleId);
            mailer.saveSchedules();
            
            console.log(`✅ Scheduled batch sent: ${results.filter(r => r.success).length}/${results.length} successful`);
        });
        
        mailer.activeSchedules.set(scheduleId, { job, data: scheduleData });
        mailer.saveSchedules();
        
        res.json({
            success: true,
            scheduleId: scheduleId,
            scheduledFor: sendDate.toISOString(),
            recipientCount: emails.length
        });
        
    } catch (error) {
        console.error('Schedule email error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// List scheduled emails
app.get('/api/schedules', (req, res) => {
    try {
        const schedules = Array.from(mailer.activeSchedules.values())
            .map(({ data }) => ({
                id: data.id,
                type: data.type,
                recipientCount: data.recipients?.length || 1,
                sendAt: data.sendAt,
                status: data.status,
                createdAt: data.createdAt
            }));
        
        res.json({
            success: true,
            schedules: schedules
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Cancel scheduled email
app.delete('/api/schedules/:scheduleId', (req, res) => {
    try {
        const { scheduleId } = req.params;
        const success = mailer.cancelSchedule(scheduleId);
        
        if (success) {
            res.json({
                success: true,
                message: 'Schedule cancelled successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Schedule not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/setup.html'));
});

app.get('/composer', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/composer.html'));
});

app.get('/position-portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/position-portfolio.html'));
});

app.get('/final-message', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/final-message.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    
    // Multer errors
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File is too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Upload error: ${error.message}`
        });
    }
    
    // Other errors
    res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(70));
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('='.repeat(70));
    console.log('\n📧 Available endpoints:');
    console.log('   • POST /api/generate-message-from-resume - Generate AI message');
    console.log('   • GET  /composer.html                    - Email composer');
    console.log(`\n✨ Open http://localhost:${PORT}/composer.html in your browser\n`);
});

