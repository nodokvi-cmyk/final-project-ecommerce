import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({
    timestamps: true
})
export class User {
    @Prop({
        type: String,
        required: true
    })
    fullName!: string

    @Prop({
        type: String,
        required: true,
        unique: true,
        lowercase: true
    })
    email!: string

    @Prop({
        type: Number,
        required: true
    })
    age!: number

    @Prop({
        type: String,
        required: false,
        select: false
    })
    password!: string

    @Prop({
        type: String,
        default: ""
    })
    avatarUrl!: string
}

export const userSchema = SchemaFactory.createForClass(User)