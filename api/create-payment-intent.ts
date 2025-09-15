import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { price_id, plan_id, user_id } = req.body;

    if (!price_id || !plan_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify user authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user || user.id !== user_id) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    // Get price details from Stripe
    const price = await stripe.prices.retrieve(price_id);

    if (!price.unit_amount) {
      return res.status(400).json({ error: 'Invalid price' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: 'usd',
      metadata: {
        user_id: user_id,
        plan_id: plan_id,
        price_id: price_id
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}