import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: User.name, schema: userSchema}
    ])
  ],
  controllers: [WishlistController],
  providers: [WishlistService],
  exports: [WishlistService]
})
export class WishlistModule {}
