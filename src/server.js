import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import schedule from 'node-schedule';
import { JobApplicationMailer } from './job_mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📧 Mail sender UI available at http://localhost:${PORT}\n`);
});

