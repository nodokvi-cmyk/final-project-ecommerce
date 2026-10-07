import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

const OTP_EXPIRATION_MS = 10 * 60 * 1000;

@Injectable()
export class EmailSenderService {
  private resend: Resend;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.getOrThrow<string>('RESEND_API_KEY'));
  }

  createVerificationCode() {
    return {
      otpCode: randomInt(0, 1_000_000).toString().padStart(6, '0'),
      otpCodeExpirationDate: Date.now() + OTP_EXPIRATION_MS,
    };
  }

  private getHtmlTemplate(otpCode: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Gamesense Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0d1117; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #c9d1d9;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0d1117; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 500px; background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                
                <!-- Logo / Header -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #58a6ff; letter-spacing: -0.5px; text-transform: uppercase;">
                      GAMESENSE
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding-bottom: 20px; text-align: center;">
                    <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #f0f6fc; font-weight: 600;">
                      Verify Your Email Address
                    </h2>
                    <p style="margin: 0; font-size: 14px; color: #8b949e; line-height: 1.6;">
                      Thank you for joining Gamesense! Please use the following One-Time Password (OTP) to complete your registration.
                    </p>
                  </td>
                </tr>

                <!-- OTP Code Box -->
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <div style="background-color: #21262d; border: 1px dashed #58a6ff; border-radius: 8px; padding: 16px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; color: #3fb950; letter-spacing: 8px;">
                        ${otpCode}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- Expiration Warning -->
                <tr>
                  <td style="padding-bottom: 24px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #8b949e;">
                      This code is valid for <strong style="color: #f0f6fc;">10 minutes</strong>. If you did not request this verification, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer Separator -->
                <tr>
                  <td style="border-top: 1px solid #30363d; padding-top: 20px; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #484f58;">
                      &copy; ${new Date().getFullYear()} Gamesense Inc. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendVerificationCode(to: string, otpCode: string) {
    try {
      const data = await this.resend.emails.send({
        from: 'gamesense <onboarding@resend.dev>',
        to: [to],
        subject: `${otpCode} is your Gamesense verification code`,
        text: `Your verification code is ${otpCode}. It expires in 10 minutes. If you did not request it, ignore this email.`,
        html: this.getHtmlTemplate(otpCode),
      });

      console.log('EMAIL SENT VIA RESEND:', data);
      return { success: true, message: 'Verification code sent successfully' };
    } catch (error: any) {
      console.error('RESEND ERROR:', error);
      throw new BadRequestException(`Failed to send email: ${error.message}`);
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