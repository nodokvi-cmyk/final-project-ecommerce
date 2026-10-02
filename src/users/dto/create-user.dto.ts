import {IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Length} from "class-validator"
import {Transform} from "class-transformer"

export class CreateUserDto {

    @IsNotEmpty()
    @IsString()
    fullName!: string

    @IsNotEmpty()
    @Transform(({value}) => (typeof value === "string" ? value.toLowerCase() : value))
    @IsEmail()
    email!: string

    @IsNotEmpty()
    @IsNumber()
    @Transform(({value}) => Number(value))
    age!: number

    @IsNotEmpty()
    @IsString()
    @Length(6, 20)
    password!: string

    @IsOptional()
    avatarUrl?: string
}
