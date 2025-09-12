import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CartDocument = Cart & Document;

@Schema({ _id: false }) // embedded subdocument
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: "Product", required: true })
  product: Types.ObjectId;

  @Prop({ type: Number, default: 1, min: 1 })
  quantity: number;

  @Prop({ type: String, required: false }) // e.g., "Red"
  variant?: string;

  @Prop({ type: String, required: false }) // e.g., "M"
  size?: string;

  @Prop({ type: Number, required: true, min: 0 }) // ✅ snapshot price
  price: number;
}

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  user: Types.ObjectId;

  @Prop({
    type: [
      {
        product: { type: Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, default: 1, min: 1 },
        variant: { type: String },
        size: { type: String },
        price: { type: Number, required: true, min: 0 }, // ✅ added
      },
    ],
    default: [],
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
