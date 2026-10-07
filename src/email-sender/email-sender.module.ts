import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailSenderService } from './email-sender.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, ConfigModule],
  providers: [EmailSenderService],
  exports: [EmailSenderService],
})
export class EmailSenderModule {}