import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, // allow Railway SSL
      },
      logger: true, // log SMTP traffic
      debug: true,
    });
  }

  async sendOtpEmail(to: string, otp: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"E-Commerce" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Your OTP Verification Code',
        text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        html: `<p>Your OTP code is <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`,
      });
      console.log('✅ Email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }
}
