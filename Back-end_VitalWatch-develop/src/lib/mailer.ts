import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a generic transporter
// For Gmail App Passwords, you'll need SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, etc.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}

export const sendMail = async (options: SendMailOptions) => {
  try {
    const info = await transporter.sendMail({
      from: `"VitalWatch" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email: ', error);
    throw error;
  }
};
