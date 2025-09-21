"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { SubscriptionService } from '@/services/subscription/SubscriptionService';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  priceId: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  className?: string;
}

export function CheckoutButton({ priceId, children, variant = 'default', className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to a plan.",
          variant: "destructive"
        });
        return;
      }

      // Create checkout session
      const { url, error } = await SubscriptionService.createCheckoutSession(priceId, session.user.id);

      if (error) {
        toast({
          title: "Checkout failed",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      variant={variant}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : children}
    </Button>
  );
}