import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { Product, ProductDocument } from '../product/schemas/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>, // ✅ inject Product
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product');

    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
      });
      await cart.save();
    }
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    let cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
      });
    }

    const product = await this.productModel.findById(dto.product); // ✅ strongly typed
    if (!product) throw new NotFoundException('Product not found');

    const discountedPrice =
      product.discountPercentage > 0
        ? product.price - (product.price * product.discountPercentage) / 100
        : product.price;

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === dto.product &&
        item.variant === dto.variant &&
        item.size === dto.size,
    );

    if (existingItem) {
      existingItem.quantity += dto.quantity;
      existingItem.price = discountedPrice; // ✅ update price snapshot
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.product),
        quantity: dto.quantity,
        variant: dto.variant,
        size: dto.size,
        price: discountedPrice, // ✅ save discounted price
      });
    }

    await cart.save();
    return await cart.populate('items.product');
  }

  async updateQuantity(userId: string, dto: UpdateCartItemDto): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find(
      (i) =>
        i.product.toString() === dto.product &&
        i.variant === dto.variant &&
        i.size === dto.size,
    );
    if (!item) throw new NotFoundException('Product not in cart');

    item.quantity = dto.quantity;
    await cart.save();
    return await cart.populate('items.product');
  }

  async removeFromCart(
    userId: string,
    productId: string,
    variant?: string,
    size?: string,
  ): Promise<Cart> {
    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });
    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter(
      (i) =>
        !(
          i.product.toString() === productId &&
          (variant ? i.variant === variant : true) &&
          (size ? i.size === size : true)
        ),
    );

    await cart.save();
    return await cart.populate('items.product');
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { items: [] },
    );
  }
}
