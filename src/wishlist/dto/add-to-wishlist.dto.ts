import { IsMongoId, IsNotEmpty } from "class-validator";

export class AddToWishlistDto {
    @IsNotEmpty()
    @IsMongoId()
    productId!: string
}
