import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });
  }
async createCheckoutSession(
  userId: string,
  amount: number,
  orderPayload: any,
) {

  const normalizedAmount = Math.round(Number(amount.toFixed(2)) * 100);

  return this.stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Order Checkout' },
          unit_amount: normalizedAmount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.CLIENT_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/orders/cancel`,
    metadata: {
      userId,
      orderPayload: JSON.stringify(orderPayload),
    },
  });
}


  async retrieveSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }
   constructEvent(
    payload: Buffer | string,
    signature: string,
    secret: string,
  ): Stripe.Event {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
