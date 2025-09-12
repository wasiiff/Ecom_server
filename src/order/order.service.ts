import { StripeService } from './../stripe/stripe.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Product, ProductDocument } from '../product/schemas/product.schema';
import { User, UserDocument } from 'src/auth/schemas/user.schema';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationType } from 'src/notifications/schemas/notifications.schema';
import Stripe from 'stripe';

interface ProductVariant {
  color: string;
  sizes: string[];
  stock: number;
}

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly stripeService: StripeService,
  ) {}

  async create(
    dto: CreateOrderDto,
    userId: string,
  ): Promise<{ order?: Order; checkoutUrl?: string }> {
    let totalAmount = 0;
    const items: Order['items'] = [];

    const session = await this.orderModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user) throw new NotFoundException('User not found');

      // ✅ Loop through products and calculate totals
      for (const item of dto.items) {
        const product = await this.productModel
          .findById(item.product)
          .session(session);
        if (!product) {
          throw new NotFoundException(`Product not found: ${item.product}`);
        }

        let selectedVariant: ProductVariant | undefined;

        if (item.color && item.size) {
          selectedVariant = product.variants.find(
            (v) =>
              v.color === item.color &&
              item.size !== undefined &&
              v.sizes.includes(item.size),
          );

          if (!selectedVariant) {
            throw new BadRequestException(
              `Variant not found for ${product.name} (${item.color}, ${item.size})`,
            );
          }

          if (selectedVariant.stock < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for ${product.name} (${item.color}, ${item.size})`,
            );
          }

          selectedVariant.stock -= item.quantity;
        } else {
          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for product: ${product.name}`,
            );
          }
          product.stock -= item.quantity;
        }

        const discountedPrice =
          product.discountPercentage > 0
            ? product.price - (product.price * product.discountPercentage) / 100
            : product.price;

        const subtotal = discountedPrice * item.quantity;
        totalAmount += subtotal;

        items.push({
          product: product._id as Types.ObjectId,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: discountedPrice,
          subtotal,
        });

        await product.save({ session });
      }

      // ✅ Apply discount
      totalAmount -= dto.discount || 0;

      // 🔥 Handle checkout types
      if (dto.checkoutType === 'points') {
        // --- POINTS CHECKOUT ---
        const pointsRequired = totalAmount;

        if (user.loyaltyPoints < pointsRequired) {
          throw new ForbiddenException('Not enough loyalty points');
        }

        user.loyaltyPoints -= pointsRequired;
        totalAmount = 0;

        const order = new this.orderModel({
          user: new Types.ObjectId(userId),
          items,
          totalAmount,
          pointsUsed: pointsRequired,
          discount: dto.discount || 0,
          status: OrderStatus.CONFIRMED, // immediately confirmed
        });

        await order.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        // 🔔 Send notification
        const notification = await this.notificationsService.create({
          type: NotificationType.ORDER_CREATED,
          title: 'New order placed',
          message: `${user.name ?? 'Customer'} placed an order with points`,
          recipient: null,
          orderId: order._id,
        });

        this.notificationsGateway.broadcastNewNotification({
          id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          orderId: order._id.toString(),
          createdAt: notification.createdAt,
          read: notification.read,
        });

        return { order };
      } else {
        // --- MONEY CHECKOUT ---
        const stripeSession = await this.stripeService.createCheckoutSession(
          user._id.toString(),
          totalAmount,
          {
            items,
            discount: dto.discount || 0,
            checkoutType: dto.checkoutType,
          },
        );

        // ✅ Save order immediately with status PENDING
        const order = new this.orderModel({
          user: new Types.ObjectId(userId),
          items,
          totalAmount,
          discount: dto.discount || 0,
          checkoutType: dto.checkoutType,
          status: OrderStatus.PENDING, // mark as pending until webhook confirms
          stripeSessionId: stripeSession.id, // store stripe session
        });

        await order.save({ session });
        await user.save({ session });
        await session.commitTransaction();

        // 🔔 Send notification
        const notification = await this.notificationsService.create({
          type: NotificationType.ORDER_CREATED,
          title: 'New order started',
          message: `${user.name ?? 'Customer'} started a payment`,
          recipient: null,
          orderId: order._id,
        });

        this.notificationsGateway.broadcastNewNotification({
          id: notification._id.toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          orderId: order._id.toString(),
          createdAt: notification.createdAt,
          read: notification.read,
        });

        return { order, checkoutUrl: stripeSession.url ?? undefined };
      }
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  async createOrderFromStripe(
    userId: string,
    orderPayload: any,
    session: Stripe.Checkout.Session,
  ): Promise<Order> {
    const mongoSession = await this.orderModel.db.startSession();
    mongoSession.startTransaction();

    try {
      const user = await this.userModel.findById(userId).session(mongoSession);
      if (!user) throw new NotFoundException('User not found');

      // 🔥 Save order as CONFIRMED now
      const order = new this.orderModel({
        user: new Types.ObjectId(userId),
        items: orderPayload.items,
        totalAmount: session.amount_total! / 100,
        discount: orderPayload.discount || 0,
        checkoutType: orderPayload.checkoutType || 'money',
        status: OrderStatus.CONFIRMED,
        stripeSessionId: session.id,
      });

      await order.save({ session: mongoSession });
      await mongoSession.commitTransaction();

      // 🔔 Send notification
      const notification = await this.notificationsService.create({
        type: NotificationType.ORDER_CREATED,
        title: 'New order confirmed',
        message: `${user.name ?? 'Customer'} successfully placed an order`,
        recipient: null,
        orderId: order._id,
      });

      this.notificationsGateway.broadcastNewNotification({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        orderId: order._id.toString(),
        createdAt: notification.createdAt,
        read: notification.read,
      });

      return order;
    } catch (err) {
      await mongoSession.abortTransaction();
      throw err;
    } finally {
      mongoSession.endSession();
    }
  }

  async findAll(page = 1, limit = 100): Promise<OrderDocument[]> {
    return this.orderModel
      .find()
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name email')
      .populate('items.product', 'name price');
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findById(id)
      .populate('user', 'name email')
      .populate('items.product', 'name price');
    if (!order) throw new NotFoundException('Order not found');

    return order;
  }

  async update(
    id: string,
    dto: UpdateOrderDto,
    adminId?: string,
  ): Promise<Order> {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (dto.status) order.status = dto.status;
    order.set({ ...dto, updatedBy: adminId });

    await order.save();
    return order;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Order not found');
  }
}
