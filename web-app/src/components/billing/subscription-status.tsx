"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, CreditCard, DollarSign, Zap } from 'lucide-react';
import { SubscriptionService } from '@/services/subscription/SubscriptionService';
import { UserSubscription, UserCredits } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function SubscriptionStatus() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  const loadSubscriptionData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [subData, creditsData] = await Promise.all([
        SubscriptionService.getUserSubscription(session.user.id),
        SubscriptionService.getUserCredits(session.user.id)
      ]);

      setSubscription(subData);
      setCredits(creditsData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_subscription_id) return;

    try {
      const { url, error } = await SubscriptionService.createPortalSession(subscription.stripe_subscription_id);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creditUsagePercentage = credits
    ? Math.round((credits.used_credits / credits.total_credits) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            {subscription
              ? `You&apos;re subscribed to the ${subscription.plan?.display_name || 'Unknown'} plan`
              : "You&apos;re on the free plan"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {subscription?.plan?.display_name || 'Free Plan'}
            </span>
            <Badge variant={subscription ? 'default' : 'secondary'}>
              {subscription?.status || 'Free'}
            </Badge>
          </div>

          {subscription && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  ${subscription.plan?.price_monthly}/month ({subscription.billing_cycle})
                </span>
              </div>

              <Button onClick={handleManageSubscription} variant="outline" className="w-full">
                Manage Subscription
              </Button>
            </>
          )}

          {!subscription && (
            <Button className="w-full" onClick={() => window.location.href = '/pricing'}>
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Credits
          </CardTitle>
          <CardDescription>
            Your monthly AI usage allowance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credits ? (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Used this month</span>
                  <span>{credits.used_credits.toFixed(2)} / {credits.total_credits.toFixed(2)} credits</span>
                </div>
                <Progress value={creditUsagePercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Available</div>
                  <div className="font-medium">${credits.available_credits.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-medium">${credits.total_credits.toFixed(2)}</div>
                </div>
              </div>

              {credits.available_credits < 1 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    You&apos;re running low on credits. Consider upgrading your plan or purchasing additional credits.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No credit information available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}