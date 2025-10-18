# Changelog

All notable changes to this project will be documented in this file.

## [1.3.0] - 2025-10-18

### Added
- **AI-Powered Message Generation with Google Gemini**
  - **What**: Integrated Google Gemini AI to automatically generate professional job application email templates based on uploaded resume analysis
  - **Why**: Reduces time spent writing emails, ensures professional messaging, and creates contextually relevant content highlighting candidate's skills
  - **How**: 
    - Created `ai_message_generator.js` module with PDF-to-markdown conversion using `pdf2md-js`
    - Integrated Google Generative AI SDK (`@google/generative-ai`) for message generation
    - Added intelligent prompt engineering that analyzes resume skills and experience
    - Implemented file upload with multer for resume processing
    - Backend converts uploaded PDF → Markdown → AI analysis → Generated message
    - Creates generic templates with "Hello," greeting and "your company" placeholder
    - Implemented fallback mechanisms for when AI or resume processing fails

- **AI Message Generation UI Flow with File Upload**
  - **What**: Beautiful, intuitive UI for uploading resume and AI message generation with loading states and smooth transitions
  - **Why**: Provides excellent user experience with visual feedback during file upload and AI processing
  - **How**:
    - Added drag-and-drop resume upload interface in `composer.html`
    - File validation for PDF format and 10MB size limit
    - Created animated loading modal with progress steps (analyzing resume, understanding context, crafting message)
    - Built `ai-message.html` page for reviewing and editing AI-generated messages
    - Implemented session storage for seamless data transfer between pages
    - Added file removal functionality and upload status indicators

- **API Endpoints for AI Features**
  - **What**: RESTful API endpoints `/api/generate-message`, `/api/generate-variations`, and `/api/generate-message-from-resume`
  - **Why**: Enables web UI to access AI capabilities with file upload support
  - **How**: 
    - Added `/api/generate-message-from-resume` endpoint with multer middleware for file uploads
    - Accepts PDF resumes, converts to markdown, and generates AI message
    - Temporary file handling with automatic cleanup after processing
    - Implemented error handling with fallback messages
    - Added support for generating multiple message variations with different tones

- **Resume Processing Pipeline**
  - **What**: Automatic PDF resume conversion to markdown for AI analysis
  - **Why**: Allows AI to understand resume content and highlight relevant skills/experience
  - **How**:
    - Integrated `pdf2md-js` library for PDF parsing
    - Created fallback to environment variables if PDF conversion fails
    - Implemented resume analysis that extracts key information for personalization

### Changed
- **Composer Interface Enhancement**
  - **What**: Added prominent AI generation section above manual message composition
  - **Why**: Makes AI features the primary workflow while keeping manual composition as an option
  - **How**: Redesigned form layout with gradient styling and clear separation between AI and manual modes

- **Environment Configuration**
  - **What**: Added `GEMINI_API_KEY` to environment variables
  - **Why**: Secures API credentials and makes AI features configurable
  - **How**: Updated `env_template.txt` with API key field and documentation

### Updated
- **Package Dependencies**
  - Added `pdf2md-js` for PDF to markdown conversion
  - Added `@google/generative-ai` for Gemini AI integration
  - Added `multer` for handling multipart/form-data file uploads

- **Documentation**
  - Updated README.md with AI features section and setup instructions
  - Added Google Gemini API key to prerequisites
  - Updated project structure diagram

## [1.2.1] - 2025-10-18

### Changed
- **Project File Organization**
  - **What**: Reorganized project structure with proper directories for documentation, data files, and source code
  - **Why**: Improves code maintainability, makes the project easier to navigate, and follows best practices for project structure
  - **How**: 
    - Created `docs/` directory and moved all documentation from `logs/` (CHANGELOG.md, WEB_UI_GUIDE.md, SCHEDULING_GUIDE.md, etc.)
    - Created `data/` directory and moved data files (schedules.json, recipients.json)
    - Removed duplicate `schedule_demo.js` from root (kept the one in `src/`)
    - Updated all file references in code and documentation to reflect new paths
    - Updated README.md with accurate project structure diagram

## [1.2.0] - 2025-10-18

### Added
- **Web-Based Mail Sender UI**
  - **What**: Complete web interface for sending emails with modern, responsive design and dark mode support
  - **Why**: Provides a user-friendly alternative to command-line usage, making the tool accessible to non-technical users and enabling easier email composition
  - **How**: Built with Express.js backend serving a Tailwind CSS frontend with real-time form validation and AJAX API calls

- **Express.js REST API Server**
  - **What**: RESTful API with endpoints for sending emails, scheduling, and managing scheduled emails
  - **Why**: Separates backend logic from frontend, enabling future mobile apps or browser extensions to use the same API
  - **How**: Created `/api/send-email`, `/api/schedule-email`, `/api/schedules` endpoints with full error handling and validation

- **Custom Subject and Message Support**
  - **What**: Enhanced `sendEmail()` method to accept custom subject lines and message bodies
  - **Why**: Allows sending any type of email beyond job applications, making the tool more versatile for general email automation
  - **How**: Added `customSubject` and `customMessage` optional parameters that override default template when provided

- **Real-time Form Validation**
  - **What**: Client-side validation for email addresses, required fields, and schedule times
  - **Why**: Catches errors before API calls, providing instant feedback and reducing server load
  - **How**: JavaScript validation functions check email format using regex, verify required fields, and ensure schedule times are in the future

- **Success/Error Notifications**
  - **What**: Toast-style notifications showing operation results with auto-dismiss
  - **Why**: Provides clear feedback for user actions without requiring alert dialogs or page navigation
  - **How**: Dynamic notification div with CSS transitions and 5-second auto-hide timer

- **Loading States**
  - **What**: Disabled buttons with spinner animations during email sending
  - **Why**: Prevents duplicate submissions and shows users that processing is happening
  - **How**: Toggle button disabled state and swap text/spinner elements during async operations

- **Multiple Recipient Support**
  - **What**: Parse comma-separated or newline-separated email addresses from textarea
  - **Why**: Enables batch sending through the web UI without requiring JSON files
  - **How**: Split input by commas and newlines, trim whitespace, validate each address individually

- **Email Scheduling UI**
  - **What**: Toggle between immediate send and scheduled send with datetime picker
  - **Why**: Provides visual interface for scheduling feature without command-line date formatting
  - **How**: Show/hide datetime input field and change button labels based on mode toggle

### Improved
- **Enhanced Name Extraction from Email Addresses**
  - **What**: Updated `extractNameFromEmail()` to remove numbers from usernames and filter out invalid parts
  - **Why**: Email addresses like `hridyesh2309@gmail.com` were extracting as "Hridyesh2309" instead of just "Hridyesh", making greetings look unnatural. Numbers in email addresses are typically account identifiers, not part of actual names
  - **How**: Added regex filter to remove all digits (`/[0-9]/g`), then filter to keep only parts with 2+ characters. If no valid name can be extracted confidently, returns empty string for generic "Hey," greeting instead of guessing wrong

### Edge Cases Handled
- **Empty Recipients Field**: Shows error notification requiring at least one recipient
- **Invalid Email Format**: Validates email format using regex and lists all invalid addresses
- **Empty Subject/Message**: Validates required fields before submission
- **Past Schedule Times**: Prevents scheduling emails in the past with validation error
- **Duplicate Submissions**: Disables send button during processing to prevent duplicate sends
- **Rate Limiting**: Adds 1-second delay between bulk email sends to avoid Gmail rate limits
- **Network Errors**: Catches and displays API errors with user-friendly messages
- **Missing .env Configuration**: Server initialization fails gracefully with clear error message

### Configuration Files
- **Updated package.json**
  - **What**: Added `express` and `cors` dependencies, plus `server` npm script
  - **Why**: Required for web server functionality
  - **How**: Added Express.js v4.18.2 and CORS v2.8.5 with `npm run server` script

- **New public/index.html**
  - **What**: Single-page web application with responsive design
  - **Why**: Provides complete UI for email sending without additional dependencies
  - **How**: Self-contained HTML file with inline JavaScript, using CDN for Tailwind CSS

- **New src/server.js**
  - **What**: Express.js server with API routes and static file serving
  - **Why**: Handles HTTP requests, validates input, and interfaces with JobApplicationMailer
  - **How**: Middleware setup with CORS, JSON parsing, and comprehensive error handling

### Performance Improvements
- **Async Batch Processing**: Sends emails sequentially with small delays to avoid overwhelming servers
- **Client-Side Validation**: Reduces unnecessary API calls by validating before submission
- **Single-Page Application**: No page reloads required, instant feedback for all actions

### Security Enhancements
- **CORS Protection**: Configurable CORS middleware protects API endpoints
- **Input Sanitization**: Validates and sanitizes all user input before processing
- **Email Format Validation**: Prevents malformed email addresses from reaching SMTP server
- **Rate Limiting**: Built-in delays prevent abuse and respect Gmail sending limits

## [1.1.1] - 2025-10-18

### Improved
- **Enhanced Name Extraction from Email Addresses**
  - **What**: Updated `extractNameFromEmail()` to remove numbers from usernames and filter out invalid parts
  - **Why**: Email addresses like `hridyesh2309@gmail.com` were extracting as "Hridyesh2309" instead of just "Hridyesh", making greetings look unnatural
  - **How**: Added regex filter to remove all digits, then filter to keep only parts with 2+ characters

## [1.1.0] - 2025-10-12

### Added
- **Email Scheduling System**
  - **What**: Complete scheduling system for sending emails at specific times or on recurring basis
  - **Why**: Enables users to schedule job applications for optimal times (e.g., Monday mornings) rather than sending immediately, improving response rates
  - **How**: Integrated `node-schedule` library with persistent JSON storage for schedules that survive script restarts

- **Schedule Single Email**
  - **What**: `scheduleEmail()` method to schedule individual emails for specific date/time
  - **Why**: Allows targeted scheduling for important applications when timing matters
  - **How**: Uses node-schedule's date-based scheduling with automatic execution and cleanup after sending

- **Schedule Batch Emails**
  - **What**: `scheduleBatch()` method to schedule multiple emails for simultaneous future sending
  - **Why**: Enables planning entire outreach campaigns in advance without manual intervention
  - **How**: Wraps batch send functionality in scheduled job with configurable delays between individual emails

- **Recurring Email Schedules**
  - **What**: `scheduleRecurring()` method supporting cron patterns for automated recurring sends
  - **Why**: Automates continuous outreach efforts (e.g., every Monday morning) for ongoing job searches
  - **How**: Uses cron pattern syntax for flexible recurring schedules with execution history tracking

- **Schedule Management**
  - **What**: Methods to list (`listSchedules()`), cancel (`cancelSchedule()`), and bulk cancel (`cancelAllSchedules()`) scheduled emails
  - **Why**: Provides full control over scheduled emails for editing campaigns or avoiding duplicate sends
  - **How**: Maintains Map of active schedules with job references for cancellation and status updates

- **Persistent Schedule Storage**
  - **What**: Automatic save/load of schedules to `schedules.json` file
  - **Why**: Ensures scheduled emails aren't lost if script restarts, maintaining campaign continuity
  - **How**: JSON serialization of schedule data with automatic restoration on initialization, filtering for future/pending schedules

- **Schedule Status Tracking**
  - **What**: Tracks status (pending/sent/cancelled) and timestamps (created/sent/cancelled) for all schedules
  - **Why**: Provides visibility into campaign execution and history for reporting and debugging
  - **How**: Updates schedule metadata in-place during lifecycle events and persists to JSON

### Configuration Files

- **Updated .gitignore**
  - **What**: Added `schedules.json` to gitignore
  - **Why**: Prevents committing recipient email addresses and campaign data to version control
  - **How**: Simple pattern addition to existing .gitignore file

- **Updated package.json**
  - **What**: Added `node-schedule` dependency (v2.1.1)
  - **Why**: Required for all scheduling functionality
  - **How**: npm package dependency with semantic versioning

- **Updated README.md**
  - **What**: Added comprehensive scheduling documentation with examples
  - **Why**: Ensures users understand how to use scheduling features effectively
  - **How**: New sections for Options 4-6 plus schedule management with cron pattern reference

### Performance Improvements
- **Lazy Schedule Loading**: Schedules only restored if they're future-dated and pending, reducing startup overhead
- **Efficient Storage**: Only essential schedule data persisted, excluding job references and computed values

### Security Enhancements
- **Schedule Isolation**: Schedules.json automatically gitignored to protect recipient data
- **Validation**: Date validation ensures schedules can only be created for future times

## [1.0.0] - 2025-10-12

### Added
- **Initial Project Setup**
  - **What**: Created a Node.js-based job application email automation system
  - **Why**: To automate sending personalized job application emails with resume attachments, reducing manual effort and ensuring consistency across applications
  - **How**: Used `nodemailer` for SMTP email sending, `dotenv` for secure credential management, and ES6 modules for modern JavaScript syntax

- **JobApplicationMailer Class**
  - **What**: Core class that handles all email operations including sending, name extraction, and message personalization
  - **Why**: Provides a reusable, object-oriented interface for managing email operations with clean separation of concerns
  - **How**: Implemented using ES6 classes with methods for single/batch sending, name extraction from email addresses, and message templating

- **Name Extraction from Email**
  - **What**: Automatic extraction of recipient names from email addresses (e.g., `priya.sharma@google.com` → "Priya")
  - **Why**: Eliminates manual entry of recipient names and ensures personalized greetings even when only email address is known
  - **How**: Parses email username, splits by common separators (`.`, `_`, `-`), capitalizes first part, and handles edge cases gracefully

- **Environment-based Configuration**
  - **What**: All credentials and personal details stored in `.env` file
  - **Why**: Keeps sensitive data (email, password, phone) secure and out of version control, following security best practices
  - **How**: Used `dotenv` package to load variables from `.env` file, with `.env.example` template for easy setup

- **Resume Attachment Support**
  - **What**: Automatic PDF resume attachment with each email
  - **Why**: Ensures recruiters receive complete application package without manual attachment each time
  - **How**: Uses nodemailer's attachment feature with file system checks to verify resume exists before sending

- **Batch Email Sending**
  - **What**: Send emails to multiple recipients with configurable delays
  - **Why**: Enables efficient mass outreach while respecting Gmail rate limits and preventing account suspension
  - **How**: Implemented async iteration with `setTimeout` delays between sends, plus comprehensive success/failure tracking

- **Connection Testing**
  - **What**: Pre-flight check to verify email credentials before attempting to send
  - **Why**: Catches configuration errors early, saving time and preventing failed send attempts
  - **How**: Uses nodemailer's `verify()` method to test SMTP connection with helpful error messages

- **Multiple Usage Modes**
  - **What**: Three ways to send emails: single send, array-based batch, or JSON file-based batch
  - **Why**: Provides flexibility for different use cases - quick single sends vs. organized bulk campaigns
  - **How**: Implemented different code sections in `main()` function with clear comments for easy enabling/disabling

- **Comprehensive Error Handling**
  - **What**: Try-catch blocks with detailed error messages for all operations
  - **Why**: Prevents script crashes and provides actionable feedback for troubleshooting
  - **How**: Each email send wrapped in try-catch, with success/failure tracking and summary reporting

- **Batch Send Summary Report**
  - **What**: Detailed summary showing successful/failed sends after batch operations
  - **Why**: Provides visibility into campaign results and highlights any issues requiring attention
  - **How**: Collects results array during batch send, then formats and displays statistics with failed email details

### Configuration Files

- **package.json**
  - **What**: Node.js project manifest with dependencies and scripts
  - **Why**: Enables `npm install` for easy dependency installation and defines project metadata
  - **How**: Configured with ES6 modules (`"type": "module"`), nodemailer v6.9.7, and dotenv v16.3.1

- **.env.example**
  - **What**: Template file showing required environment variables
  - **Why**: Guides users in setting up their own `.env` file without exposing actual credentials
  - **How**: Contains all necessary variables with placeholder values and helpful comments

- **.gitignore**
  - **What**: Specifies files to exclude from Git version control
  - **Why**: Prevents committing sensitive data (.env), dependencies (node_modules), and personal files (resume PDF)
  - **How**: Standard patterns for Node.js projects plus resume PDF exclusion

- **recipients.json**
  - **What**: Example JSON file with sample recipient data structure
  - **Why**: Demonstrates proper format for bulk email campaigns and provides starting template
  - **How**: JSON array with objects containing email, name (optional), and company fields

- **README.md**
  - **What**: Comprehensive documentation with setup, usage, and troubleshooting guides
  - **Why**: Ensures users can set up and use the tool successfully without external help
  - **How**: Structured with prerequisites, step-by-step instructions, multiple usage examples, and troubleshooting tips

### Performance Improvements
- **Configurable Delays**: Default 5-second delay between batch emails prevents Gmail rate limiting while maintaining reasonable sending speed
- **Async/Await**: Modern async patterns ensure non-blocking execution and better error handling
- **File Existence Checks**: Resume attachment only attempted if file exists, preventing unnecessary errors

### Security Enhancements
- **App Password Support**: Designed for Gmail App Passwords (2FA required) rather than account passwords
- **.env for Credentials**: All sensitive data externalized to environment file
- **.gitignore Protection**: Ensures credentials never accidentally committed to version control

## Future Enhancements (Planned)

### Email Tracking
- Add read receipt tracking
- Track click rates on LinkedIn/Portfolio links
- Store sent email logs with timestamps

### Template Variations
- Multiple message templates for different job types
- Custom templates per company
- A/B testing for subject lines

### Advanced Features
- Email scheduling (send at specific times)
- Follow-up email automation
- Integration with job board APIs
- Response tracking and management

### UI Enhancement
- Optional web interface for easier management
- Dashboard showing campaign statistics
- Visual configuration editor

---

**Note**: This changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and documents what changed, why it was changed, and how it improves the project.

