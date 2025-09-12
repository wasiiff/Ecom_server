import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductReviewService } from './product-review.service';
import { ProductReviewController } from './product-review.controller';
import { ProductReview, ProductReviewSchema } from './schemas/product-review.schema';
import { Product, ProductSchema } from '../product/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductReview.name, schema: ProductReviewSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  providers: [ProductReviewService],
  controllers: [ProductReviewController],
})
export class ProductReviewModule {}
