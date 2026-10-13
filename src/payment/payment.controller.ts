import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Headers,
  Req,
  type RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { UserId } from '../users/decorators/user.decorator';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @UseGuards(IsAuthGuard)
  async createCheckoutSession(
    @UserId() userId: string,
    @Body() { orderId }: CreatePaymentDto,
  ) {
    return this.paymentService.createCheckoutSession(userId, orderId);
  }

  @Post('confirm')
  @UseGuards(IsAuthGuard)
  async confirmCheckout(
    @UserId() userId: string,
    @Body() { sessionId }: ConfirmPaymentDto,
  ) {
    return this.paymentService.confirmCheckout(userId, sessionId);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature)
      throw new BadRequestException('Missing stripe-signature in headers');
    return this.paymentService.handleWebhook(signature, req.rawBody!);
  }
}
