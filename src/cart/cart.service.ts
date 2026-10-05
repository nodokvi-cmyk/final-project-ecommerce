import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cart } from './schema/cart.schema';
import { Model, Types } from 'mongoose';
import { Product } from '../products/schemas/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ){}

  async getCart(userId: string) {
    let cart = await this.cartModel.findOne({userId})

    if(!cart){
      cart = await this.cartModel.create({
        userId,
        items: [],
        totalPrice: 0
      })
    }

    return cart
  }

  async addItemToCart(userId: string, {productId, quantity}: CreateCartDto) {
    const product = await this.productModel.findById(productId)
    if(!product) throw new NotFoundException("Product not found")

    const cart = await this.getCart(userId)
    const existingItemIndex = cart.items.findIndex((i) => i.productId.toString() === productId)

    if(existingItemIndex !== -1){
      const newQuantity = cart.items[existingItemIndex].quantity + quantity
      if(product.stock < newQuantity) throw new BadRequestException(`Total quantity of this product is ${product.stock}`)
      cart.items[existingItemIndex].quantity = newQuantity
      cart.items[existingItemIndex].price = product.price
    } else {
      if(product.stock < quantity) throw new BadRequestException(`Total quantity of this product is ${product.stock}`)
      cart.items.push({
        productId: product._id as Types.ObjectId,
        price: product.price,
        quantity
      } as any)
    }

    cart.totalPrice = cart.items.reduce((curr, item) => curr + item.price * item.quantity, 0)

    return await cart.save()
  }

  async updateItemQuantityInCart(userId: string, productId: string, {quantity}: UpdateCartDto) {
    const cart = await this.getCart(userId)
    const itemIndex = cart.items.findIndex((i) => i.productId.toString() === productId)

    if(itemIndex === -1) throw new NotFoundException("Item not found in the cart")

    const product = await this.productModel.findById(productId)
    if(!product) throw new NotFoundException("Product not found")

    if(product.stock < quantity) throw new BadRequestException(`Total quantity of this product is ${product.stock}`)
    
    cart.items[itemIndex].quantity = quantity
    cart.items[itemIndex].price = product.price

    cart.totalPrice = cart.items.reduce((curr, item) => curr + item.price * item.quantity, 0)

    return await cart.save()
  }

  async removeItemFromCart(userId: string, productId: string) {
    const cart = await this.getCart(userId)

    const itemExists = cart.items.some((i) => i.productId.toString() === productId)
    if(!itemExists) throw new NotFoundException("Item in the cart not found")

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId)

    cart.totalPrice = cart.items.reduce((curr, item) => curr + item.price * item.quantity, 0)

    return await cart.save()
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId)
    cart.items = []
    cart.totalPrice = 0

    return await cart.save()
  }
}
