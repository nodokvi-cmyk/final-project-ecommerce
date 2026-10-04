import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, cartSchema } from './schema/cart.schema';
import { Product, productSchema } from '../products/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Cart.name, schema: cartSchema},
      {name: Product.name, schema: productSchema}
    ])
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService]
})
export class CartModule {}
