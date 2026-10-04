import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

@Schema({timestamps: true})
export class CartItem {
    @Prop({
        type: SchemaTypes.ObjectId,
        ref: "Product",
        required: true
    })
    productId!: Types.ObjectId

    @Prop({
        type: Number,
        required: true
    })
    price!: number

    @Prop({
        type: Number,
        required: true,
        min: 1,
        default: 1
    })
    quantity!: number
}

export const cartItemSchema = SchemaFactory.createForClass(CartItem)


@Schema({timestamps: true})
export class Cart{
    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "User",
        unique: true
    })
    userId!: Types.ObjectId

    @Prop({
        type: [cartItemSchema],
        default: []
    })
    items!: CartItem[]

    @Prop({
        type: Number,
        required: true,
        default: 0
    })
    totalPrice!: number
}

export const cartSchema = SchemaFactory.createForClass(Cart)