import { PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto';
import { OrderStatus } from '../schema/order.schema';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrderDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus

    @IsOptional()
    @IsString()
    shippingAddress?: string
}
