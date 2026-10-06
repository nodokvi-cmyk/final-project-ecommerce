import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { IsAuthGuard } from '../guards/isAuth.guard';
import { UserId } from '../users/decorators/user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { IsValidMongoIdDto } from '../shared/dto/is-valid-mongo-id.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RolesGuard } from '../guards/role.guard';
import { Roles } from '../users/decorators/user-role.decorator';
import { UserRole } from '../users/schema/user.schema';

@Controller('orders')
@UseGuards(IsAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    create(
        @UserId() userId: string,
        @Body() createOrderDto: CreateOrderDto
    ){
        return this.ordersService.create(userId, createOrderDto)
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(){
        return this.ordersService.findAll()
    }

    @Get("my-orders")
    findMyOrders(
        @UserId() userId: string
    ){
        return this.ordersService.findByUser(userId)
    }

    @Get(":id")
    findOne(
        @Param() {id}: IsValidMongoIdDto
    ){
        return this.ordersService.findOne(id)
    }

    @Patch(":id")
    @Roles(UserRole.ADMIN)
    update(
        @Param() {id}: IsValidMongoIdDto,
        @Body() updateOrderDto: UpdateOrderDto
    ){
        return this.ordersService.update(id, updateOrderDto)
    }

    @Delete(":id")
    @Roles(UserRole.ADMIN)
    remove(
        @Param() {id}: IsValidMongoIdDto
    ){
        return this.ordersService.remove(id)
    }
}
