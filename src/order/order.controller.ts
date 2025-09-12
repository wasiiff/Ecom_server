import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/schemas/user.schema';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';
import { OrderStatus } from './schemas/order.schema';
import { Types } from 'mongoose';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly stripeService: StripeService,
  ) {}

  // ✅ User: place an order
  @Post()
  async create(@Body() dto: CreateOrderDto, @Req() req: any) {
    console.log('User:', req.user);
    console.log('Order DTO:', dto);

    // orderService will return { order, checkoutUrl? }
    return this.orderService.create(dto, req.user._id);
  }

  // ✅ Payment: create Stripe checkout session manually
// ✅ Stripe manual payment route
@Post(':id/pay')
async pay(@Param('id') orderId: string) {
  const order = await this.orderService.findOne(orderId);

  if (!order) throw new BadRequestException('Order not found');
  if (order.totalAmount <= 0) {
    throw new BadRequestException('Order has no payable amount');
  }

  // Pass orderPayload along to Stripe
  const session = await this.stripeService.createCheckoutSession(
    order.user.toString(),
    order.totalAmount,
    {
      items: order.items,
      discount: order.discount,
      checkoutType: 'money',
    },
  );

  return { checkoutUrl: session.url };
}

// ✅ Webhook: move DB logic into service
@Post('webhook')
async handleWebhook(@Req() req: any, @Headers('stripe-signature') sig: string) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const payload = req.rawBody;
  console.log({payload})
  let event: Stripe.Event;
  try {
    event = this.stripeService.constructEvent(payload, sig, endpointSecret);
  } catch (err) {
    throw new BadRequestException(`Webhook Error: ${(err as Error).message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (!session.metadata) {
      throw new BadRequestException('Missing metadata on session');
    }

    const userId = session.metadata.userId;
    const orderPayload = JSON.parse(session.metadata.orderPayload);

    // Delegate saving to service
    await this.orderService.createOrderFromStripe(
      userId,
      orderPayload,
      session,
    );
  }

  return { received: true };
}



  // ✅ User/Admin: get my order by ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // ✅ Admin: get all orders
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  // ✅ Admin: update order status
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req: any,
  ) {
    return this.orderService.update(id, dto, req.user.userId);
  }

  // ✅ Admin: delete order
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
