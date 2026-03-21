const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;

    if (env.EMAIL.host && env.EMAIL.user && env.EMAIL.pass) {
      this.transporter = nodemailer.createTransport({
        host: env.EMAIL.host,
        port: env.EMAIL.port,
        secure: env.EMAIL.port === 465, // true for 465, false for 587
        auth: {
          user: env.EMAIL.user,
          pass: env.EMAIL.pass,
        },
      });

      logger.info('📧 Email service initialized');
    } else {
      logger.warn('⚠️ SMTP not configured — emails will be logged only');
    }
  }

  // ✅ Generic Email Sender
  async sendEmail({ to, subject, text, html }) {
    if (!this.transporter) {
      logger.info(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Body: ${text}`);
      return { messageId: 'mock-email' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL.from,
        to,
        subject,
        text,
        html,
      });

      logger.info(`✅ Email sent: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error('❌ Email send error:', err);
      throw {
        statusCode: 500,
        message: 'Failed to send email',
      };
    }
  }

  // 🔐 OTP Email
  async sendOTPEmail(to, otp) {
    return this.sendEmail({
      to,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}`,
      html: `<h3>Your OTP is <b>${otp}</b></h3>`,
    });
  }

  // 🎉 Welcome Email
  async sendWelcomeEmail(to, name) {
    return this.sendEmail({
      to,
      subject: 'Welcome to Team Hub 🚀',
      text: `Hello ${name}, welcome to Team Hub!`,
      html: `<h2>Welcome ${name} 👋</h2><p>Your account is ready.</p>`,
    });
  }

  // 🔁 Password Reset
  async sendResetPasswordEmail(to, link) {
    return this.sendEmail({
      to,
      subject: 'Reset Your Password',
      text: `Click here to reset password: ${link}`,
      html: `<p>Click below to reset your password:</p><a href="${link}">${link}</a>`,
    });
  }

  // 🧪 Test Email
  async sendTestEmail(to) {
    return this.sendEmail({
      to,
      subject: 'Test Email',
      text: 'Hello from Team Hub 🚀',
      html: '<h3>Hello from Team Hub 🚀</h3>',
    });
  }
}

module.exports = new EmailService();