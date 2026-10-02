import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../shared/dto/pagination.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema.js';
import { Model } from 'mongoose';
import * as bcrypt from "bcrypt"

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
  ){}

  async findAll({page = 1, take = 10}: PaginationDto) {
    const resp = await this.userModel
                            .find()
                            .skip((page - 1) * take)
                            .limit(take)
    return resp
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id)
    if(!user) throw new NotFoundException("User not found")
    
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id)
    if(!user) throw new NotFoundException("User not found")

    if(updateUserDto.email && updateUserDto.email !== user.email){
      const emailAlreadyUsed = await this.userModel.findOne({email: updateUserDto.email})
      if(emailAlreadyUsed) throw new BadRequestException("Email already used")
    }

    if(updateUserDto.password){
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10)
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(id, updateUserDto, {new: true})

    return updatedUser
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id)
    if(!deletedUser) throw new NotFoundException("User not found")
    return deletedUser
  }
}
