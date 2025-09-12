import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const product = new this.productModel({
      ...dto,
      createdBy: userId,
    });
    console.log(product);
    return product.save();
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: Product[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.productModel
        .find()
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    console.log('🔎 Incoming ID:', id, 'Length:', id.length);
    const product = await this.productModel
      .findById(id)
      .populate('category')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { ...dto, updatedBy: userId },
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Product not found');
  }
  async filter(
    filters: {
      color?: string;
      size?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
    },
    page = 1,
    limit = 10,
  ): Promise<{ data: Product[]; total: number }> {
    const skip = (page - 1) * limit;

    const match: any = {};

    if (filters.category) {
      match.category = filters.category;
    }

    if (filters.color || filters.size) {
      match.variants = { $elemMatch: {} };
      if (filters.color) match.variants.$elemMatch.color = filters.color;
      if (filters.size) match.variants.$elemMatch.sizes = filters.size;
    }

    const basePipeline: any[] = [
      {
        $addFields: {
          discountedPrice: {
            $cond: {
              if: { $gt: ['$discountPercentage', 0] },
              then: {
                $subtract: [
                  '$price',
                  {
                    $multiply: [
                      '$price',
                      { $divide: ['$discountPercentage', 100] },
                    ],
                  },
                ],
              },
              else: '$price',
            },
          },
        },
      },
      { $match: match },
    ];

    // Price filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: any = {};
      if (filters.minPrice !== undefined) priceFilter.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceFilter.$lte = filters.maxPrice;

      basePipeline.push({ $match: { discountedPrice: priceFilter } });
    }

    // Pipeline for data with pagination
    const paginatedPipeline = [
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'updatedBy',
          foreignField: '_id',
          as: 'updatedBy',
        },
      },
      { $unwind: { path: '$updatedBy', preserveNullAndEmptyArrays: true } },
    ];

    const [data, countResult] = await Promise.all([
      this.productModel.aggregate(paginatedPipeline).exec(),
      this.productModel
        .aggregate([...basePipeline, { $count: 'count' }])
        .exec(),
    ]);

    const total = countResult[0]?.count || 0;

    return { data, total };
  }
}
