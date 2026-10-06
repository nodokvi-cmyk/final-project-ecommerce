import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { SchemaTypes, Types } from "mongoose";

export enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
}

@Schema({timestamps: true})
export class Payment {
    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "User"
    })
    userId!: Types.ObjectId

    @Prop({
        type: SchemaTypes.ObjectId,
        required: true,
        ref: "Order"
    })
    orderId!: Types.ObjectId

    @Prop({
        type: String,
        required: true
    })
    stripeSessionId!: string

    @Prop({
        type: Number,
        required: true
    })
    amount!: number

    @Prop({
        type: String,
        required: true
    })
    currency!: string

    @Prop({
        required: true,
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status!: PaymentStatus
}

export const paymentSchema = SchemaFactory.createForClass(Payment)