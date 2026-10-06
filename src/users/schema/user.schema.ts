import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Prop({
    type: String,
    required: true,
  })
  fullName!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  })
  email!: string;

  @Prop({
    type: Number,
    required: true,
  })
  age!: number;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ type: String })
  OTPCode!: string;

  @Prop({ type: Number })
  OTPCodeExpirationDate!: number;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password!: string;

  @Prop({
    type: String,
    default: '',
  })
  avatarUrl!: string;

  @Prop({
    type: [{type: Types.ObjectId, ref: "Product"}],
    default: []
  })
  wishlist!: Types.ObjectId[]
}

export const userSchema = SchemaFactory.createForClass(User);
