import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentStatus } from './schema/payment.schema';
import { Model, Types } from 'mongoose';
import { Order, OrderItem, OrderStatus } from '../orders/schema/order.schema';
import { Cart } from '../cart/schema/cart.schema';
import { Product } from '../products/schemas/product.schema';

const CURRENCY = 'usd';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_API_KEY'),
      {
        apiVersion: '2026-09-30.endive',
      },
    );
  }

  async createCheckoutSession(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== OrderStatus.PENDING)
      throw new BadRequestException('This order cannot be paid');

    // Stock may have changed since the order was created, so check it again
    // right before the customer is sent to pay.
    await this.assertInStock(order.orderedItems);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.orderedItems.map((item) => ({
        price_data: {
          currency: CURRENCY,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

    const frontEndUri = this.configService.getOrThrow<string>('FRONTEND_URI');

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        metadata: {
          orderId: orderId,
          userId: userId,
        },
        success_url: `${frontEndUri}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontEndUri}/cancel`,
      });
    } catch (e) {
      this.logger.error('Failed to create checkout session', e);
      throw new InternalServerErrorException('Payment session creation failed');
    }

    await this.paymentModel.create({
      userId: order.userId,
      orderId: order._id,
      stripeSessionId: session.id,
      amount: order.totalAmount,
      currency: CURRENCY,
    });

    return { url: session.url };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid Webhook Signature');
    }

    if (event.type === 'checkout.session.completed') {
      await this.fulfillSession(event.data.object as Stripe.Checkout.Session);
    }

    return { received: true };
  }

  // Called by the success page. It asks Stripe directly whether the session
  // was paid and runs the same idempotent fulfilment as the webhook, so a
  // missed or delayed webhook cannot leave a paid order unfulfilled.
  async confirmCheckout(userId: string, sessionId: string) {
    const payment = await this.paymentModel.findOne({
      stripeSessionId: sessionId,
      userId: new Types.ObjectId(userId),
    });
    if (!payment) throw new NotFoundException('Payment not found');

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (e) {
      this.logger.error(`Failed to retrieve session ${sessionId}`, e);
      throw new InternalServerErrorException('Could not confirm payment');
    }

    if (session.payment_status === 'paid') {
      await this.fulfillSession(session);
    }

    const order = await this.orderModel.findById(payment.orderId);
    return {
      orderId: payment.orderId.toString(),
      status: order?.status ?? OrderStatus.PENDING,
    };
  }

  private async assertInStock(items: OrderItem[]) {
    const products = await this.productModel.find({
      _id: { $in: items.map((item) => item.productId) },
    });
    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    for (const item of items) {
      const product = productsById.get(item.productId.toString());
      if (!product)
        throw new BadRequestException(`"${item.name}" is no longer available`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Only ${product.stock} of "${item.name}" left in stock`,
        );
      }
    }
  }

  private async fulfillSession(session: Stripe.Checkout.Session) {
    // Claiming the payment is what makes this idempotent: Stripe retries
    // webhooks, and only the first delivery finds the payment still pending.
    const payment = await this.paymentModel.findOneAndUpdate(
      { stripeSessionId: session.id, status: PaymentStatus.PENDING },
      { status: PaymentStatus.COMPLETED },
      { new: true },
    );
    if (!payment) {
      this.logger.warn(
        `Session ${session.id} already handled or unknown, skipping`,
      );
      return;
    }

    try {
      const order = await this.orderModel.findById(payment.orderId);
      if (!order)
        throw new Error(
          `Order ${payment.orderId} not found for session ${session.id}`,
        );

      const stockTaken = await this.takeStock(order.orderedItems);
      if (!stockTaken) {
        await this.cancelAndRefund(payment, order, session);
        return;
      }

      try {
        order.status = OrderStatus.PAID;
        await order.save();
        await this.removeOrderedItemsFromCart(order);
      } catch (e) {
        await this.restoreStock(order.orderedItems);
        throw e;
      }

      this.logger.log(`Payment completed for session: ${session.id}`);
    } catch (e) {
      // Let Stripe retry the webhook.
      await this.paymentModel.updateOne(
        { _id: payment._id },
        { status: PaymentStatus.PENDING },
      );
      throw e;
    }
  }

  // Atomic per item: the filter only matches while enough stock is left, so
  // stock can never go negative. Returns false, with nothing left deducted,
  // when any item cannot be covered.
  private async takeStock(items: OrderItem[]) {
    const taken: OrderItem[] = [];
    try {
      for (const item of items) {
        const result = await this.productModel.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
        );
        if (result.modifiedCount !== 1) {
          await this.restoreStock(taken);
          return false;
        }
        taken.push(item);
      }
      return true;
    } catch (e) {
      await this.restoreStock(taken);
      throw e;
    }
  }

  private async restoreStock(items: OrderItem[]) {
    for (const item of items) {
      await this.productModel.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } },
      );
    }
  }

  private async removeOrderedItemsFromCart(order: Order) {
    const cart = await this.cartModel.findOne({ userId: order.userId });
    if (!cart) return;

    const orderedIds = new Set(
      order.orderedItems.map((item) => item.productId.toString()),
    );
    cart.items = cart.items.filter(
      (item) => !orderedIds.has(item.productId.toString()),
    );
    cart.totalPrice = cart.items.reduce(
      (curr, item) => curr + item.price * item.quantity,
      0,
    );
    await cart.save();
  }

  // The customer paid for items that sold out in the meantime.
  private async cancelAndRefund(
    payment: Payment & { _id: Types.ObjectId },
    order: Order & { _id: Types.ObjectId },
    session: Stripe.Checkout.Session,
  ) {
    await this.orderModel.updateOne(
      { _id: order._id },
      { status: OrderStatus.CANCELLED },
    );
    await this.paymentModel.updateOne(
      { _id: payment._id },
      { status: PaymentStatus.FAILED },
    );

    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;
    if (!paymentIntentId) {
      this.logger.error(
        `Order ${order._id} sold out but session ${session.id} has no payment intent to refund`,
      );
      return;
    }

    try {
      await this.stripe.refunds.create({ payment_intent: paymentIntentId });
      this.logger.warn(
        `Order ${order._id} sold out after payment, refunded session ${session.id}`,
      );
    } catch (e) {
      this.logger.error(
        `Refund failed for session ${session.id}, refund it manually`,
        e,
      );
    }
  }
}
