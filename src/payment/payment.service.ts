import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import Stripe from "stripe"
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentStatus } from './schema/payment.schema';
import { Model } from 'mongoose';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe
  private readonly logger = new Logger(PaymentService.name)

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>
  ){
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>("STRIPE_API_KEY"), 
      {
        apiVersion: "2026-09-30.endive"
      }
    )
  }

  async createCheckoutSession(userId: string, orderId: string, createPaymentDto: CreatePaymentDto) {
    try{
      const totalAmount = createPaymentDto.items.reduce((curr, item) => curr + item.price * item.quantity, 0)
      
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      createPaymentDto.items.map((item) => ({
        price_data: {
          currency: createPaymentDto.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      }))

      const frontEndUri = this.configService.getOrThrow<string>("FRONTEND_URI")

      const session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        metadata: {
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
        success_url: `${frontEndUri}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontEndUri}/cancel`,
      })

      await this.paymentModel.create({
        userId,
        orderId,
        stripeSessionId: session.id,
        amount: totalAmount,
        currency: createPaymentDto.currency
      })
      return {url: session.url}
    }catch(e){
      console.log('--- STRIPE ERROR DETAILS ---', e)
      this.logger.error("Failed to create checkout session", e)
      throw new InternalServerErrorException("Payment session creation failed")
    }
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET')
    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      )
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err)
      throw new BadRequestException('Invalid Webhook Signature')
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      await this.paymentModel.findOneAndUpdate(
        { stripeSessionId: session.id },
        { status: PaymentStatus.COMPLETED },
      )

      this.logger.log(`Payment completed for session: ${session.id}`)
    }

    return { received: true }
  }
}
