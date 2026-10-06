import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, paymentSchema } from './schema/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Payment.name, schema: paymentSchema}
    ])
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService]
})
export class PaymentModule {}
