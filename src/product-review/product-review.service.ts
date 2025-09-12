import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ProductReview,
  ProductReviewDocument,
} from './schemas/product-review.schema';
import { CreateProductReviewDto } from './dto/create-product-review.dto';
import { UpdateProductReviewDto } from './dto/update-product-review.dto';
import { Product, ProductDocument } from '../product/schemas/product.schema';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectModel(ProductReview.name)
    private reviewModel: Model<ProductReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductReviewDto, userId: string) {
    const product = await this.productModel.findById(dto.product);
    if (!product) throw new NotFoundException('Product not found');

    const review = new this.reviewModel({
      product: dto.product,
       user: new Types.ObjectId(userId),
      rating: dto.rating,
      comment: dto.comment,
    });

    await review.save();
    await this.updateProductRating(dto.product);

    return review;
  }

  async update(id: string, dto: UpdateProductReviewDto) {
    const review = await this.reviewModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!review) throw new NotFoundException('Review not found');

    await this.updateProductRating(review.product.toString());
    return review;
  }

  async delete(id: string) {
    const review = await this.reviewModel.findByIdAndDelete(id);
    if (!review) throw new NotFoundException('Review not found');
    await this.updateProductRating(review.product.toString());
  }

  async findByProduct(productId: string) {
    return this.reviewModel
      .find({ product: productId })
      .populate('user', 'name email');
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.reviewModel.find({ product: productId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = reviews.length ? totalRating / reviews.length : 0;

    await this.productModel.findByIdAndUpdate(productId, {
      ratings: avgRating,
    });
  }
  // product-review.service.ts
  async findRecent(limit = 15) {
    return this.reviewModel
      .find()
      .sort({ createdAt: -1 }) // newest first
      .limit(limit)
      .populate('user', 'name email')
      .populate('product', 'name');
  }
}
