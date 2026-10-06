import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailSenderService } from './email-sender.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.getOrThrow<string>('EMAIL_HOST'),
          port: 465,
          secure: true,
          auth: {
            user: configService.getOrThrow<string>('EMAIL_USER'),
            pass: configService.getOrThrow<string>('EMAIL_PASS'),
          },
        },
      }),
    }),
  ],
  providers: [EmailSenderService],
  exports: [EmailSenderService],
})
export class EmailSenderModule {}