import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, orderSchema } from './schema/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Order.name, schema: orderSchema}
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
