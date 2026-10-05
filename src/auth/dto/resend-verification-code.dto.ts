import { PickType } from '@nestjs/mapped-types';
import { VerifyUserDto } from './verify-user.dto';

export class ResendVerificationCodeDto extends PickType(VerifyUserDto, [
  'email',
] as const) {}
