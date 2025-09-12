import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { UserModule } from './user/user.module';
import { ProductReviewModule } from './product-review/product-review.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StripeModule } from './stripe/stripe.module';

console.log('AppModule loaded');

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://wasifbinnasir:wasifbinnasir@cluster0.h8sdsew.mongodb.net/beastecom?retryWrites=true&w=majority&appName=Cluster0',
    ),
    ProductModule,
    AuthModule,
    CartModule,
    OrderModule,
    UserModule,
    ProductReviewModule,
    MailModule,
    NotificationsModule,
    StripeModule,
  ],
})
export class AppModule {}
