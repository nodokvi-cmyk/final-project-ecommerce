import { BadRequestException, Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import * as bcrypt from 'bcrypt';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailSenderService } from '../email-sender/email-sender.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private emailSenderService: EmailSenderService,
  ) {}

  async signUp({ age, email, fullName, password }: SignUpDto) {
    const existUser = await this.usersService.findByEmail(email);

    if (existUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // VERIFICATION
    const { otpCode, otpCodeExpirationDate } =
      this.emailSenderService.createVerificationCode();

    await this.usersService.createAuthUser({
      email,
      age,
      fullName,
      password: hashedPassword,
      avatarUrl: '',
      OTPCode: otpCode,
      OTPCodeExpirationDate: otpCodeExpirationDate,
    });

    return {
      success: true,
      message: 'user created successfully',
    };
  }

  async signIn({ password, email }: SignInDto) {
    const existUser = await this.usersService.findByEmail(email, true);

    if (!existUser) {
      throw new BadRequestException('Email or password is invalid');
    }

    const isPassEqual = await bcrypt.compare(password, existUser.password);
    if (!isPassEqual) {
      throw new BadRequestException('Email or password is invalid');
    }

    const payLoad = {
      userId: existUser._id,
      userRole: existUser.role,
    };
    const token = await this.jwtService.sign(payLoad, { expiresIn: '1h' });
    return { token };
  }

  async verifyEmail(email: string, OTPCode: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.OTPCode || !user.OTPCodeExpirationDate) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    if (user.OTPCodeExpirationDate < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }

    if (user.OTPCode !== OTPCode) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersService.markEmailVerified(email);

    const token = this.jwtService.sign(
      { userId: user._id },
      { expiresIn: '1h' },
    );

    return {
      success: true,
      message: 'User verified successfully',
      token,
    };
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
