# Quick Start: Email Scheduling

Get started with email scheduling in under 5 minutes!

## ⚡ Super Quick Examples

### 1. Schedule Email for Tomorrow at 10 AM

```javascript
mailer.scheduleEmail({
    recipientEmail: 'hr@google.com',
    recipientName: 'Priya',
    companyName: 'Google',
    sendAt: '2025-10-13 10:00'
});
```

### 2. Schedule Batch for Next Monday

```javascript
const recipients = [
    { email: 'hr@google.com', name: 'Priya', company: 'Google' },
    { email: 'john@microsoft.com', name: '', company: 'Microsoft' }
];

mailer.scheduleBatch(recipients, '2025-10-14 09:00', 5);
```

### 3. Send Every Monday at 10 AM

```javascript
mailer.scheduleRecurring({
    recipients: recipients,
    cronPattern: '0 10 * * 1',  // Every Monday at 10 AM
    delaySeconds: 5
});
```

### 4. See All Scheduled Emails

```javascript
mailer.listSchedules();
```

### 5. Cancel a Schedule

```javascript
mailer.cancelSchedule('email_1234567890_abc123');
```

---

## 🎯 Date Formats

**Simple string (easiest):**
```javascript
sendAt: '2025-10-15 10:00'  // YYYY-MM-DD HH:MM
```

**Relative time:**
```javascript
// 2 hours from now
const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);
sendAt: twoHoursLater
```

**Tomorrow at specific time:**
```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);  // 10:00 AM
sendAt: tomorrow
```

---

## 📅 Common Cron Patterns

Copy-paste these patterns for recurring schedules:

```javascript
'0 9 * * 1-5'   // Weekdays at 9:00 AM
'0 10 * * 1'    // Every Monday at 10:00 AM
'0 14 * * 2,4'  // Tuesday & Thursday at 2:00 PM
'30 9 * * *'    // Every day at 9:30 AM
'0 8 1 * *'     // First day of month at 8:00 AM
```

---

## 🚀 How to Use

### Step 1: Open `job_mailer.js`

Find the scheduling section (around line 627) and uncomment:

```javascript
// OPTION 4: SCHEDULE SINGLE EMAIL
mailer.scheduleEmail({
    recipientEmail: 'hr@google.com',
    recipientName: 'Priya',
    companyName: 'Google',
    sendAt: '2025-10-15 10:00'
});
```

### Step 2: Run the Script

```bash
npm start
```

### Step 3: Keep It Running

**Quick way (terminal):**
```bash
node job_mailer.js
```
Leave the terminal open.

**Better way (background):**
```bash
npm install -g pm2
pm2 start job_mailer.js --name "job-mailer"
pm2 logs job-mailer
```

---

## ✅ Complete Example

Here's a full working example you can use:

```javascript
import { JobApplicationMailer } from './job_mailer.js';
import fs from 'fs';

async function main() {
    const mailer = new JobApplicationMailer();
    await mailer.testConnection();
    
    // Schedule single email for tomorrow 10 AM
    mailer.scheduleEmail({
        recipientEmail: 'hr@google.com',
        recipientName: 'Priya',
        companyName: 'Google',
        sendAt: '2025-10-13 10:00'
    });
    
    // Schedule batch from JSON file
    const data = JSON.parse(fs.readFileSync('recipients.json', 'utf8'));
    mailer.scheduleBatch(data.recipients, '2025-10-14 09:00', 5);
    
    // View all schedules
    mailer.listSchedules();
    
    console.log('✅ Schedules created! Keep script running...');
}

main();
```

---

## 🎬 Try the Demo

See scheduling in action with test emails:

```bash
npm run demo
```

This schedules emails for 2 and 5 minutes from now (to test addresses).

---

## 📖 Need More Help?

- **Full Guide**: Read `SCHEDULING_GUIDE.md`
- **Setup**: Read `README.md`
- **Changes**: Read `CHANGELOG.md`

---

## 💡 Pro Tips

1. **Best send times**: Tuesday/Wednesday 9-11 AM
2. **Delays**: Use 8-10 seconds between batch emails
3. **Test first**: Schedule to yourself before real campaigns
4. **Monitor**: Use `pm2 logs job-mailer` to watch execution
5. **Backup**: `schedules.json` stores all your schedules

---

## 🆘 Quick Troubleshooting

**Schedule not sending?**
- Is script still running? Check with `pm2 list`
- Is time in the future? Check with `mailer.listSchedules()`

**Lost schedules?**
- Check `schedules.json` file exists
- Schedules auto-restore on restart

**Rate limit errors?**
- Increase delay to 10+ seconds
- Reduce batch size to 50 emails max

---

Happy scheduling! 🚀📧

