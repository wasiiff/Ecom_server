import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';
import { Order } from 'src/order/schemas/order.schema';

export type NotificationDocument = Notification & Document & { _id: Types.ObjectId };


export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  // add more types later (ORDER_PAID, LOW_STOCK, etc.)
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  // Target user for this notification (admin). You can also use null for global.
  @Prop({ type: Types.ObjectId, ref: User.name, default: null, index: true })
  recipient: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: Order.name, default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Boolean, default: false, index: true })
  read: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date })
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);