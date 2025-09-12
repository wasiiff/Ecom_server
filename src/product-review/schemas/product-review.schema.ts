import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { Product } from '../../product/schemas/product.schema';

export type ProductReviewDocument = ProductReview & Document;

@Schema({ timestamps: true }) 
export class ProductReview {
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;


  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);
