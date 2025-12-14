
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('Found .env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
        }
    });
} else {
    console.error('.env.local not found!');
}

const Mailjet = require('node-mailjet');

async function testEmail() {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;

    console.log('Testing Mailjet Connection...');
    console.log('API Key present:', !!apiKey);
    console.log('Secret Key present:', !!secretKey);

    if (!apiKey || !secretKey) {
        console.error('Missing credentials');
        return;
    }

    const mailjet = Mailjet.apiConnect(apiKey, secretKey);

    const emailData = {
        fname: 'Test',
        email: 'test@example.com',
        serviceName: 'Debug Service',
        businessName: 'Debug Business',
        date: '2025-01-01',
        time: '10:00 - 11:00',
        totalCost: "50.00",
        depositAmount: "10.00",
        paymentAmount: "10.00",
        remainingAmount: "40.00",
        bookingId: "DEBUG-001",
        location: "Debug Location"
    };

    const templateId = 7568667;
    const fromEmail = process.env.MAILJET_FROM_EMAIL || "information@ouiimi.com";

    console.log(`Sending from: ${fromEmail}`);
    console.log('Attempting to send email with Template ID:', templateId);

    try {
        const result = await mailjet.post("send", { version: "v3.1" }).request({
            Messages: [{
                From: {
                    Email: fromEmail,
                    Name: "Ouiimi Debugger"
                },
                To: [{
                    Email: fromEmail, // Send to self for safety
                    Name: "Debugger"
                }],
                TemplateID: templateId,
                TemplateLanguage: true,
                Subject: "Debug Email Test",
                Variables: emailData
            }]
        });
        console.log('SUCCESS: Email sent successfully.');
        console.log('Status:', result.response.status);
    } catch (err) {
        console.error('FAILURE: Could not send email.');
        console.error('Status Code:', err.statusCode);
        console.error('Message:', err.message);
        if (err.response) {
            console.error('Full Response:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testEmail();
