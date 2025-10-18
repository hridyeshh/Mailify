# Web UI Guide

## Overview

The Mail Sender Web UI provides a user-friendly interface for sending and scheduling emails without using the command line.

## Starting the Server

```bash
npm run server
```

The server will start on `http://localhost:3000`

## Features

### 1. Send Immediate Emails

1. Open `http://localhost:3000` in your browser
2. Enter recipient email addresses (comma or newline separated)
3. Enter a subject line
4. Compose your message (HTML supported)
5. Click "Send Mail"

**Example Recipients:**
```
user1@gmail.com, user2@yahoo.com
user3@company.com
```

### 2. Use Custom Message Template

Click the "Use Custom Message" button to load a pre-formatted HTML template. You can then customize it as needed.

### 3. Schedule Emails

1. Click "Schedule Mail" button (toggles to scheduling mode)
2. Select date and time using the datetime picker
3. Fill in recipients, subject, and message
4. Click "Schedule Mail" to confirm

**Note:** Schedule time must be at least in the future (minimum 5 minutes recommended).

### 4. Batch Sending

Simply enter multiple email addresses in the Recipients field:
- Comma-separated: `user1@gmail.com, user2@gmail.com`
- Line-separated (press Enter between each email)

The system will automatically send to all recipients with a 1-second delay between each email to avoid rate limiting.

## Edge Cases Handled

### ✅ Empty Fields
- Recipients, subject, and message are all required
- Clear error messages show which fields are missing

### ✅ Invalid Email Addresses
- Real-time validation using regex pattern
- Lists all invalid email addresses found
- Example error: "Invalid email address(es): notanemail, @invalid.com"

### ✅ Past Schedule Times
- Prevents scheduling emails in the past
- Error: "Schedule time must be in the future"

### ✅ Duplicate Submissions
- Send button is disabled during processing
- Spinner animation shows operation in progress

### ✅ Network Errors
- All API errors are caught and displayed
- User-friendly error messages
- Success notifications show number of emails sent

### ✅ Rate Limiting
- Automatic 1-second delay between batch emails
- Prevents Gmail rate limit issues

## API Endpoints

The web UI uses these REST API endpoints:

### GET `/api/health`
Check server status and configuration

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T10:46:34.465Z",
  "senderEmail": "your@email.com"
}
```

### POST `/api/send-email`
Send immediate email

**Request:**
```json
{
  "recipients": "user1@gmail.com, user2@gmail.com",
  "subject": "Hello World",
  "message": "<p>Your message here</p>"
}
```

**Response:**
```json
{
  "success": true,
  "totalSent": 2,
  "totalFailed": 0,
  "results": [...]
}
```

### POST `/api/schedule-email`
Schedule email for later

**Request:**
```json
{
  "recipients": "user@gmail.com",
  "subject": "Scheduled Message",
  "message": "<p>Message content</p>",
  "sendAt": "2025-10-20T10:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "scheduleId": "batch_1697803594123_abc123",
  "scheduledFor": "2025-10-20T10:00:00.000Z",
  "recipientCount": 1
}
```

### GET `/api/schedules`
List all scheduled emails

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "id": "batch_1697803594123_abc123",
      "type": "batch",
      "recipientCount": 1,
      "sendAt": "2025-10-20T10:00:00.000Z",
      "status": "pending",
      "createdAt": "2025-10-18T10:00:00.000Z"
    }
  ]
}
```

### DELETE `/api/schedules/:scheduleId`
Cancel a scheduled email

**Response:**
```json
{
  "success": true,
  "message": "Schedule cancelled successfully"
}
```

## HTML Email Support

The message field supports full HTML formatting:

```html
<div style="font-family: Arial, sans-serif;">
    <h2>Hello!</h2>
    <p>This is a <strong>formatted</strong> email.</p>
    <ul>
        <li>Point 1</li>
        <li>Point 2</li>
    </ul>
</div>
```

## Troubleshooting

### Server Won't Start
- **Issue:** "Failed to initialize mailer"
- **Solution:** Check your `.env` file has `SENDER_EMAIL` and `EMAIL_PASSWORD`

### Emails Not Sending
- **Issue:** "Email configuration test failed"
- **Solution:** Verify Gmail App Password is correct
- **Help:** Visit https://myaccount.google.com/apppasswords

### Invalid Email Error
- **Issue:** "Invalid email address(es)"
- **Solution:** Check email format is `user@domain.com`
- **Common mistakes:** Missing @, missing domain, spaces in email

### Can't Schedule Email
- **Issue:** "Schedule time must be in the future"
- **Solution:** Select a time at least 5 minutes from now
- **Tip:** Server uses UTC time, consider timezone differences

## Tips

1. **Test First:** Use your own email as recipient to test formatting
2. **HTML Preview:** Copy message to an HTML file to preview before sending
3. **Batch Carefully:** Start with small batches to ensure formatting is correct
4. **Schedule Wisely:** Send job applications on Monday mornings (9-11 AM) for best response rates
5. **Keep Server Running:** Scheduled emails require the server to be running at the scheduled time

## Security Notes

- Server runs on localhost by default (not accessible from internet)
- All credentials are loaded from `.env` file
- CORS is enabled for local development
- No passwords are transmitted in API calls (server uses .env credentials)

## Dark Mode

The UI supports dark mode by default, matching your system preferences. The dark theme uses:
- Background: Pure black (#000000)
- Text: Light gray (#E5E5E5)
- Primary color: Olive green (#556b2f)

---

For command-line usage, see the main [README.md](../README.md)

