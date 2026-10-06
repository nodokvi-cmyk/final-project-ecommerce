import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Headers, Req, type RawBodyRequest, BadRequestException} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UserId } from '../users/decorators/user.decorator';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("checkout")
  @UseGuards(IsAuthGuard)
  async createCheckoutSession(
    @UserId() userId: string,
    @Body("orderId") orderId: string,
    @Body() createPaymentDto: CreatePaymentDto
  ){
    return this.paymentService.createCheckoutSession(userId, orderId, createPaymentDto)
  }

  @Post("webhook")
  async handleWebhook(
    @Headers("stripe-signature") signature: string,
    @Req() req: RawBodyRequest<Request>
  ){
    if(!signature) throw new BadRequestException("Missing stripe-signature in headers")
    return this.paymentService.handleWebhook(signature, req.rawBody!)
  }
}
