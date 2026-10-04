import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, productSchema } from './schemas/product.schema';
import { AwsS3Module } from '../aws-s3/aws-s3.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Product.name, schema: productSchema}
    ]),
    AwsS3Module
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
