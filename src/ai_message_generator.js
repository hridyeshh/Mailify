import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AI Message Generator
 * Converts resume PDF to markdown and uses Google Gemini to generate personalized messages
 */
export class AIMessageGenerator {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        
        if (!this.apiKey) {
            console.warn('Warning: GEMINI_API_KEY not found in .env file');
            console.warn('AI message generation will not work without it.');
        }
        
        this.genAI = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
        this.model = null;
        
        // Initialize model asynchronously
        if (this.genAI) {
            this.initializeModel();
        }
        
        // Resume settings
        this.resumeFilename = process.env.RESUME_FILENAME || 'hridyesh_resume.pdf';
        this.resumePath = path.resolve(__dirname, '../resumes', this.resumeFilename);
    }
    
    async initializeModel() {
        try {
            console.log('🔍 Initializing Gemini model...');
            
            // Try different model names in order of preference
            const modelNames = [
                'gemini-2.0-flash-exp',
                'gemini-2.0-flash',
                'gemini-1.5-flash-002',
                'gemini-1.5-flash',
                'gemini-1.5-pro-002', 
                'gemini-1.5-pro',
                'gemini-pro'
            ];
            
            for (const modelName of modelNames) {
                try {
                    console.log(`   Trying model: ${modelName}`);
                    this.model = this.genAI.getGenerativeModel({ 
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                        }
                    });
                    
                    // Test the model with a simple prompt
                    const testResult = await this.model.generateContent('Hello');
                    await testResult.response;
                    
                    console.log(`✅ Successfully initialized model: ${modelName}`);
                    break;
                } catch (error) {
                    console.log(`   ❌ Model ${modelName} failed: ${error.message}`);
                    this.model = null;
                }
            }
            
            if (!this.model) {
                throw new Error('Could not initialize any Gemini model');
            }
            
        } catch (error) {
            console.error('❌ Error initializing Gemini model:', error.message);
            console.warn('   AI message generation will use fallback messages');
        }
    }

    /**
     * Convert PDF resume to markdown format
     * @returns {Promise<string>} Markdown content of the resume
     */
    async convertResumeToMarkdown() {
        try {
            console.log('📄 Converting resume PDF to text...');
            
            // Check if resume file exists
            if (!fs.existsSync(this.resumePath)) {
                throw new Error(`Resume file not found: ${this.resumePath}`);
            }

            console.log('📂 Reading PDF file:', this.resumePath);
            
            // Read PDF file as buffer
            const dataBuffer = fs.readFileSync(this.resumePath);
            
            // Parse PDF to extract text
            const pdfData = await pdfParse(dataBuffer);
            const text = pdfData.text;
            
            console.log('✅ Resume converted successfully');
            console.log(`   Extracted ${text.length} characters from PDF`);
            console.log(`   Pages: ${pdfData.numpages}`);
            
            // Convert plain text to a more structured markdown format
            const markdown = this.textToMarkdown(text);
            
            return markdown;
            
        } catch (error) {
            console.error('❌ Error converting resume:', error.message);
            
            // Fallback: return basic information from environment variables
            console.log('ℹ️  Using fallback resume information from .env');
            return this.getFallbackResumeInfo();
        }
    }
    
    /**
     * Convert plain text to markdown format
     * @private
     */
    textToMarkdown(text) {
        // Simple conversion: preserve line breaks and add basic structure
        let markdown = text;
        
        // Try to identify and format sections
        markdown = markdown.replace(/^([A-Z\s]{3,})$/gm, '## $1'); // Section headers
        markdown = markdown.replace(/^(•|-)(\s+)/gm, '- '); // Bullet points
        
        return markdown;
    }

    /**
     * Get fallback resume information from environment variables
     * @returns {string} Basic resume information in markdown format
     */
    getFallbackResumeInfo() {
        const name = process.env.YOUR_NAME || 'Candidate';
        const phone = process.env.YOUR_PHONE || '';
        const linkedin = process.env.YOUR_LINKEDIN || '';
        const portfolio = process.env.YOUR_PORTFOLIO || '';
        
        return `# ${name}

## Contact Information
- Phone: ${phone}
- LinkedIn: ${linkedin}
- Portfolio: ${portfolio}

## Professional Summary
Experienced software developer with expertise in full-stack development.

## Skills
- Programming Languages
- Web Development
- Software Engineering

Note: This is fallback information. Please ensure resume PDF is available for detailed content.
`;
    }

    /**
     * Generate personalized email message using Google Gemini AI
     * @param {Object} options - Generation options
     * @param {string} options.recipientName - Name of the recipient
     * @param {string} options.recipientEmail - Email of the recipient
     * @param {string} options.companyName - Company name
     * @param {string} options.jobTitle - Job title (optional)
     * @param {string} options.additionalContext - Additional context (optional)
     * @returns {Promise<string>} Generated email message
     */
    async generateMessage(options) {
        try {
            const {
                recipientName = 'Hiring Manager',
                recipientEmail = '',
                companyName = '',
                jobTitle = 'Software Development position',
                additionalContext = '',
                userDetails = null
            } = options;

            // Wait for model to be initialized (max 5 seconds)
            let retries = 10;
            while (!this.model && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
                retries--;
            }

            // Check if API is configured
            if (!this.model) {
                throw new Error('Gemini AI model is not initialized. Please check your API key.');
            }

            console.log(' Generating AI-powered message...');

            // Get resume content in markdown
            const resumeMarkdown = await this.convertResumeToMarkdown();

            // Create prompt for Gemini
            const prompt = this.createPrompt(
                resumeMarkdown,
                recipientName,
                companyName,
                jobTitle,
                additionalContext,
                userDetails
            );

            // Generate content using Gemini
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            let generatedMessage = response.text();
            
            // Replace placeholders with actual user data
            const yourEmail = userDetails?.email || process.env.YOUR_EMAIL || process.env.SENDER_EMAIL || 'your-email@example.com';
            const yourPhone = userDetails?.phone || process.env.YOUR_PHONE || '+91-XXXXXXXXXX';
            
            generatedMessage = generatedMessage.replace(/\[email\]/gi, yourEmail);
            generatedMessage = generatedMessage.replace(/\[phone\]/gi, yourPhone);

            console.log(' AI message generated successfully');
            return generatedMessage.trim();

        } catch (error) {
            console.error(' Error generating AI message:', error.message);
            
            // Return fallback message
            return this.getFallbackMessage(options);
        }
    }

    /**
     * Create prompt for Gemini AI
     * @private
     */
    createPrompt(resumeMarkdown, recipientName, companyName, jobTitle, additionalContext, userDetails = null) {
        // Use user details if provided, otherwise fall back to .env
        const yourName = userDetails?.name || process.env.YOUR_NAME || 'the candidate';
        const yourEmail = userDetails?.email || process.env.YOUR_EMAIL || process.env.SENDER_EMAIL || 'your-email@example.com';
        const yourPhone = userDetails?.phone || process.env.YOUR_PHONE || '+91-XXXXXXXXXX';
        
        return `You are a professional email writer helping ${yourName} craft a job application email for a ${jobTitle} position.

**Resume (in markdown):**
${resumeMarkdown}

**CRITICAL INSTRUCTIONS:**
1. The position being applied for is: ${jobTitle}
2. FIRST, identify the SKILLS section in the resume and extract all skills (programming languages, frameworks, tools, technologies)
3. THEN, find work experiences and projects in the resume that used these skills
4. You MUST tailor the middle paragraph to highlight:
   - Specific internships/jobs from the resume
   - Technologies and programming languages from the SKILLS section that were used in those experiences
   - Projects and their impact (user count, performance improvements, etc.)
   - Make sure the skills mentioned align with ${jobTitle}

**How to craft the paragraph:**
- Start with: "This is ${yourName}. I recently completed my [INTERNSHIP/JOB] at [COMPANY]..."
- Mention specific work: "where I built [SPECIFIC WORK] in [TECHNOLOGIES FROM SKILLS SECTION]"
- Include impact: "handling [FEATURE] for [NUMBER]+ users"
- Add more experiences if relevant
- End with: "I primarily contributed to projects based on [TECHNOLOGIES FROM SKILLS], giving me approximately [TIME] of overall experience."

**Template Format:**
Hey ${yourName},

Hope you are doing great and winning at everything you take on!

This is ${yourName}. [WRITE A DETAILED PARAGRAPH: Start with most recent/relevant internship or job. Mention what you built using SPECIFIC technologies from the SKILLS section. Include impact numbers if available. Add another experience if relevant. End with technologies and total experience time.]

I'm actively seeking ${jobTitle} opportunities and would greatly appreciate your referral for any suitable openings at your company. If possible, could you review my attached resume and consider referring me, or forward it to the appropriate team?

Thank you for your consideration.

Regards,

${yourName}
Mail - ${yourEmail}
Phone - ${yourPhone}

LinkedIn | Portfolio

**IMPORTANT:**
- Look for a "Skills" or "Technical Skills" section in the resume
- Match those skills with work experiences mentioned in the resume
- For technical roles (SDE, Developer, etc.): Emphasize programming languages (Java, Kotlin, JavaScript, Python, etc.), frameworks (React, Spring, Flask, etc.), and technical achievements
- For non-technical roles (Product Manager, etc.): Emphasize leadership, product thinking, data analysis, and business impact
- Always mention specific technologies/tools from the skills section that were actually used in the experiences
- Keep the exact same format and structure, just customize the content based on skills and experiences

**Example Reference (keep this structure):**
"This is ${yourName}. I recently completed my SDE internship at Limeroad, where I built payment backend services in Java, Android features in Kotlin, and web components using React/JavaScript—handling transactions and location services for 50k+ users. I also worked as a Software Development Intern at College Setu, where I developed a data collection portal using Flask and SQL, implementing RESTful web services and optimizing the database. I primarily contributed to projects based on Javascript, Kotlin, and Java, giving me approximately 8 months of overall experience."

Write ONLY the email body text following this exact format.`;
    }

    /**
     * Get fallback message when AI generation fails
     * @private
     */
    getFallbackMessage(options) {
        const yourName = process.env.YOUR_NAME || 'the candidate';
        const yourEmail = process.env.YOUR_EMAIL || process.env.SENDER_EMAIL || 'your-email@example.com';
        const yourPhone = process.env.YOUR_PHONE || '+91-XXXXXXXXXX';
        const jobTitle = options.jobTitle || 'SDE-1';

        return `Hey ${yourName},

Hope you are doing great and winning at everything you take on!

This is ${yourName}. I came across your company and was impressed by your work in the industry. I believe my skills and experience would be a great fit for opportunities at your company.

I have experience in full-stack development, with expertise in modern web technologies. I'm particularly passionate about building scalable applications and solving complex technical challenges.

I'm actively seeking ${jobTitle} opportunities and would greatly appreciate your referral for any suitable openings at your company. If possible, could you review my attached resume and consider referring me, or forward it to the appropriate team?

Thank you for your consideration.

Regards,

${yourName}
Mail - ${yourEmail}
Phone - ${yourPhone}

LinkedIn | Portfolio`;
    }

    /**
     * Generate multiple message variations
     * @param {Object} options - Generation options
     * @param {number} count - Number of variations (default: 3)
     * @returns {Promise<Array<string>>} Array of generated messages
     */
    async generateMessageVariations(options, count = 3) {
        try {
            console.log(`🤖 Generating ${count} message variations...`);
            
            const variations = [];
            
            for (let i = 0; i < count; i++) {
                const message = await this.generateMessage({
                    ...options,
                    additionalContext: `${options.additionalContext || ''} (Variation ${i + 1}: Use a ${this.getVariationStyle(i)} tone)`
                });
                variations.push(message);
                
                // Small delay between requests to avoid rate limiting
                if (i < count - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            console.log(` Generated ${variations.length} message variations`);
            return variations;
            
        } catch (error) {
            console.error(' Error generating message variations:', error.message);
            return [this.getFallbackMessage(options)];
        }
    }

    /**
     * Get variation style for different message tones
     * @private
     */
    getVariationStyle(index) {
        const styles = ['friendly and enthusiastic', 'professional and formal', 'casual and conversational'];
        return styles[index % styles.length];
    }

    /**
     * Test AI connection and functionality
     * @returns {Promise<boolean>} True if test successful
     */
    async testConnection() {
        try {
            console.log('\n' + '='.repeat(70));
            console.log(' TESTING AI MESSAGE GENERATOR');
            console.log('='.repeat(70) + '\n');

            // Check API key
            if (!this.apiKey) {
                console.error(' GEMINI_API_KEY not found in .env file');
                return false;
            }
            console.log(' Gemini API key found');

            // Check resume file
            if (fs.existsSync(this.resumePath)) {
                console.log(` Resume file found: ${this.resumeFilename}`);
            } else {
                console.warn(`  Resume file not found: ${this.resumePath}`);
                console.log('   Will use fallback information from .env');
            }

            // Test markdown conversion
            console.log('\n Testing PDF to markdown conversion...');
            const markdown = await this.convertResumeToMarkdown();
            console.log(`   Resume length: ${markdown.length} characters`);

            // Test AI generation
            console.log('\n Testing AI message generation...');
            const testMessage = await this.generateMessage({
                recipientName: 'Test User',
                companyName: 'Test Company',
                jobTitle: 'Software Engineer'
            });
            
            console.log('\n Sample Generated Message:');
            console.log('-'.repeat(70));
            console.log(testMessage.substring(0, 200) + '...');
            console.log('-'.repeat(70));

            console.log('\n All tests passed!');
            console.log('='.repeat(70) + '\n');
            
            return true;

        } catch (error) {
            console.error('\n Test failed:', error.message);
            console.log('='.repeat(70) + '\n');
            return false;
        }
    }
}

// Export singleton instance
export const aiGenerator = new AIMessageGenerator();

