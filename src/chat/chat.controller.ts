import {
  BadGatewayException,
  Body,
  Controller,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChatRequestDto } from './dto/chat.dto';
import { ChatService, ChatReply } from './chat.service';
import { AiBusyError } from './providers/ai-provider';

@Controller('chat')
@UseGuards(ThrottlerGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 8 messages per minute per client. Anything beyond that gets a 429.
  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async chat(@Body() { messages }: ChatRequestDto): Promise<ChatReply> {
    try {
      return await this.chatService.reply(messages);
    } catch (e) {
      if (e instanceof AiBusyError) {
        throw new ServiceUnavailableException(
          'The shopping assistant is busy right now. Please try again in a little while, or use the search and filters.',
        );
      }
      throw new BadGatewayException('The shopping assistant is unavailable.');
    }
  }
}
