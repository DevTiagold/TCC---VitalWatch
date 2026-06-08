import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  console.log('Testing email connection...');
  console.log(`User: ${process.env.SMTP_USER}`);
  console.log(`Password configured: ${process.env.SMTP_PASS ? 'YES' : 'NO'}`);

  try {
    // Verify connection configuration
    await transporter.verify();
    console.log('Server is ready to take our messages');

    const info = await transporter.sendMail({
      from: `"VitalWatch Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Hello from VitalWatch! (Test)',
      text: 'This is a test email to verify that your Nodemailer setup with Gmail is working properly.',
      html: '<b>This is a test email to verify that your Nodemailer setup with Gmail is working properly.</b>'
    });

    console.log('Message sent successfully: %s', info.messageId);
    console.log('Check your inbox!');
  } catch (error) {
    console.error('Error during email test:');
    console.error(error);
  }
}

testEmail();
