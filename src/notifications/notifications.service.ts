import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notifications.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    recipient?: string | null;
    orderId?: string | Types.ObjectId | null;
  }) {
    const doc = new this.notificationModel({
      type: data.type,
      title: data.title,
      message: data.message,
      recipient: data.recipient ? new Types.ObjectId(data.recipient) : null,
      orderId: data.orderId ? new Types.ObjectId(data.orderId) : null,
      read: false,
    });
    return doc.save();
  }

  async findAll({
    page = 1,
    limit = 20,
    read,
  }: { page?: number; limit?: number; read?: boolean | undefined }) {
    const filter: Record<string, any> = {};
    if (typeof read === 'boolean') filter.read = read;

    const items = await this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await this.notificationModel.countDocuments(filter);
    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async markAllRead() {
    const now = new Date();
    await this.notificationModel.updateMany({ read: false }, { read: true, readAt: now });
    return { success: true };
  }

  async markRead(id: string) {
    const updated = await this.notificationModel.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true },
    );
    if (!updated) throw new NotFoundException('Notification not found');
    return updated;
  }

  async delete(id: string) {
    const res = await this.notificationModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Notification not found');
    return { success: true };
  }

  async unreadCount() {
    const count = await this.notificationModel.countDocuments({ read: false });
    return { count };
  }
}