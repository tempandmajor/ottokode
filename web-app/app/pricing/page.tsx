"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for individual developers and personal projects",
    features: [
      "Basic AI code completion",
      "Up to 3 projects",
      "Standard themes",
      "Community support",
      "Basic git integration",
      "Limited AI queries (100/month)"
    ],
    buttonText: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "Ideal for professional developers and small teams",
    features: [
      "Advanced AI code completion",
      "Unlimited projects",
      "Premium themes & customization",
      "Priority support",
      "Advanced git features",
      "Unlimited AI queries",
      "Code review assistance",
      "Custom extensions",
      "Team collaboration (up to 5 members)"
    ],
    buttonText: "Start Pro Trial",
    popular: true
  },
  {
    name: "Team",
    price: "$49",
    period: "per month",
    description: "For growing teams that need advanced collaboration",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "Advanced collaboration tools",
      "Team analytics & insights",
      "SSO integration",
      "Custom integrations",
      "Dedicated support",
      "Up to 20 team members",
      "Advanced security features"
    ],
    buttonText: "Contact Sales",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For large organizations with specific requirements",
    features: [
      "Everything in Team",
      "Unlimited team members",
      "On-premise deployment",
      "Custom AI models",
      "Advanced security & compliance",
      "24/7 dedicated support",
      "Custom training & onboarding",
      "Service level agreements",
      "API access & white-labeling"
    ],
    buttonText: "Contact Sales",
    popular: false
  }
];

export default function PricingPage() {
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
              From individual developers to large enterprises, we have a plan that scales with your needs.
              Start free and upgrade as you grow.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-4 gap-8 mb-16">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-ai-primary shadow-lg scale-105' : 'border-border'}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-ai-primary text-ai-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="py-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period !== "pricing" && (
                      <span className="text-muted-foreground">/{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <Button
                    className={`w-full ${plan.popular ? 'bg-ai-primary hover:bg-ai-primary/90' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.buttonText}
                  </Button>

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
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Can I change plans anytime?</h3>
                <p className="text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately,
                  and billing is prorated accordingly.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Is there a free trial for paid plans?</h3>
                <p className="text-muted-foreground">
                  Yes, all paid plans come with a 14-day free trial. No credit card required to start your trial.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
                  Enterprise customers can also pay via bank transfer.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time with no cancellation fees.
                  Your plan remains active until the end of your billing period.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Do you offer educational discounts?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer special pricing for students and educational institutions.
                  Contact our sales team for more information about educational discounts.
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