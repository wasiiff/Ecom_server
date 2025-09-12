import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Number, default: 0, min: 0, max: 5 })
  ratings: number;

  @Prop({
    type: [
      {
        color: { type: String, required: true, trim: true },
        images: [{ type: String, required: true }],
        sizes: [{ type: String }],
        stock: { type: Number, default: 0, min: 0 },
      },
    ],
    default: [],
  })
  variants: {
    color: string;
    images: string[];
    sizes: string[];
    stock: number;
  }[];

  @Prop({ type: Boolean, default: false })
  onSale: boolean;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  discountPercentage: number;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, default: 0, min: 0 })
  stock: number;

  @Prop({
    type: String,
    required: true,
    enum: ["money", "points", "hybrid"],
  })
  type: "money" | "points" | "hybrid";

  @Prop({ type: String, required: true, trim: true })
category: string;

  @Prop({ type: Number, default: 0, min: 0 })
  loyaltyPoints: number;

  @Prop({ type: Types.ObjectId, ref: "User" })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  updatedBy: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
