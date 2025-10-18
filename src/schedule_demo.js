import { JobApplicationMailer } from './job_mailer.js';

/**
 * Demo script showing scheduling features
 * This demonstrates how to use the scheduling functionality
 */

async function main() {
    try {
        const mailer = new JobApplicationMailer();
        
        // Test connection
        const isValid = await mailer.testConnection();
        if (!isValid) {
            process.exit(1);
        }

        console.log('='.repeat(70));
        console.log('📅 SCHEDULING DEMO');
        console.log('='.repeat(70) + '\n');

        // Example 1: Schedule a single email for 2 minutes from now
        const twoMinutesLater = new Date(Date.now() + 2 * 60 * 1000);
        console.log('1️⃣  Scheduling single email for 2 minutes from now...\n');
        
        mailer.scheduleEmail({
            recipientEmail: 'example@test.com',
            recipientName: 'Test User',
            companyName: 'Demo Company',
            sendAt: twoMinutesLater
        });

        // Example 2: Schedule a batch for 5 minutes from now
        const fiveMinutesLater = new Date(Date.now() + 5 * 60 * 1000);
        console.log('2️⃣  Scheduling batch send for 5 minutes from now...\n');
        
        const recipients = [
            { email: 'user1@test.com', name: 'User One', company: 'Company A' },
            { email: 'user2@test.com', name: 'User Two', company: 'Company B' }
        ];
        
        mailer.scheduleBatch(recipients, fiveMinutesLater, 3);

        // Example 3: Set up recurring email (every minute for demo - use cron for real)
        // Uncomment to test recurring schedules
        /*
        console.log('3️⃣  Setting up recurring emails (every minute)...\n');
        
        mailer.scheduleRecurring({
            recipients: [{ email: 'recurring@test.com', name: 'Recurring', company: 'Test Inc' }],
            cronPattern: '* * * * *',  // Every minute (for demo only!)
            delaySeconds: 3
        });
        */

        // List all schedules
        console.log('\n📋 Current Schedules:');
        mailer.listSchedules();

        console.log('='.repeat(70));
        console.log('✅ Schedules created successfully!');
        console.log('='.repeat(70));
        console.log('\n💡 The script will keep running to execute scheduled emails.');
        console.log('   Press Ctrl+C to stop and cancel all schedules.\n');

        // Keep script running
        console.log('⏳ Waiting for scheduled emails to send...\n');
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Shutting down...');
            console.log('📋 Cancelling all scheduled emails...\n');
            mailer.cancelAllSchedules();
            console.log('👋 Goodbye!');
            process.exit(0);
        });

        // Keep alive
        setInterval(() => {
            const now = new Date();
            process.stdout.write(`\r⏰ Current time: ${now.toLocaleTimeString()} | Scheduled emails: ${mailer.activeSchedules.size}`);
        }, 1000);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();

