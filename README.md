# Job Application Email Automation

Automated Node.js script to send personalized job application emails with resume attachments.

## 🚀 Quick Start Options

### Option 1: Web UI (Recommended for beginners)
```bash
npm run server
# Open http://localhost:3000 in your browser
```
👉 **[Web UI Guide](docs/WEB_UI_GUIDE.md)** - Complete guide for using the web interface

### Option 2: Command Line (For automation)
```bash
node src/job_mailer.js
```
👉 Continue reading below for command-line setup and usage

---

## Features

- 🌐 **Web Interface** - Modern UI for easy email sending (NEW!)
- 📧 **Automatic name extraction** from email addresses
- 🎯 **Personalized messages** with recipient name and company
- 📎 **Resume attachment** support
- 📦 **Batch sending** with configurable delays
- ⏰ **Email scheduling** - send at specific times or recurring
- 💾 **Persistent schedules** - survives script restarts
- 🔒 **Secure** - credentials stored in `.env` file
- ✅ **Connection testing** before sending
- 🎨 **Custom messages** - Support for any email content (not just job applications)

## Prerequisites

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org)
- **Gmail account** with 2-Factor Authentication enabled
- **Gmail App Password** - [Get it here](https://myaccount.google.com/apppasswords)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs `nodemailer` and `dotenv` packages.

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your details:

```env
SENDER_EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
YOUR_NAME=Hridyesh Kumar
YOUR_PHONE=+91-8130252611
YOUR_LINKEDIN=https://linkedin.com/in/yourprofile
YOUR_PORTFOLIO=https://yourportfolio.com
YOUR_RESUME_LINK=https://yourresume.com
RESUME_FILENAME=Hridyesh_Kumar_Resume.pdf
```

### 3. Add Your Resume

Place your resume PDF in the project folder with the name specified in `.env` (default: `Hridyesh_Kumar_Resume.pdf`)

### 4. Test Connection

```bash
npm start
```

This tests your email configuration.

## Usage

### Option 1: Single Email

Edit `job_mailer.js` and uncomment this section:

```javascript
await mailer.sendEmail({
    recipientEmail: 'hr@google.com',
    recipientName: 'Priya',  // Optional
    companyName: 'Google',
    resumePath: null  // Optional
});
```

Run:
```bash
npm start
```

### Option 2: Batch Emails (Array)

Edit `job_mailer.js` and uncomment this section:

```javascript
const recipients = [
    { email: 'hr@google.com', name: 'Priya', company: 'Google' },
    { email: 'john.doe@microsoft.com', name: '', company: 'Microsoft' },
    { email: 'careers@amazon.com', name: '', company: 'Amazon' }
];

await mailer.sendBatch(recipients, 5);  // 5 seconds delay
```

Run:
```bash
npm start
```

### Option 3: Batch Emails (JSON File)

Edit `recipients.json`:

```json
{
  "recipients": [
    { "email": "hr@google.com", "name": "Priya", "company": "Google" },
    { "email": "john@microsoft.com", "name": "", "company": "Microsoft" }
  ]
}
```

Edit `job_mailer.js` and uncomment this section:

```javascript
const recipientsData = JSON.parse(fs.readFileSync('recipients.json', 'utf8'));
await mailer.sendBatch(recipientsData.recipients, 5);
```

Run:
```bash
npm start
```

### Option 4: Schedule Single Email

Schedule an email to be sent at a specific time:

```javascript
mailer.scheduleEmail({
    recipientEmail: 'hr@google.com',
    recipientName: 'Priya',
    companyName: 'Google',
    sendAt: '2025-10-15 10:00'  // YYYY-MM-DD HH:MM
});
```

Run:
```bash
npm start
```

The script must keep running for scheduled emails to be sent. Use a process manager like `pm2` or run in background.

### Option 5: Schedule Batch Emails

Schedule multiple emails at a specific time:

```javascript
const recipients = [
    { email: 'hr@google.com', name: 'Priya', company: 'Google' },
    { email: 'john@microsoft.com', name: '', company: 'Microsoft' }
];

mailer.scheduleBatch(recipients, '2025-10-15 09:00', 5);
```

### Option 6: Recurring Emails

Set up emails to send automatically on a schedule:

```javascript
const recipients = [
    { email: 'hr@google.com', name: 'Priya', company: 'Google' }
];

mailer.scheduleRecurring({
    recipients: recipients,
    cronPattern: '0 10 * * 1',  // Every Monday at 10 AM
    delaySeconds: 5
});
```

**Common Cron Patterns:**
- `0 9 * * 1-5` - Weekdays at 9:00 AM
- `0 10 * * 1` - Every Monday at 10:00 AM
- `30 14 * * *` - Every day at 2:30 PM
- `0 8 * * 6` - Every Saturday at 8:00 AM

### Manage Schedules

```javascript
// List all scheduled emails
mailer.listSchedules();

// Cancel a specific schedule
mailer.cancelSchedule('email_1234567890_abc123');

// Cancel all schedules
mailer.cancelAllSchedules();
```

**Important Notes:**
- Schedules are saved to `schedules.json` and persist across restarts
- The script must be running for scheduled emails to be sent
- Use `pm2` or similar tools to keep the script running in background
- To run in background: `node job_mailer.js &` or use `pm2 start job_mailer.js`

## How It Works

### Name Extraction

If you don't provide a recipient name, the script automatically extracts it from the email:

- `priya.sharma@google.com` → "Priya"
- `john_doe@microsoft.com` → "John"
- `hr@amazon.com` → Uses "Hey," (no name detected)

### Email Template

```
Subject: Hridyesh Kumar SDE application

Hey [Name],

Hope you are doing great and winning at everything you take on!

This is Hridyesh Kumar. I recently completed my SDE internship at Limeroad...
[Your full message]

Regards,
Hridyesh Kumar
Mail - hridyesh2309@gmail.com
Phone - +91-8130252611
LinkedIn | Portfolio | Resume
```

### Batch Sending

- Sends emails with configurable delays (default: 5 seconds)
- Prevents Gmail rate limiting
- Shows progress and summary
- Continues even if one email fails

## Troubleshooting

### "Invalid login" error
- Make sure you're using Gmail App Password (16 characters)
- Not your regular Gmail password
- Get it from: https://myaccount.google.com/apppasswords

### "Resume not found" warning
- Check the filename matches `.env` configuration
- Ensure resume is in the project root folder
- Email will still send (without attachment)

### "Too many requests" error
- Increase delay between emails
- Change `delaySeconds` parameter (e.g., 10 seconds)

## Tips

- 🔐 **Never commit `.env` to Git** - it's already in `.gitignore`
- ⏱️ **Use delays** - avoid sending too many emails quickly
- ✅ **Test first** - send to yourself before batch sending
- 📊 **Track results** - script shows summary after batch sending

## Customization

To customize the email message, edit the `createMessage()` method in `job_mailer.js`:

```javascript
createMessage(recipientName, companyName) {
    const greeting = recipientName ? `Hey ${recipientName},` : 'Hey,';
    
    return `${greeting}

[Your custom message here]

Regards,
${this.yourName}`;
}
```

## Project Structure

```
job-application-mailer/
├── package.json              # Dependencies
├── .env                      # Your credentials (DO NOT COMMIT)
├── env_template.txt          # Template for .env
├── .gitignore                # Git ignore rules
├── README.md                 # This file
├── src/                      # Source code
│   ├── job_mailer.js        # Main script
│   ├── server.js            # Web UI server
│   └── schedule_demo.js     # Scheduling demo
├── public/                   # Web UI files
│   ├── composer.html        # Email composer UI
│   └── setup.html           # Setup guide UI
├── data/                     # Data files
│   ├── recipients.json      # Recipients list
│   └── schedules.json       # Scheduled emails
├── docs/                     # Documentation
│   ├── CHANGELOG.md         # Version history
│   ├── WEB_UI_GUIDE.md      # Web UI guide
│   ├── SCHEDULING_GUIDE.md  # Scheduling guide
│   └── ...                  # Other docs
└── resumes/                  # Resume files
    └── hridyesh_resume.pdf  # Your resume
```

## License

MIT

## Author

Hridyesh Kumar
- Email: hridyesh2309@gmail.com
- Phone: +91-8130252611

