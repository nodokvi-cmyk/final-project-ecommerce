import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { UserId } from '../users/decorators/user.decorator';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';

@Controller('wishlist')
@UseGuards(IsAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(
    @UserId() userId: string
  ){
    return this.wishlistService.getWishlist(userId)
  }

  @Post()
  addProductToWishlist(
    @UserId() userId: string,
    @Body() {productId}: AddToWishlistDto
  ){
    return this.wishlistService.addProductToWishlist(userId, productId)
  }

  @Delete(":id")
  removeProductFromWishlist(
    @UserId() userId: string,
    @Param() {id}: IsValidMongoIdDto
  ){
    return this.wishlistService.removeProductFromWishlist(userId, id)
  }
}
