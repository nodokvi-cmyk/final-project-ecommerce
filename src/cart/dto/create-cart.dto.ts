import { IsInt, IsMongoId, IsNotEmpty, Min } from "class-validator";

export class CreateCartDto {
    @IsNotEmpty()
    @IsMongoId()
    productId!: string

    @IsNotEmpty()
    @IsInt()
    @Min(1)
    quantity!: number
}
