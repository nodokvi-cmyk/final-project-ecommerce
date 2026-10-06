import { Transform, Type } from "class-transformer";
import { IsArray, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator";

export class CreateOrderItemDto {
    @IsNotEmpty()
    @IsMongoId()
    productId!: string

    @IsNotEmpty()
    @IsString()
    name!: string
    
    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    @Transform(({value}) => Number(value))
    price!: number

    @IsNotEmpty()
    @IsInt()
    @IsNumber()
    @Transform(({value}) => Number(value))
    quantity!: number
}

export class CreateOrderDto{
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => CreateOrderItemDto)
    orderedItems!: CreateOrderItemDto[]

    @IsNotEmpty()
    @IsString()
    shippingAddress!: string
}