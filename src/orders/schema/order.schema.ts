import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {SchemaTypes, Types } from "mongoose";

export enum OrderStatus {
    PENDING = "pending",
    PAID = "paid",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}

@Schema({timestamps: true})
export class OrderItem{
    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "Product"
    })
    productId!: Types.ObjectId

    @Prop({
        type: String,
        required: true
    })
    name!: string

    @Prop({
        type: Number,
        required: true
    })
    price!: number

    @Prop({
        type: Number,
        required: true
    })
    quantity!: number
}

export const orderItemSchema = SchemaFactory.createForClass(OrderItem)

@Schema({timestamps: true})
export class Order {
    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "User"
    })
    userId!: Types.ObjectId

    @Prop({
        type: [orderItemSchema],
        required: true
    })
    orderedItems!: OrderItem[]

    @Prop({
        type: Number,
        required: true
    })
    totalAmount!: number

    @Prop({
        type: String,
        enum: OrderStatus,
        required: true,
        default: OrderStatus.PENDING
    })
    status!: OrderStatus

    @Prop({
        type: String,
        required: true
    })
    shippingAddress!: string
}

export const orderSchema = SchemaFactory.createForClass(Order)