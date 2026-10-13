import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, paymentSchema } from './schema/payment.schema';
import { Order, orderSchema } from '../orders/schema/order.schema';
import { Cart, cartSchema } from '../cart/schema/cart.schema';
import { Product, productSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: paymentSchema },
      { name: Order.name, schema: orderSchema },
      { name: Cart.name, schema: cartSchema },
      { name: Product.name, schema: productSchema },
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
