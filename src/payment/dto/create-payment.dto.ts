import { Transform, Type } from "class-transformer"
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested } from "class-validator"

export class PaymentItemDto{
    @IsNotEmpty()
    @IsString()
    name!: string

    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    @Transform(({value}) => Number(value))
    price!: number

    @IsNotEmpty()
    @IsPositive()
    @IsInt()
    @IsNumber()
    @Transform(({value}) => Number(value))
    quantity!: number
}

export class CreatePaymentDto {
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => PaymentItemDto)
    items!: PaymentItemDto[]

    @IsNotEmpty()
    @IsString()
    currency!: string
}
