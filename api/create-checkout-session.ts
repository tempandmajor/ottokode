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
    const { price_id, plan_id, user_id, success_url, cancel_url } = req.body;

    if (!price_id || !plan_id || !user_id || !success_url || !cancel_url) {
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

    // Get user email for checkout
    const userEmail = user.email;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: userEmail,
      metadata: {
        user_id: user_id,
        plan_id: plan_id,
        price_id: price_id
      },
      payment_intent_data: {
        metadata: {
          user_id: user_id,
          plan_id: plan_id,
          price_id: price_id
        }
      }
    });

    res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}