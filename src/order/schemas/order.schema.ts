import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Product } from '../../product/schemas/product.schema';

export type OrderDocument = Order & Document & { _id: Types.ObjectId };

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum CheckoutType {
  MONEY = 'money',
  POINTS = 'points',
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: Product.name, required: true },
        color: { type: String },
        size: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        subtotal: { type: Number, required: true, min: 0 },
      },
    ],
    required: true,
  })
  items: {
    product: Types.ObjectId;
    color?: string;
    size?: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];

  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: Number, default: 0 })
  pointsUsed: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: CheckoutType, default: CheckoutType.MONEY })
  checkoutType: CheckoutType;

  @Prop({ type: Types.ObjectId, ref: User.name })
  updatedBy?: Types.ObjectId;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
