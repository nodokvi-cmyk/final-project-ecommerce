import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

const OTP_EXPIRATION_MS = 10 * 60 * 1000;

@Injectable()
export class EmailSenderService {
  constructor(
    private readonly emailService: MailerService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  createVerificationCode() {
    return {
      otpCode: randomInt(0, 1_000_000).toString().padStart(6, '0'),
      otpCodeExpirationDate: Date.now() + OTP_EXPIRATION_MS,
    };
  }

  async sendVerificationCode(to: string, otpCode: string) {
    const emailUser = this.configService.get<string>('EMAIL_USER')

    const options = {
      to,
      subject: `${otpCode} is your gamesense verification code`,
      from: `gamesense <${emailUser}>`,
      text: `Your verification code is ${otpCode}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    };

    await this.emailService.sendMail(options);
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
