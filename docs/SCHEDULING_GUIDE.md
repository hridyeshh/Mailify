# Email Scheduling Guide

Complete guide to scheduling job application emails with the Job Application Mailer.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Scheduling Single Emails](#scheduling-single-emails)
3. [Scheduling Batch Emails](#scheduling-batch-emails)
4. [Recurring Schedules](#recurring-schedules)
5. [Managing Schedules](#managing-schedules)
6. [Running in Background](#running-in-background)
7. [Best Practices](#best-practices)

---

## Quick Start

### Test Scheduling (Demo)

Run the demo to see scheduling in action:

```bash
npm run demo
```

This schedules test emails for 2 and 5 minutes from now. Press `Ctrl+C` to cancel.

---

## Scheduling Single Emails

### Basic Example

```javascript
mailer.scheduleEmail({
    recipientEmail: 'hr@google.com',
    recipientName: 'Priya',
    companyName: 'Google',
    sendAt: '2025-10-15 10:00'
});
```

### Date Formats Supported

**String format (recommended):**
```javascript
sendAt: '2025-10-15 10:00'        // YYYY-MM-DD HH:MM
sendAt: '2025-10-15 09:30:00'     // YYYY-MM-DD HH:MM:SS
```

**Date object:**
```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

mailer.scheduleEmail({
    recipientEmail: 'hr@google.com',
    companyName: 'Google',
    sendAt: tomorrow
});
```

### Response

Returns a schedule ID:
```javascript
const scheduleId = mailer.scheduleEmail({...});
console.log(scheduleId);  // email_1697123456789_abc123xyz
```

---

## Scheduling Batch Emails

Schedule multiple emails to send at the same time:

```javascript
const recipients = [
    { email: 'hr@google.com', name: 'Priya', company: 'Google' },
    { email: 'john@microsoft.com', name: 'John', company: 'Microsoft' },
    { email: 'careers@amazon.com', name: '', company: 'Amazon' }
];

mailer.scheduleBatch(
    recipients,
    '2025-10-15 09:00',  // When to send
    5                     // Delay between emails in seconds
);
```

### From JSON File

```javascript
const recipientsData = JSON.parse(fs.readFileSync('recipients.json', 'utf8'));
mailer.scheduleBatch(recipientsData.recipients, '2025-10-15 09:00', 5);
```

---

## Recurring Schedules

### Basic Recurring Schedule

```javascript
mailer.scheduleRecurring({
    recipients: recipients,
    cronPattern: '0 10 * * 1',  // Every Monday at 10 AM
    delaySeconds: 5
});
```

### Common Cron Patterns

| Pattern | Description |
|---------|-------------|
| `0 9 * * 1-5` | Every weekday at 9:00 AM |
| `0 10 * * 1` | Every Monday at 10:00 AM |
| `30 14 * * *` | Every day at 2:30 PM |
| `0 8 1 * *` | First day of month at 8:00 AM |
| `0 9 * * 6` | Every Saturday at 9:00 AM |

### Cron Pattern Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 7) (Sunday = 0 or 7)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Examples:**
```
0 10 * * 1-5  → Weekdays (Mon-Fri) at 10:00 AM
30 9 1,15 * * → 1st and 15th of month at 9:30 AM
0 */2 * * *   → Every 2 hours
```

### Use Cases

**Weekly outreach:**
```javascript
// Every Monday morning
mailer.scheduleRecurring({
    recipients: weeklyRecipients,
    cronPattern: '0 9 * * 1',
    delaySeconds: 5
});
```

**Daily applications:**
```javascript
// Every weekday at 10 AM
mailer.scheduleRecurring({
    recipients: dailyRecipients,
    cronPattern: '0 10 * * 1-5',
    delaySeconds: 5
});
```

---

## Managing Schedules

### List All Schedules

```javascript
mailer.listSchedules();
```

Output:
```
======================================================================
📅 SCHEDULED EMAILS
======================================================================

[1] SINGLE
    ID: email_1697123456789_abc123
    To: hr@google.com
    Company: Google
    Send at: 10/15/2025, 10:00:00 AM
    Created: 10/12/2025, 2:30:00 PM
    Status: pending

[2] BATCH
    ID: batch_1697123456790_xyz789
    Recipients: 5 emails
    Send at: 10/15/2025, 9:00:00 AM
    Created: 10/12/2025, 2:35:00 PM
    Status: pending

[3] RECURRING
    ID: recurring_1697123456791_def456
    Recipients: 3 emails
    Pattern: 0 10 * * 1
    Executions: 2
    Last run: 10/9/2025, 10:00:00 AM
    Created: 10/1/2025, 9:00:00 AM
    Status: active

======================================================================
```

### Cancel a Schedule

```javascript
// Get the schedule ID from listSchedules()
mailer.cancelSchedule('email_1697123456789_abc123');
```

### Cancel All Schedules

```javascript
mailer.cancelAllSchedules();
```

### Check Schedule Count

```javascript
console.log(`Active schedules: ${mailer.activeSchedules.size}`);
```

---

## Running in Background

For scheduled emails to work, the script must keep running.

### Option 1: Terminal Background

**macOS/Linux:**
```bash
nohup node job_mailer.js > mailer.log 2>&1 &
```

**Check if running:**
```bash
ps aux | grep job_mailer
```

**Stop:**
```bash
pkill -f job_mailer
```

### Option 2: Using PM2 (Recommended)

**Install PM2:**
```bash
npm install -g pm2
```

**Start mailer:**
```bash
pm2 start job_mailer.js --name "job-mailer"
```

**Useful PM2 commands:**
```bash
pm2 list                    # List all processes
pm2 logs job-mailer         # View logs
pm2 stop job-mailer         # Stop
pm2 restart job-mailer      # Restart
pm2 delete job-mailer       # Remove
pm2 startup                 # Auto-start on reboot
pm2 save                    # Save current process list
```

**View schedules with PM2:**
```bash
pm2 logs job-mailer --lines 50
```

### Option 3: Screen/Tmux

**Using screen:**
```bash
screen -S mailer
node job_mailer.js
# Press Ctrl+A then D to detach
```

**Reattach:**
```bash
screen -r mailer
```

---

## Best Practices

### 1. Optimal Send Times

**Best times for job applications:**
- **Monday-Wednesday**: 9:00 AM - 11:00 AM
- **Tuesday morning**: Highest response rates
- **Avoid**: Friday afternoons, weekends, early mornings (before 8 AM)

**Example - Tuesday morning campaigns:**
```javascript
mailer.scheduleRecurring({
    recipients: recipients,
    cronPattern: '0 10 * * 2',  // Every Tuesday at 10 AM
    delaySeconds: 5
});
```

### 2. Batch Delays

- Use 5-10 seconds between emails to avoid rate limiting
- Gmail has rate limits: ~500 emails/day, ~100/hour
- Higher delays (10s) look more human-like

```javascript
mailer.scheduleBatch(recipients, sendTime, 10);  // 10 seconds
```

### 3. Resume Rate Limits

**Safe sending rates:**
- Max 50 emails per batch
- 5-10 second delays
- Spread campaigns across days

**Example - Split large campaigns:**
```javascript
const allRecipients = [...]; // 150 recipients

// Split into 3 batches over 3 days
const batch1 = allRecipients.slice(0, 50);
const batch2 = allRecipients.slice(50, 100);
const batch3 = allRecipients.slice(100, 150);

mailer.scheduleBatch(batch1, '2025-10-15 10:00', 10);
mailer.scheduleBatch(batch2, '2025-10-16 10:00', 10);
mailer.scheduleBatch(batch3, '2025-10-17 10:00', 10);
```

### 4. Testing Schedules

**Always test first:**
```javascript
// Send to yourself to test
mailer.scheduleEmail({
    recipientEmail: 'your-email@gmail.com',
    companyName: 'Test Company',
    sendAt: new Date(Date.now() + 1 * 60 * 1000)  // 1 minute
});
```

### 5. Monitoring

**Create a monitoring script:**
```javascript
setInterval(() => {
    mailer.listSchedules();
}, 60 * 60 * 1000);  // Every hour
```

### 6. Backup Schedules

The `schedules.json` file is automatically created. Back it up:

```bash
cp schedules.json schedules_backup.json
```

### 7. Error Handling

Schedules that fail to send are logged but not retried. Check logs:

```bash
pm2 logs job-mailer | grep "Failed to send"
```

---

## Complete Example

Here's a complete workflow:

```javascript
import { JobApplicationMailer } from './job_mailer.js';

async function setupJobCampaign() {
    const mailer = new JobApplicationMailer();
    
    // Test connection
    await mailer.testConnection();
    
    // Load recipients
    const recipients = JSON.parse(
        fs.readFileSync('recipients.json', 'utf8')
    ).recipients;
    
    // Strategy: Tuesday/Thursday mornings
    
    // Batch 1: Next Tuesday at 10 AM
    const nextTuesday = new Date('2025-10-15 10:00');
    mailer.scheduleBatch(
        recipients.slice(0, 50),
        nextTuesday,
        8
    );
    
    // Batch 2: Next Thursday at 10 AM
    const nextThursday = new Date('2025-10-17 10:00');
    mailer.scheduleBatch(
        recipients.slice(50, 100),
        nextThursday,
        8
    );
    
    // Set up weekly recurring for new leads
    mailer.scheduleRecurring({
        recipients: weeklyLeads,
        cronPattern: '0 10 * * 2,4',  // Tuesday & Thursday at 10 AM
        delaySeconds: 8
    });
    
    // Show summary
    mailer.listSchedules();
    
    console.log('✅ Campaign scheduled!');
    console.log('💡 Keep script running with: pm2 start job_mailer.js');
}

setupJobCampaign();
```

---

## Troubleshooting

### Schedule not executing?

1. **Check if script is running:**
   ```bash
   pm2 list
   ```

2. **Check time is in future:**
   ```javascript
   const sendDate = new Date('2025-10-15 10:00');
   console.log(sendDate > new Date());  // Should be true
   ```

3. **Check schedules file:**
   ```bash
   cat schedules.json
   ```

### Schedules lost after restart?

- Schedules are automatically saved to `schedules.json`
- On restart, future schedules are restored
- Past schedules are skipped

### Gmail rate limit errors?

- Increase delay between emails (10+ seconds)
- Reduce batch size (max 50 emails)
- Spread campaigns across multiple days

---

## Advanced: Programmatic Schedule Management

### Dynamic scheduling based on conditions:

```javascript
// Schedule emails based on day of week
const recipients = loadRecipients();

recipients.forEach((recipient, index) => {
    // Spread emails over next 5 business days
    const daysToAdd = Math.floor(index / 10) + 1;
    const sendDate = addBusinessDays(new Date(), daysToAdd);
    sendDate.setHours(10, 0, 0, 0);
    
    mailer.scheduleEmail({
        recipientEmail: recipient.email,
        recipientName: recipient.name,
        companyName: recipient.company,
        sendAt: sendDate
    });
});

function addBusinessDays(date, days) {
    const result = new Date(date);
    let added = 0;
    while (added < days) {
        result.setDate(result.getDate() + 1);
        if (result.getDay() !== 0 && result.getDay() !== 6) {
            added++;
        }
    }
    return result;
}
```

---

## Need Help?

- Check `README.md` for setup instructions
- Check `CHANGELOG.md` for feature documentation
- Run `npm run demo` to see scheduling in action

Happy job hunting! 🚀

