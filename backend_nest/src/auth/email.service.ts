import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  /**
   * Send password reset code via email
   */
  async sendPasswordResetCode(
    email: string,
    firstName: string,
    code: string,
  ): Promise<void> {
    const mailOptions = {
      from: `"Event Manager" <${this.configService.get<string>('EMAIL_FROM')}>`,
      to: email,
      subject: 'Password Reset Code - Event Manager',
      html: this.getPasswordResetTemplate(firstName, code),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch {
      throw new Error('Failed to send email');
    }
  }

  /**
   * HTML template for password reset email
   */
  private getPasswordResetTemplate(firstName: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #6be546ff;
            margin: 0;
          }
          .code-box {
            background-color: #4F46E5;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 30px 0;
          }
          .info {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          
          <p>Hi <strong>${firstName}</strong>,</p>
          
          <p>You requested to reset your password for your Event Manager account.</p>
          
          <p>Use the following 6-digit code to reset your password:</p>
          
          <div class="code-box">
            ${code}
          </div>
          
          <div class="info">
            <strong>⏰ Important:</strong> This code will expire in <strong>15 minutes</strong>.
          </div>
          
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p>For security reasons:</p>
          <ul>
            <li>Never share this code with anyone</li>
            <li>Our team will never ask for this code</li>
            <li>This code can only be used once</li>
          </ul>
          
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; 2026 Event Manager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
