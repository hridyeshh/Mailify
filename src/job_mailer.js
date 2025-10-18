import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import schedule from 'node-schedule';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JobApplicationMailer {
    constructor() {
        this.senderEmail = process.env.SENDER_EMAIL;
        this.emailPassword = process.env.EMAIL_PASSWORD;
        this.yourName = process.env.YOUR_NAME || 'Hridyesh Kumar';
        this.yourPhone = process.env.YOUR_PHONE || '+91-8130252611';
        this.yourLinkedIn = process.env.YOUR_LINKEDIN || 'https://www.linkedin.com/in/hridyeshh/';
        this.yourPortfolio = process.env.YOUR_PORTFOLIO || 'https://hridyesh.vercel.app/';
        this.yourResume = process.env.YOUR_RESUME_LINK || 'https://drive.google.com/file/d/1vkm8c_-FRVeqcm908T49kXarBXR8oO21/view?usp=sharing';
        this.resumeFilename = process.env.RESUME_FILENAME || 'hridyesh_resume.pdf';
        
        // Scheduling
        // Store schedules under project-level logs folder
        this.schedulesFile = path.resolve(__dirname, '../data/schedules.json');
        // Ensure logs directory exists
        try {
            fs.mkdirSync(path.dirname(this.schedulesFile), { recursive: true });
        } catch {}
        this.activeSchedules = new Map();
        this.loadSchedules();
        
        // Validate configuration
        if (!this.senderEmail || !this.emailPassword) {
            throw new Error('Missing EMAIL or PASSWORD in .env file!');
        }

        // Create transporter
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.senderEmail,
                pass: this.emailPassword
            }
        });

        console.log(' Job Application Mailer initialized');
        console.log(` Sending from: ${this.senderEmail}\n`);
    }

    /**
     * Extract name from email address
     * @param {string} email - Email address
     * @returns {string} - Extracted name or empty string
     */
    extractNameFromEmail(email) {
        try {
            // Get the part before @
            const username = email.split('@')[0];
            
            // Split by common separators
            const parts = username.split(/[._-]/);
            
            // Process each part: remove numbers and filter out empty/invalid parts
            const validParts = parts
                .map(part => part.replace(/[0-9]/g, ''))  // Remove all numbers
                .filter(part => part.length >= 2);  // Keep only parts with 2+ characters
            
            // If no valid parts found, return empty (will use "Hey," greeting)
            if (validParts.length === 0) {
                return '';
            }
            
            // Capitalize the first valid part
            const firstName = validParts[0].charAt(0).toUpperCase() + validParts[0].slice(1).toLowerCase();
            
            return firstName;
        } catch (error) {
            return '';
        }
    }

    /**
     * Extract company name from email address
     * @param {string} email - Email address
     * @returns {string} - Extracted company name or empty string
     */
    extractCompanyFromEmail(email) {
        try {
            // Get the domain part after @
            const domain = email.split('@')[1];
            
            // Comprehensive list of personal email providers
            const personalEmailProviders = [
                // Gmail and Google services
                'gmail.com', 'googlemail.com',
                
                // Yahoo services
                'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'ymail.com',
                
                // Microsoft services
                'hotmail.com', 'hotmail.co.in', 'hotmail.co.uk', 'hotmail.fr',
                'outlook.com', 'outlook.co.in', 'outlook.co.uk',
                'live.com', 'live.co.in', 'live.co.uk',
                'msn.com',
                
                // Apple services
                'icloud.com', 'me.com', 'mac.com',
                
                // Other personal providers
                'protonmail.com', 'proton.me',
                'aol.com', 'aol.co.uk',
                'zoho.com',
                'yandex.com', 'yandex.ru',
                'mail.com', 'email.com',
                'fastmail.com',
                'tutanota.com',
                'disroot.org',
                'riseup.net'
            ];
            
            // If it's a personal email provider, return empty (will show "your company")
            if (personalEmailProviders.includes(domain.toLowerCase())) {
                return '';
            }
            
            // Extract company name from domain
            const company = domain.split('.')[0]; // Get part before first dot
            
            // Handle special cases
            if (company === 'www') {
                // For www.company.com, get the actual company name
                const parts = domain.split('.');
                if (parts.length > 1) {
                    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
                }
            }
            
            // Capitalize first letter and handle common patterns
            let companyName = company.charAt(0).toUpperCase() + company.slice(1).toLowerCase();
            
            // Handle common company name patterns
            if (companyName.includes('-')) {
                // Convert "company-name" to "Company Name"
                companyName = companyName.split('-').map(part => 
                    part.charAt(0).toUpperCase() + part.slice(1)
                ).join(' ');
            }
            
            return companyName;
        } catch (error) {
            return '';
        }
    }

    /**
     * Create personalized email message
     * @param {string} recipientName - Name of recipient
     * @param {string} companyName - Company name
     * @returns {string} - Formatted email message
     */
    createMessage(recipientName, companyName) {
        const greeting = recipientName ? `Hey ${recipientName},` : 'Hey,';
        
        return `
        <div style="font-family: Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #333;">
            <p>${greeting}</p>
            
            <p>Hope you are doing great and winning at everything you take on!</p>
            
            <p>This is ${this.yourName}. I recently completed my SDE internship at Limeroad, where I built <strong style="font-weight:800;">payment backend</strong> services in <strong style="font-weight:800;">Java</strong>, <strong style="font-weight:800;">Android</strong> features in <strong style="font-weight:800;">Kotlin</strong>, and <strong style="font-weight:800;">web components</strong> using <strong style="font-weight:800;">React/JavaScript</strong>—handling transactions and location services for <strong style="font-weight:800;">50k+ users</strong>. I also worked as a Software Development Intern at College Setu, where I <strong style="font-weight:800;">developed a data collection</strong> portal using Flask and SQL, implementing RESTful web services and optimizing the database. I primarily contributed to projects based on Javascript, Kotlin, and Java, giving me approximately 8 months of overall experience.</p>
            
            <p>I'm actively seeking <strong style="font-weight:800;">SDE-1</strong> opportunities and would greatly appreciate your referral for any suitable openings at ${companyName || 'your company'}. If possible, could you review my attached resume and consider referring me, or forward it to the appropriate team?</p>
            
            <p>Thank you for your consideration.</p>
            
            <p>Regards,<br><br>
            ${this.yourName}<br>
            Mail - ${this.senderEmail}<br>
            Phone - ${this.yourPhone}<br><br>
            <a href="${this.yourLinkedIn}" style="color: #1a73e8; text-decoration: underline;">LinkedIn</a> | <a href="${this.yourPortfolio}" style="color: #1a73e8; text-decoration: underline;">Portfolio</a> | <a href="${this.yourResume}" style="color: #1a73e8; text-decoration: underline;">Resume</a>
            </p>
        </div>`;
    }

    /**
     * Send job application email
     * @param {Object} options - Email options
     * @param {string} options.recipientEmail - Recipient email address
     * @param {string} options.recipientName - Recipient name (optional)
     * @param {string} options.companyName - Company name
     * @param {string} options.resumePath - Path to resume file (optional)
     * @param {string} options.customSubject - Custom subject line (optional)
     * @param {string} options.customMessage - Custom message body (optional)
     * @param {Object} options.resumeFile - Resume file object with base64 data (optional)
     * @returns {Promise<Object>} - Email send result
     */
    async sendEmail({ recipientEmail, recipientName = '', companyName = '', resumePath = null, customSubject = '', customMessage = '', resumeFile = null }) {
        try {
            // Extract name from email if not provided
            const name = recipientName || this.extractNameFromEmail(recipientEmail);
            
            // Extract company name from email if not provided
            const detectedCompany = companyName || this.extractCompanyFromEmail(recipientEmail);
            
            // Use custom message or create default message
            const message = customMessage || this.createMessage(name, detectedCompany);
            
            // Use custom subject or create default subject
            const subject = customSubject || `${this.yourName} SDE application`;
            
            // Prepare email options
            const mailOptions = {
                from: `${this.yourName} <${this.senderEmail}>`,
                to: recipientEmail,
                subject: subject,
                html: message
            };

            // Add resume attachment if provided
            if (resumeFile && resumeFile.data) {
                // Handle base64 file attachment
                mailOptions.attachments = [{
                    filename: resumeFile.filename,
                    content: resumeFile.data.split(',')[1], // Remove data:type;base64, prefix
                    encoding: 'base64'
                }];
                console.log(`📎 Attaching resume: ${resumeFile.filename}`);
            } else if (resumePath && fs.existsSync(resumePath)) {
                // Handle file path attachment (legacy support)
                mailOptions.attachments = [{
                    filename: path.basename(resumePath),
                    path: resumePath
                }];
                console.log(`📎 Attaching resume: ${path.basename(resumePath)}`);
            } else if (resumePath) {
                console.log(`Resume not found at: ${resumePath}`);
                console.log('Sending email without attachment...');
            }

            // Send email
            const info = await this.transporter.sendMail(mailOptions);
            
            console.log(`Email sent to ${recipientEmail} (${name || 'No name'}) at ${detectedCompany || 'your company'}`);
            console.log(`Message ID: ${info.messageId}\n`);
            
            return {
                success: true,
                recipient: recipientEmail,
                name: name || 'No name',
                company: detectedCompany || 'your company',
                messageId: info.messageId
            };
        } catch (error) {
            console.error(`Failed to send email to ${recipientEmail}:`, error.message);
            return {
                success: false,
                recipient: recipientEmail,
                name: recipientName || 'No name',
                company: companyName || this.extractCompanyFromEmail(recipientEmail) || 'your company',
                error: error.message
            };
        }
    }

    /**
     * Send emails to multiple recipients
     * @param {Array<Object>} recipients - Array of recipient objects
     * @param {number} delaySeconds - Delay between emails (default: 5 seconds)
     * @returns {Promise<Array>} - Array of results
     */
    async sendBatch(recipients, delaySeconds = 5) {
        console.log(`📨 Starting batch send to ${recipients.length} recipients...\n`);
        
        const results = [];
        
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            console.log(`[${i + 1}/${recipients.length}] Sending to ${recipient.email}...`);
            
            const result = await this.sendEmail({
                recipientEmail: recipient.email,
                recipientName: recipient.name || '',
                companyName: recipient.company || 'your company',
                resumePath: recipient.resumePath || null
            });
            
            results.push(result);
            
            // Add delay between emails (except for last one)
            if (i < recipients.length - 1) {
                console.log(`Waiting ${delaySeconds} seconds before next email...\n`);
                await this.delay(delaySeconds * 1000);
            }
        }
        
        // Print summary
        this.printSummary(results);
        
        return results;
    }

    /**
     * Delay helper function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Print summary of batch send
     * @param {Array} results - Array of send results
     */
    printSummary(results) {
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log('\n' + '='.repeat(50));
        console.log(' BATCH SEND SUMMARY');
        console.log('='.repeat(50));
        console.log(`Successful: ${successful}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${results.length}`);
        console.log('='.repeat(50) + '\n');
        
        if (failed > 0) {
            console.log('Failed emails:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`  ${r.recipient} (${r.company}) - ${r.error}`);
            });
            console.log('');
        }
    }

    /**
     * email configuration
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            console.log('Testing email configuration...');
            await this.transporter.verify();
            console.log('Email configuration is valid!\n');
            return true;
        } catch (error) {
            console.error('Email configuration test failed:', error.message);
            console.log('\nTips:');
            console.log('1. Make sure you\'re using a Gmail App Password (not your regular password)');
            console.log('2. Check your .env file has correct SENDER_EMAIL and EMAIL_PASSWORD');
            console.log('3. Visit: https://myaccount.google.com/apppasswords\n');
            return false;
        }
    }

    // =========================================================================
    // SCHEDULING METHODS
    // =========================================================================

    /**
     * Load scheduled emails from file
     */
    loadSchedules() {
        try {
            if (fs.existsSync(this.schedulesFile)) {
                const data = JSON.parse(fs.readFileSync(this.schedulesFile, 'utf8'));
                
                // Restore schedules that haven't been sent yet
                const now = new Date();
                data.schedules?.forEach(scheduleData => {
                    const sendAt = new Date(scheduleData.sendAt);
                    if (sendAt > now && scheduleData.status === 'pending') {
                        this.restoreSchedule(scheduleData);
                    }
                });
                
                console.log(`Loaded ${this.activeSchedules.size} scheduled emails from file`);
            }
        } catch (error) {
            console.error('Failed to load schedules:', error.message);
        }
    }

    /**
     * Save schedules to file
     */
    saveSchedules() {
        try {
            // Ensure logs directory exists before writing
            fs.mkdirSync(path.dirname(this.schedulesFile), { recursive: true });
            const schedules = Array.from(this.activeSchedules.values()).map(({ data }) => data);
            fs.writeFileSync(this.schedulesFile, JSON.stringify({ schedules }, null, 2));
        } catch (error) {
            console.error('Failed to save schedules:', error.message);
        }
    }

    /**
     * Restore a schedule from saved data
     * @param {Object} scheduleData - Saved schedule data
     */
    restoreSchedule(scheduleData) {
        const sendAt = new Date(scheduleData.sendAt);
        
        const job = schedule.scheduleJob(sendAt, async () => {
            console.log(`\nExecuting scheduled email: ${scheduleData.id}`);
            
            if (scheduleData.isBatch) {
                await this.sendBatch(scheduleData.recipients, scheduleData.delaySeconds || 5);
            } else {
                await this.sendEmail(scheduleData.emailData);
            }
            
            scheduleData.status = 'sent';
            scheduleData.sentAt = new Date().toISOString();
            this.activeSchedules.delete(scheduleData.id);
            this.saveSchedules();
        });
        
        this.activeSchedules.set(scheduleData.id, { job, data: scheduleData });
    }

    /**
     * Schedule a single email
     * @param {Object} options - Scheduling options
     * @param {string} options.recipientEmail - Recipient email
     * @param {string} options.recipientName - Recipient name (optional)
     * @param {string} options.companyName - Company name
     * @param {string|Date} options.sendAt - When to send (date string or Date object)
     * @param {string} options.resumePath - Resume path (optional)
     * @returns {string} - Schedule ID
     */
    scheduleEmail({ recipientEmail, recipientName = '', companyName, sendAt, resumePath = null }) {
        const scheduleId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sendDate = typeof sendAt === 'string' ? new Date(sendAt) : sendAt;
        
        // Validate date
        if (sendDate <= new Date()) {
            throw new Error('Send time must be in the future!');
        }
        
        const scheduleData = {
            id: scheduleId,
            type: 'single',
            isBatch: false,
            emailData: { recipientEmail, recipientName, companyName, resumePath },
            sendAt: sendDate.toISOString(),
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Create scheduled job
        const job = schedule.scheduleJob(sendDate, async () => {
            console.log(`\nExecuting scheduled email to ${recipientEmail}`);
            await this.sendEmail(scheduleData.emailData);
            
            scheduleData.status = 'sent';
            scheduleData.sentAt = new Date().toISOString();
            this.activeSchedules.delete(scheduleId);
            this.saveSchedules();
        });
        
        this.activeSchedules.set(scheduleId, { job, data: scheduleData });
        this.saveSchedules();
        
        const name = recipientName || this.extractNameFromEmail(recipientEmail);
        console.log(`Scheduled email to ${recipientEmail} (${name || 'No name'}) at ${companyName}`);
        console.log(`Will send at: ${sendDate.toLocaleString()}`);
        console.log(`Schedule ID: ${scheduleId}\n`);
        
        return scheduleId;
    }

    /**
     * Schedule batch emails
     * @param {Array<Object>} recipients - Array of recipient objects
     * @param {string|Date} sendAt - When to send
     * @param {number} delaySeconds - Delay between emails (default: 5)
     * @returns {string} - Schedule ID
     */
    scheduleBatch(recipients, sendAt, delaySeconds = 5) {
        const scheduleId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sendDate = typeof sendAt === 'string' ? new Date(sendAt) : sendAt;
        
        // Validate date
        if (sendDate <= new Date()) {
            throw new Error('Send time must be in the future!');
        }
        
        const scheduleData = {
            id: scheduleId,
            type: 'batch',
            isBatch: true,
            recipients: recipients,
            delaySeconds: delaySeconds,
            sendAt: sendDate.toISOString(),
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        
        // Create scheduled job
        const job = schedule.scheduleJob(sendDate, async () => {
            console.log(`\nExecuting scheduled batch send (${recipients.length} emails)`);
            await this.sendBatch(scheduleData.recipients, scheduleData.delaySeconds);
            
            scheduleData.status = 'sent';
            scheduleData.sentAt = new Date().toISOString();
            this.activeSchedules.delete(scheduleId);
            this.saveSchedules();
        });
        
        this.activeSchedules.set(scheduleId, { job, data: scheduleData });
        this.saveSchedules();
        
        console.log(`Scheduled batch send to ${recipients.length} recipients`);
        console.log(`Will send at: ${sendDate.toLocaleString()}`);
        console.log(`Schedule ID: ${scheduleId}\n`);
        
        return scheduleId;
    }

    /**
     * Schedule recurring emails
     * @param {Object} options - Recurring options
     * @param {Array<Object>} options.recipients - Recipients array
     * @param {string} options.cronPattern - Cron pattern (e.g., '0 9 * * 1' for Mondays at 9 AM)
     * @param {number} options.delaySeconds - Delay between emails (default: 5)
     * @returns {string} - Schedule ID
     */
    scheduleRecurring({ recipients, cronPattern, delaySeconds = 5 }) {
        const scheduleId = `recurring_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const scheduleData = {
            id: scheduleId,
            type: 'recurring',
            isBatch: true,
            recipients: recipients,
            delaySeconds: delaySeconds,
            cronPattern: cronPattern,
            createdAt: new Date().toISOString(),
            status: 'active',
            executions: []
        };
        
        // Create recurring job
        const job = schedule.scheduleJob(cronPattern, async () => {
            const execTime = new Date().toISOString();
            console.log(`\nExecuting recurring batch send (${recipients.length} emails)`);
            
            await this.sendBatch(scheduleData.recipients, scheduleData.delaySeconds);
            
            scheduleData.executions.push(execTime);
            this.saveSchedules();
        });
        
        this.activeSchedules.set(scheduleId, { job, data: scheduleData });
        this.saveSchedules();
        
        console.log(`Scheduled recurring batch send to ${recipients.length} recipients`);
        console.log(`Cron pattern: ${cronPattern}`);
        console.log(`Schedule ID: ${scheduleId}\n`);
        console.log('Common patterns:');
        console.log('0 9 * * 1-5  = Weekdays at 9 AM');
        console.log('0 10 * * 1   = Every Monday at 10 AM');
        console.log('30 14 * * *  = Every day at 2:30 PM\n');
        
        return scheduleId;
    }

    /**
     * List all scheduled emails
     */
    listSchedules() {
        if (this.activeSchedules.size === 0) {
            console.log('📭 No scheduled emails\n');
            return;
        }
        
        console.log('='.repeat(70));
        console.log('SCHEDULED EMAILS');
        console.log('='.repeat(70));
        
        const schedules = Array.from(this.activeSchedules.values())
            .map(({ data }) => data)
            .sort((a, b) => {
                if (a.type === 'recurring') return 1;
                if (b.type === 'recurring') return -1;
                return new Date(a.sendAt) - new Date(b.sendAt);
            });
        
        schedules.forEach((schedule, index) => {
            console.log(`\n[${index + 1}] ${schedule.type.toUpperCase()}`);
            console.log(`ID: ${schedule.id}`);
            
            if (schedule.type === 'single') {
                console.log(`To: ${schedule.emailData.recipientEmail}`);
                console.log(`Company: ${schedule.emailData.companyName}`);
                console.log(`Send at: ${new Date(schedule.sendAt).toLocaleString()}`);
            } else if (schedule.type === 'batch') {
                console.log(`Recipients: ${schedule.recipients.length} emails`);
                console.log(`Send at: ${new Date(schedule.sendAt).toLocaleString()}`);
            } else if (schedule.type === 'recurring') {
                console.log(`Recipients: ${schedule.recipients.length} emails`);
                console.log(`Pattern: ${schedule.cronPattern}`);
                console.log(`Executions: ${schedule.executions.length}`);
                if (schedule.executions.length > 0) {
                    const lastExec = schedule.executions[schedule.executions.length - 1];
                    console.log(`    Last run: ${new Date(lastExec).toLocaleString()}`);
                }
            }
            
            console.log(`Created: ${new Date(schedule.createdAt).toLocaleString()}`);
            console.log(`Status: ${schedule.status}`);
        });
        
        console.log('\n' + '='.repeat(70) + '\n');
    }

    /**
     * Cancel a scheduled email
     * @param {string} scheduleId - Schedule ID to cancel
     * @returns {boolean} - Success status
     */
    cancelSchedule(scheduleId) {
        const schedule = this.activeSchedules.get(scheduleId);
        
        if (!schedule) {
            console.log(`Schedule not found: ${scheduleId}\n`);
            return false;
        }
        
        // Cancel the job
        schedule.job.cancel();
        
        // Update status
        schedule.data.status = 'cancelled';
        schedule.data.cancelledAt = new Date().toISOString();
        
        // Remove from active schedules
        this.activeSchedules.delete(scheduleId);
        this.saveSchedules();
        
        console.log(`Cancelled schedule: ${scheduleId}\n`);
        return true;
    }

    /**
     * Cancel all scheduled emails
     * @returns {number} - Number of cancelled schedules
     */
    cancelAllSchedules() {
        const count = this.activeSchedules.size;
        
        this.activeSchedules.forEach((schedule) => {
            schedule.job.cancel();
        });
        
        this.activeSchedules.clear();
        this.saveSchedules();
        
        console.log(`Cancelled ${count} scheduled emails\n`);
        return count;
    }
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

async function main() {
    try {
        // Initialize mailer
        const mailer = new JobApplicationMailer();
        
        // Test connection first
        const isValid = await mailer.testConnection();
        if (!isValid) {
            process.exit(1);
        }

        // =======================================================================
        // OPTION 1: SEND SINGLE EMAIL
        // =======================================================================
        // Uncomment the code below to send a single email
        
        /*
        await mailer.sendEmail({
            recipientEmail: 'hr@example.com',
            recipientName: 'Priya',  // Optional - will extract from email if not provided
            companyName: '',  // Optional - will auto-detect from email domain
            resumePath: null  // Optional - no resume attached (or specify path to attach resume)
        });
        */

        // =======================================================================
        // OPTION 2: SEND BATCH EMAILS
        // =======================================================================
        // Uncomment and modify the code below to send multiple emails
        
        /*
        const recipients = [
            { 
                email: 'hr@google.com', 
                name: 'Priya',  // Optional
                company: 'Google',
                resumePath: null  // Optional - no resume attached
            },
            { 
                email: 'john.doe@microsoft.com', 
                name: '',  // Will extract "John" from email
                company: 'Microsoft',
                resumePath: null  // Optional - no resume attached
            },
            { 
                email: 'careers@amazon.com', 
                name: '',  // Will use "Hey," since no name
                company: 'Amazon',
                resumePath: null  // Optional - no resume attached
            }
        ];
        
        await mailer.sendBatch(recipients, 5);  // 5 seconds delay between emails
        */

        // =======================================================================
        // OPTION 3: LOAD RECIPIENTS FROM JSON FILE
        // =======================================================================
        // Uncomment to load recipients from data/recipients.json
        
        /*
        const recipientsData = JSON.parse(fs.readFileSync('./data/recipients.json', 'utf8'));
        await mailer.sendBatch(recipientsData.recipients, 5);
        */

        // =======================================================================
        // OPTION 4: SCHEDULE SINGLE EMAIL
        // =======================================================================
        // Schedule an email to be sent at a specific time
        
        /*
        mailer.scheduleEmail({
            recipientEmail: 'hr@google.com',
            recipientName: 'Priya',
            companyName: 'Google',
            sendAt: '2025-10-13 10:00'  // YYYY-MM-DD HH:MM format
        });
        */

        // =======================================================================
        // OPTION 5: SCHEDULE BATCH EMAILS
        // =======================================================================
        // Schedule multiple emails to be sent at a specific time
        
        /*
        const recipients = [
            { email: 'hr@google.com', name: 'Priya', company: 'Google' },
            { email: 'john@microsoft.com', name: '', company: 'Microsoft' }
        ];
        
        mailer.scheduleBatch(recipients, '2025-10-15 09:00', 5);
        */

        // =======================================================================
        // OPTION 6: SCHEDULE RECURRING EMAILS
        // =======================================================================
        // Set up recurring emails (e.g., every Monday at 10 AM)
        
        /*
        const recipients = [
            { email: 'hr@google.com', name: 'Priya', company: 'Google' }
        ];
        
        mailer.scheduleRecurring({
            recipients: recipients,
            cronPattern: '0 10 * * 1',  // Every Monday at 10 AM
            delaySeconds: 5
        });
        */

        // =======================================================================
        // MANAGE SCHEDULES
        // =======================================================================
        // View, cancel, or manage scheduled emails
        
        /*
        // List all scheduled emails
        mailer.listSchedules();
        
        // Cancel a specific schedule (use the ID from listSchedules)
        // mailer.cancelSchedule('email_1234567890_abc123');
        
        // Cancel all schedules
        // mailer.cancelAllSchedules();
        */

        console.log('TIP: Uncomment the code in job_mailer.js to send emails!');
        console.log('Edit the recipients array or use data/recipients.json for batch sending.');
        console.log('NEW: You can now schedule emails for later using scheduleEmail()!\n');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run the script if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export for use in other scripts
export { JobApplicationMailer };

