import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../users/schema/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ){}

  async getWishlist(userId: string){
    const user = await this.userModel.findById(userId).populate("wishlist")
    if(!user) throw new NotFoundException("User not found")

    return user.wishlist
  }

  async addProductToWishlist(userId: string, productId: string){
    const updatedUser = await this.userModel.findByIdAndUpdate(userId, 
      {$addToSet: {wishlist: productId}},
      {new: true}
    )
    if(!updatedUser) throw new NotFoundException("User not found")

    return updatedUser.wishlist
  }

  async removeProductFromWishlist(userId: string, productId: string){
    const updatedUser = await this.userModel.findByIdAndUpdate(userId, 
      {$pull: {wishlist: productId}},
      {new: true}
    )
    if(!updatedUser) throw new NotFoundException("User not found")
    return updatedUser.wishlist
  }
}
