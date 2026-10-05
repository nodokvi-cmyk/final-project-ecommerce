import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { UserId } from '../users/decorators/user.decorator';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';

@Controller('cart')
@UseGuards(IsAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@UserId() userId: string){
    return this.cartService.getCart(userId)
  }

  @Post()
  addItem(
    @UserId() userId: string,
    @Body() createCartDto: CreateCartDto
  ){
    return this.cartService.addItemToCart(userId, createCartDto)
  }

  @Patch("item/:id")
  updateItemQuantity(
    @UserId() userId: string,
    @Param() {id}: IsValidMongoIdDto,
    @Body() updateCartDto: UpdateCartDto
  ){
    return this.cartService.updateItemQuantityInCart(userId, id, updateCartDto)
  }

  @Delete(":id")
  removeItemFromCart(
    @UserId() userId: string,
    @Param() {id}: IsValidMongoIdDto
  ){
    return this.cartService.removeItemFromCart(userId, id)
  }

  @Delete()
  deleteCart(@UserId() userId: string){
    return this.cartService.clearCart(userId)
  }
}
