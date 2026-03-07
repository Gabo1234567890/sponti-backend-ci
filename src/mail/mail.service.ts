import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transporter, createTransport } from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: Transporter;
  constructor(private config: ConfigService) {
    this.transporter = createTransport({
      host: this.config.get('SMTP_HOST'),
      port: parseInt(this.config.get('SMTP_PORT') ?? '587', 10),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendResetPassword(to: string, resetUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_USER'),
      to,
      subject: 'Sponti - Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_USER'),
      to,
      subject: 'Sponti - Verify Your Email',
      html: `<p>Thank you for registering on Sponti!</p>
      <p>Please verify your email by clicking below:</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>`,
    });
  }
}
