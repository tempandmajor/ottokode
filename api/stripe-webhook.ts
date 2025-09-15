import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

const PAYMENT_PLANS = {
  'starter': { name: 'Starter Plan', credits: 20.00, price: 20.00 },
  'pro': { name: 'Pro Plan', credits: 100.00, price: 100.00 },
  'enterprise': { name: 'Enterprise Plan', credits: 200.00, price: 200.00 },
  'boost': { name: 'Credit Boost', credits: 10.00, price: 10.00 }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature']!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return res.status(400).json({ error: `Webhook signature verification failed` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { user_id, plan_id } = paymentIntent.metadata;

  if (!user_id || !plan_id) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  const plan = PAYMENT_PLANS[plan_id as keyof typeof PAYMENT_PLANS];
  if (!plan) {
    console.error('Invalid plan_id:', plan_id);
    return;
  }

  try {
    // Add credits to user account using stored procedure
    const { error: creditError } = await supabase.rpc('add_user_credits', {
      p_user_id: user_id,
      p_amount: plan.credits
    });

    if (creditError) {
      console.error('Failed to add credits:', creditError);
      return;
    }

    // Log successful transaction
    const { error: transactionError } = await supabase
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

    if (transactionError) {
      console.error('Failed to log transaction:', transactionError);
    }

    console.log(`Successfully processed payment for user ${user_id}, plan ${plan_id}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { user_id, plan_id } = paymentIntent.metadata;

  if (!user_id || !plan_id) return;

  try {
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: user_id,
        transaction_type: 'purchase_failed',
        amount: paymentIntent.amount / 100, // Convert from cents
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status === 'paid' && session.payment_intent) {
    // Fetch the payment intent to get full metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );
    await handlePaymentSuccess(paymentIntent);
  }
}