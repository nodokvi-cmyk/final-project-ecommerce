import { Transform } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from "class-validator";


export class CreateProductDto {

    @IsNotEmpty()
    @Transform(({value}) => value.trim())
    @IsString()
    productName!: string

    @IsNotEmpty()
    @IsString()
    description!: string

    @IsNotEmpty()
    @IsPositive()
    @IsNumber()
    @Transform(({value}) => Number(value))
    price!: number

    @IsNotEmpty()
    @Min(0)
    @IsInt()
    @IsNumber()
    @Transform(({value}) => Number(value))
    stock!: number

    @IsNotEmpty()
    @IsString()
    category!: string

    @IsOptional()
    @IsArray()
    @IsString({each: true})
    photos?: string[]
}
