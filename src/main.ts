import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import {Logger} from "pino-nestjs"
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bufferLogs: true});

  app.enableCors()

  app.useLogger(app.get(Logger))

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true
  }))
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
