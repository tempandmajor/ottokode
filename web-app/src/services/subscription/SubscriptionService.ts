import { createClient } from '@/lib/supabase';
import { SubscriptionPlan, UserSubscription, UserCredits } from '@/lib/stripe';

export class SubscriptionService {
  private static supabase = createClient();

  static async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      console.error('Error fetching plans:', error);
      return [];
    }

    return data || [];
  }

  static async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    return data;
  }

  static async getUserCredits(userId: string): Promise<UserCredits | null> {
    const { data, error } = await this.supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user credits:', error);
      return null;
    }

    return data;
  }

  static async createCheckoutSession(priceId: string, userId: string): Promise<{ url: string | null; error?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: `${window.location.origin}/settings/billing?success=true`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { url: null, error: data.error || 'Failed to create checkout session' };
      }

      return { url: data.url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { url: null, error: 'Network error' };
    }
  }

  static async createPortalSession(customerId: string): Promise<{ url: string | null; error?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await this.supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          customerId,
          returnUrl: `${window.location.origin}/settings/billing`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { url: null, error: data.error || 'Failed to create portal session' };
      }

      return { url: data.url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      return { url: null, error: 'Network error' };
    }
  }

  static async deductCredits(userId: string, amount: number, description: string, metadata?: any): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_description: description,
        p_metadata: metadata || {}
      });

      return !error;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  }

  static async addCredits(userId: string, amount: number, description: string, transactionId?: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'purchase',
          amount: amount,
          credits_amount: amount,
          description,
          stripe_payment_intent_id: transactionId
        });

      return !error;
    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  }
}