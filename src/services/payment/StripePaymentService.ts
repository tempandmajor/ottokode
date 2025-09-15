import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../../lib/supabase';
import { authService } from '../auth/AuthService';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  stripe_price_id: string;
  features: string[];
  is_popular?: boolean;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  payment_intent_id?: string;
}

class StripePaymentService {
  private stripe: Stripe | null = null;

  constructor() {
    this.initializeStripe();
  }

  private async initializeStripe() {
    this.stripe = await stripePromise;
  }

  async createPaymentIntent(priceId: string, planId: string): Promise<PaymentResult> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Call your backend to create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          plan_id: planId,
          user_id: authState.user.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to create payment intent' };
      }

      return {
        success: true,
        payment_intent_id: data.payment_intent_id,
      };
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  async confirmPayment(clientSecret: string, paymentMethodId: string): Promise<PaymentResult> {
    if (!this.stripe) {
      await this.initializeStripe();
    }

    if (!this.stripe) {
      return { success: false, error: 'Stripe not initialized' };
    }

    try {
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (paymentIntent?.status === 'succeeded') {
        return { success: true, payment_intent_id: paymentIntent.id };
      }

      return { success: false, error: 'Payment not completed' };
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      return { success: false, error: 'Payment confirmation failed' };
    }
  }

  async createCheckoutSession(priceId: string, planId: string): Promise<{ url?: string; error?: string }> {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      return { error: 'User not authenticated' };
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.session?.access_token}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          plan_id: planId,
          user_id: authState.user.id,
          success_url: `${window.location.origin}/billing/success`,
          cancel_url: `${window.location.origin}/billing/cancel`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Failed to create checkout session' };
      }

      return { url: data.url };
    } catch (error) {
      console.error('Checkout session creation failed:', error);
      return { error: 'Network error occurred' };
    }
  }

  async getPaymentPlans(): Promise<PaymentPlan[]> {
    // Map your created Stripe products to payment plans
    const plans: PaymentPlan[] = [
      {
        id: 'starter',
        name: 'Starter Plan',
        description: '$20/month with 15% markup on AI API costs',
        price: 20.00,
        credits: 20.00,
        stripe_price_id: 'price_1S70BXDX7MpgnLAiT2raCNMA', // From your created price
        features: [
          '15% markup on AI API costs',
          'Access to all AI models',
          'Priority support',
          'Usage analytics'
        ]
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: '$100/month with 15% markup on AI API costs',
        price: 100.00,
        credits: 100.00,
        stripe_price_id: 'price_1S70BdDX7MpgnLAiFoIZthjR', // From your created price
        features: [
          '15% markup on AI API costs',
          'Access to all AI models',
          'Priority support',
          'Advanced analytics',
          'Custom integrations'
        ],
        is_popular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: '$200/month with 10% markup on AI API costs',
        price: 200.00,
        credits: 200.00,
        stripe_price_id: 'price_1S70BhDX7MpgnLAi0Lo5qdNO', // From your created price
        features: [
          'Only 10% markup on AI API costs',
          'Access to all AI models',
          'Dedicated support',
          'Advanced analytics',
          'Custom integrations',
          'SLA guarantee'
        ]
      },
      {
        id: 'boost',
        name: 'Credit Boost',
        description: '$10 credit boost with 10% markup',
        price: 10.00,
        credits: 10.00,
        stripe_price_id: 'price_1S70BmDX7MpgnLAiomHtCfbf', // From your created price
        features: [
          '10% markup on AI API costs',
          'Instant credit top-up',
          'No expiration'
        ]
      }
    ];

    return plans;
  }

  async processWebhook(payload: any, signature: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify webhook signature (implement this in your backend)
      const event = payload;

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return { success: false, error: 'Webhook processing failed' };
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    try {
      // Extract user_id and plan_id from metadata
      const { user_id, plan_id } = paymentIntent.metadata;

      if (!user_id || !plan_id) {
        console.error('Missing metadata in payment intent:', paymentIntent.id);
        return;
      }

      const plans = await this.getPaymentPlans();
      const plan = plans.find(p => p.id === plan_id);

      if (!plan) {
        console.error('Plan not found:', plan_id);
        return;
      }

      // Add credits to user account
      const { error: creditError } = await supabase.rpc('add_user_credits', {
        p_user_id: user_id,
        p_amount: plan.credits
      });

      if (creditError) {
        console.error('Failed to add credits:', creditError);
        return;
      }

      // Log successful transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user_id,
          transaction_type: 'purchase',
          amount: plan.price,
          credits_amount: plan.credits,
          description: `Purchased ${plan.name} - ${plan.credits} credits`,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'completed'
        });

      console.log(`Successfully processed payment for user ${user_id}, plan ${plan_id}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  private async handlePaymentFailure(paymentIntent: any) {
    try {
      const { user_id, plan_id } = paymentIntent.metadata;

      if (!user_id || !plan_id) return;

      // Log failed transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user_id,
          transaction_type: 'purchase_failed',
          amount: paymentIntent.amount / 100, // Stripe amounts are in cents
          credits_amount: 0,
          description: `Failed payment for ${plan_id}`,
          stripe_payment_intent_id: paymentIntent.id,
          status: 'failed'
        });

      console.log(`Payment failed for user ${user_id}, plan ${plan_id}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  private async handleCheckoutCompleted(session: any) {
    try {
      const { user_id, plan_id } = session.metadata;

      if (!user_id || !plan_id) return;

      // Similar logic to handlePaymentSuccess but for checkout sessions
      await this.handlePaymentSuccess({
        id: session.payment_intent,
        metadata: { user_id, plan_id }
      });

    } catch (error) {
      console.error('Error handling checkout completion:', error);
    }
  }
}

export const stripePaymentService = new StripePaymentService();