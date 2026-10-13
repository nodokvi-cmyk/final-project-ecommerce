import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { AI_PROVIDER } from './providers/ai-provider';
import { GeminiProvider } from './providers/gemini.provider';

@Module({
  imports: [ProductsModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    // To use another model provider, implement AiProvider and bind it here.
    { provide: AI_PROVIDER, useClass: GeminiProvider },
  ],
})
export class ChatModule {}
