import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

let stripe: Stripe | null = null;

if (STRIPE_SECRET_KEY) {
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(params: CreatePaymentIntentParams): Promise<string> {
  if (!stripe) {
    // Dev mode simulation
    console.log('🔧 DEV MODE: Simulating Stripe payment intent creation');
    return `pi_dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || 'usd',
      metadata: params.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent.client_secret!;
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    throw new Error('Failed to create payment intent');
  }
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<boolean> {
  if (!stripe) {
    // Dev mode simulation
    console.log('🔧 DEV MODE: Simulating Stripe payment confirmation');
    return true;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Stripe payment confirmation failed:', error);
    return false;
  }
}

export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY;
}
