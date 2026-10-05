import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { UserId } from '../users/decorators/user.decorator';
import { EmailSenderService } from '../email-sender/email-sender.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private emailSenderService: EmailSenderService,
  ) {}

  @Post('sign-up')
  signUp(@Body() { age, email, fullName, password }: SignUpDto) {
    return this.authService.signUp({ email, fullName, password, age });
  }

  @Post('verify')
  verifyUser(@Body() { OTPCode, email }: VerifyUserDto) {
    return this.authService.verifyEmail(email, OTPCode);
  }

  @Post('send')
  resendCode(@Body() { email }: ResendVerificationCodeDto) {
    return this.emailSenderService.resendVerificationCode(email);
  }

  @Post('sign-in')
  signIn(@Body() { email, password }: SignInDto) {
    return this.authService.signIn({ email, password });
  }

  @Get('current-user')
  @UseGuards(IsAuthGuard)
  getCurrentUser(@UserId() userId) {
    return this.authService.getCurrentUser(userId);
  }
}
