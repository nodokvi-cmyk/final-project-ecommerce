import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order } from './schema/order.schema';
import { Model, Types } from 'mongoose';
import { Cart } from '../cart/schema/cart.schema';
import { Product } from '../products/schemas/product.schema';
import { UserRole } from '../users/schema/user.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  async create(userId: string, { shippingAddress }: CreateOrderDto) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!cart || !cart.items.length)
      throw new BadRequestException('Your cart is empty');

    const products = await this.productModel.find({
      _id: { $in: cart.items.map((item) => item.productId) },
    });
    const productsById = new Map(products.map((p) => [p._id.toString(), p]));

    const orderedItems = cart.items.map((item) => {
      const product = productsById.get(item.productId.toString());
      if (!product)
        throw new BadRequestException(
          'A product in your cart is no longer available',
        );
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Only ${product.stock} of "${product.productName}" left in stock`,
        );
      }

      return {
        productId: product._id,
        name: product.productName,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const totalAmount = orderedItems.reduce(
      (curr, item) => curr + item.price * item.quantity,
      0,
    );

    return this.orderModel.create({
      userId: new Types.ObjectId(userId),
      orderedItems,
      totalAmount,
      shippingAddress,
    });
  }

  async findAll() {
    return this.orderModel.find().populate('userId', 'email name');
  }

  async findByUser(userId: string) {
    return this.orderModel.find({ userId: new Types.ObjectId(userId) });
  }

  async findOne(id: string, userId: string, userRole: UserRole) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (userRole !== UserRole.ADMIN && order.userId.toString() !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      updateOrderDto,
      { new: true },
    );
    if (!updatedOrder) throw new NotFoundException('Order not found');

    return updatedOrder;
  }

  async remove(id: string) {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id);
    if (!deletedOrder) throw new NotFoundException('Order not found');

    return deletedOrder;
  }
}
