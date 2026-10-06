import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>
  ){}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const totalAmount = createOrderDto.orderedItems.reduce((curr, item) => curr + item.price * item.quantity, 0)
    const newOrder = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      orderedItems: createOrderDto.orderedItems.map((item) => ({
        ...item,
        productId: new Types.ObjectId(item.productId)
      })),
      totalAmount,
      shippingAddress: createOrderDto.shippingAddress
    })

    return newOrder
  }

  async findAll() {
    return this.orderModel.find().populate("userId", "email name")
  }

  async findByUser(userId: string){
    return this.orderModel.find({userId: new Types.ObjectId(userId)})
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id)
    if(!order) throw new NotFoundException("Order not found")

    return order
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updatedOrder = await this.orderModel.findByIdAndUpdate(id, updateOrderDto, {new: true})
    if(!updatedOrder) throw new NotFoundException("Order not found")

    return updatedOrder
  }

  async remove(id: string) {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id)
    if(!deletedOrder) throw new NotFoundException("Order not found")

    return deletedOrder
  }
}
