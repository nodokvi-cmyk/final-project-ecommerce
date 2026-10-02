import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({timestamps: true})
export class Product {

    @Prop({
        type: String,
        required: true,
        trim: true,
        index: "text"
    })
    productName!: string

    @Prop({
        type: String,
        required: true,
    })
    description!: string

    @Prop({
        type: Number,
        required: true
    })
    price!: number

    @Prop({
        type: Number,
        required: true
    })
    stock!: number

    @Prop({
        type: String,
        required: true
    })
    category!: string

    @Prop({
        type: [String],
        default: []
    })
    photos!: string[]
}

export const productSchema = SchemaFactory.createForClass(Product)