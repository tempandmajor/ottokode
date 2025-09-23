"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { Check, Star } from "lucide-react";
import { SubscriptionService } from "@/services/subscription/SubscriptionService";
import { SubscriptionPlan } from "@/lib/stripe";
import { createClient } from "@/lib/supabase";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "per month",
    description: "Perfect for trying out Ottokode",
    features: [
      "Complete code editor",
      "Multi-language support",
      "Git integration",
      "$3 AI credits monthly",
      "Cheapest models (Gemini Flash, GPT-5 Nano)",
      "15% markup on additional usage",
      "1 project"
    ],
    buttonText: "Get Started Free",
    popular: false
  },
  {
    name: "Pro",
    price: "$20",
    period: "per month",
    description: "Ideal for professional developers (competitive with Cursor)",
    features: [
      "Everything in Free",
      "$15 AI credits monthly",
      "Mid-tier models (GPT-4o Mini, Claude Haiku)",
      "10% markup on additional usage",
      "Unlimited projects",
      "Priority support",
      "Desktop and web versions"
    ],
    buttonText: "Start Free Trial",
    popular: true
  },
  {
    name: "Team",
    price: "$99",
    period: "per month",
    description: "For teams that need collaboration features",
    features: [
      "Everything in Pro",
      "$75 AI credits monthly",
      "All models (GPT-5, Claude Sonnet, Claude Opus)",
      "8% markup on additional usage",
      "5 team members",
      "Team collaboration",
      "Shared workspaces",
      "Dedicated support"
    ],
    buttonText: "Start Free Trial",
    popular: false
  }
];

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  const loadPlans = useCallback(async () => {
    try {
      const plansData = await SubscriptionService.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  }, [supabase.auth]);

  useEffect(() => {
    loadPlans();
    checkUser();
  }, [loadPlans, checkUser]);

  const getPlanButton = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') {
      return (
        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth'}>
          Get Started Free
        </Button>
      );
    }

    if (!user) {
      return (
        <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth'}>
          Sign In to Subscribe
        </Button>
      );
    }

    if (!plan.stripe_price_id_monthly) {
      return (
        <Button variant="outline" className="w-full" disabled>
          Enterprise Plan
        </Button>
      );
    }

    return (
      <CheckoutButton
        priceId={plan.stripe_price_id_monthly}
        variant={plan.name === 'pro' ? 'default' : 'outline'}
        className="w-full"
      >
        Start Free Trial
      </CheckoutButton>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Choose the Right Plan for Your{" "}
              <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Development Journey
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your development needs. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="relative border-border">
                  <CardHeader className="text-center">
                    <div className="h-6 bg-muted animate-pulse rounded mb-4" />
                    <div className="h-12 bg-muted animate-pulse rounded mb-4" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-4 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              plans.map((plan, index) => {
                const isPopular = plan.name === 'pro';
                return (
                  <Card
                    key={plan.id}
                    className={`relative ${isPopular ? 'border-ai-primary shadow-lg scale-105' : 'border-border'}`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-ai-primary text-ai-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader className="text-center">
                      <CardTitle className="text-2xl font-bold">{plan.display_name}</CardTitle>
                      <div className="py-4">
                        <span className="text-4xl font-bold">
                          ${plan.price_monthly}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {getPlanButton(plan)}

                      <ul className="space-y-3 text-sm">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-3">
                            <Check className="h-4 w-4 text-ai-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Can I try before I buy?</h3>
                <p className="text-muted-foreground">
                  Yes! All plans include a 14-day free trial. You can explore all features before committing to a subscription.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards and PayPal. Enterprise customers can also pay via invoice.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">What platforms are supported?</h3>
                <p className="text-muted-foreground">
                  Currently focusing on macOS desktop with a web version available. Windows and Linux support may be added in the future.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Is my code secure?</h3>
                <p className="text-muted-foreground">
                  Yes, your code stays on your machine. AI features only send code to your configured providers when you explicitly use them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}