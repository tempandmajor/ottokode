"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, CreditCard, Zap, AlertTriangle } from 'lucide-react';
import { SubscriptionService } from '@/services/subscription/SubscriptionService';
import { UserSubscription, UserCredits, SubscriptionPlan } from '@/lib/stripe';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function DesktopBillingIntegration() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const [subData, creditsData, plansData] = await Promise.all([
        SubscriptionService.getUserSubscription(session.user.id),
        SubscriptionService.getUserCredits(session.user.id),
        SubscriptionService.getPlans()
      ]);

      setSubscription(subData);
      setCredits(creditsData);
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpgrade = (planName: string) => {
    // Open web app in browser for billing flows
    const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://ottokode.com';
    const url = `${baseUrl}/pricing?plan=${planName}`;

    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      // Desktop app - open in system browser
      try {
        // @ts-ignore - Tauri API may not be available in web build
        import('@tauri-apps/api/shell').then(({ open }: any) => {
          open(url);
        }).catch(() => {
          // Fallback if Tauri API not available
          window.open(url, '_blank');
        });
      } catch {
        window.open(url, '_blank');
      }
    } else {
      // Web app - redirect
      window.location.href = url;
    }
  };

  const handleManageBilling = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 'https://ottokode.com';
    const url = `${baseUrl}/settings/billing`;

    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      // Desktop app - open in system browser
      try {
        // @ts-ignore - Tauri API may not be available in web build
        import('@tauri-apps/api/shell').then(({ open }: any) => {
          open(url);
        }).catch(() => {
          // Fallback if Tauri API not available
          window.open(url, '_blank');
        });
      } catch {
        window.open(url, '_blank');
      }
    } else {
      // Web app - redirect
      window.location.href = url;
    }
  };

  if (loading) {
    return (
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
    );
  }

  const creditUsagePercentage = credits
    ? Math.round((credits.used_credits / credits.total_credits) * 100)
    : 0;

  const currentPlan = subscription?.plan || plans.find(p => p.name === 'free');

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            {subscription
              ? `You&apos;re subscribed to ${currentPlan?.display_name || 'Unknown'}`
              : "You&apos;re on the free plan"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {currentPlan?.display_name || 'Free Plan'}
            </span>
            <Badge variant={subscription ? 'default' : 'secondary'}>
              {subscription?.status || 'Free'}
            </Badge>
          </div>

          {subscription && (
            <div className="text-sm text-muted-foreground">
              Next billing: {new Date(subscription.current_period_end).toLocaleDateString()}
            </div>
          )}

          <div className="flex gap-2">
            {subscription ? (
              <Button onClick={handleManageBilling} variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            ) : (
              <Button onClick={() => handleUpgrade('pro')} size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credits Status */}
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
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      You&apos;re running low on credits.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleUpgrade('pro')}>
                    Add Credits
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No credit information available</p>
              <Button size="sm" className="mt-2" onClick={() => handleUpgrade('pro')}>
                Get Started
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Upgrade Options */}
      {!subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Options</CardTitle>
            <CardDescription>
              Choose a plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plans.filter(p => p.name !== 'free').map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{plan.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    ${plan.credits_per_month} credits monthly
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${plan.price_monthly}/mo</div>
                  <Button size="sm" onClick={() => handleUpgrade(plan.name)}>
                    Select
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}