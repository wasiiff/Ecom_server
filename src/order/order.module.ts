import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { Product, ProductSchema } from '../product/schemas/product.schema';
import { User, UserSchema } from 'src/auth/schemas/user.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { StripeModule } from 'src/stripe/stripe.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
    StripeModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
