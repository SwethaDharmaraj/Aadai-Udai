const nodemailer = require('nodemailer');
require('dotenv').config();

const testSmtp = async () => {
    console.log('--- SMTP Diagnostic Test ---');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true,
        logger: true
    });

    try {
        console.log('Connecting to Gmail SMTP...');
        await transporter.verify();
        console.log('✅ SUCCESS: SMTP connection is working perfectly!');

        console.log('Sending test email to self...');
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'AADAIUDAI SMTP Test',
            text: 'If you are reading this, your email configuration is correct!'
        });
        console.log('✅ SUCCESS: Test email sent successfully!');
    } catch (err) {
        console.error('❌ ERROR: SMTP verification failed.');
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        console.error('Command:', err.command);
    }
};

testSmtp();
