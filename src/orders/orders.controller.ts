import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserId } from '../users/decorators/user.decorator';
import { UserRole } from '../users/schema/user.schema';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';
import { Request } from 'express';

type RequestWithUser = Request & {
  userId?: string;
  userRole?: UserRole;
};

@Controller('orders')
@UseGuards(IsAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @UserId() userId: string,
    @Body() createOrderDto: CreateOrderDto
  ) {
    return this.ordersService.create(userId, createOrderDto);
  }

  @Get()
  findByUser(@UserId() userId: string) {
    return this.ordersService.findByUser(userId);
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param() {id}: IsValidMongoIdDto,
    @UserId() userId: string,
    @Req() req: RequestWithUser
  ) {
    const order = await this.ordersService.findOne(id);
    this.assertOwnerOrAdmin(order.userId, userId, req.userRole);
    return order;
  }

  @Patch(':id')
  async update(
    @Param() {id}: IsValidMongoIdDto,
    @Body() updateOrderDto: UpdateOrderDto,
    @UserId() userId: string,
    @Req() req: RequestWithUser
  ) {
    const order = await this.ordersService.findOne(id);
    this.assertOwnerOrAdmin(order.userId, userId, req.userRole);
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async remove(
    @Param() {id}: IsValidMongoIdDto,
    @UserId() userId: string,
    @Req() req: RequestWithUser
  ) {
    const order = await this.ordersService.findOne(id);
    this.assertOwnerOrAdmin(order.userId, userId, req.userRole);
    return this.ordersService.remove(id);
  }

  private assertOwnerOrAdmin(orderUserId: unknown, userId: string, userRole?: UserRole) {
    if (userRole !== UserRole.ADMIN && String(orderUserId) !== userId) {
      throw new ForbiddenException('No permission');
    }
  }
}
