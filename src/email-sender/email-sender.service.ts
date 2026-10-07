import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as nodemailer from 'nodemailer';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from './dtos/send-email.dto';

const OTP_EXPIRATION_MS = 10 * 60 * 1000;

@Injectable()
export class EmailSenderService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const host = this.configService.get<string>('EMAIL_HOST') || 'smtp.gmail.com';
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    console.log('--- TESTING CONFIG ---');
    console.log('HOST:', host);
    console.log('USER:', user);
    console.log('PASS LENGTH:', pass ? pass.length : 0);

    this.transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async onModuleInit() {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP Connection established successfully!');
    } catch (error) {
      console.error('❌ SMTP CONNECTION VERIFICATION FAILED:', error);
    }
  }

  createVerificationCode() {
    return {
      otpCode: randomInt(0, 1_000_000).toString().padStart(6, '0'),
      otpCodeExpirationDate: Date.now() + OTP_EXPIRATION_MS,
    };
  }

  async sendVerificationCode(to: string, otpCode: string) {
    return this.verifyUser(to, otpCode);
  }

  async verifyUser(to: string, otpCode: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 500px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background-color: #4f46e5; color: #ffffff; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 600; }
            .content { padding: 30px; color: #333333; text-align: center; }
            .otp-box { background-color: #f3f4f6; border: 2px dashed #4f46e5; border-radius: 8px; padding: 15px; margin: 25px 0; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; }
            .note { font-size: 13px; color: #6b7280; margin-top: 20px; }
            .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Gamesense - Email Verification</h1>
            </div>
            <div class="content">
              <p>გამარჯობა, გამოიყენეთ ქვემოთ მოცემული კოდი ვერიფიკაციის დასასრულებლად:</p>
              <div class="otp-box">${otpCode}</div>
              <p class="note">⚠️ კოდი აქტიურია 10 წუთის განმავლობაში.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Gamesense. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject: 'Your Verification Code 🔑',
        html: htmlContent,
      });
      console.log('EMAIL SENT SUCCESS:', info);
      return { success: true, message: 'Verification email sent successfully' };
    } catch (error: any) {
      console.error('FULL SENDMAIL ERROR:', error);
      throw new BadRequestException(`Failed to send email: ${error.message || error}`);
    }
  }

  async sendEmailToSomeone({ subject, text, to }: SendEmailDto) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject,
        text,
      });
      return { success: true, message: 'Email sent successfully' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to send email: ${error.message}`);
    }
  }

  async sendWelcomeMessage(to: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background-color: #4f46e5; color: #ffffff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .content h2 { color: #1f2937; margin-top: 0; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome Aboard! 🚀</h1>
            </div>
            <div class="content">
              <h2>გამარჯობა! 👋</h2>
              <p>მოხარულები ვართ, რომ შემოგვიერთდით Gamesense-ზე.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Gamesense. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject: 'Welcome to Our Platform! 🎉',
        html: htmlContent,
      });
      return { success: true, message: 'Welcome email sent successfully' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to send welcome email: ${error.message}`);
    }
  }

  async sendDeactivationMessage(to: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
            .header { background-color: #ef4444; color: #ffffff; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
            .content { padding: 30px; color: #333333; line-height: 1.6; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Deactivated</h1>
            </div>
            <div class="content">
              <h2>გამარჯობა! 👋</h2>
              <p>გაცნობებთ, რომ თქვენი ანგარიში წარმატებით დეაქტივირდა.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Gamesense. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_USER'),
        to,
        subject: 'Account Deactivated 😢',
        html: htmlContent,
      });
      return { success: true, message: 'Deactivation email sent successfully' };
    } catch (error: any) {
      throw new BadRequestException(`Failed to send deactivation email: ${error.message}`);
    }
  }

  async resendVerificationCode(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    const { otpCode, otpCodeExpirationDate } = this.createVerificationCode();

    await this.usersService.updateVerificationCode(
      email,
      otpCode,
      otpCodeExpirationDate,
    );
    await this.sendVerificationCode(email, otpCode);

    return { success: true, message: 'Verification code sent successfully' };
  }
}