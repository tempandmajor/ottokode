"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star } from "lucide-react";

const pricingPlans = [
  {
    name: "Starter",
    price: "$9",
    period: "per month",
    description: "Perfect for individual developers getting started",
    features: [
      "Complete code editor",
      "Multi-language support",
      "Git integration",
      "Basic AI assistance (limited)",
      "File management",
      "Syntax highlighting",
      "Community support"
    ],
    buttonText: "Start Free Trial",
    popular: false
  },
  {
    name: "Professional",
    price: "$29",
    period: "per month",
    description: "Ideal for professional developers and freelancers",
    features: [
      "Everything in Starter",
      "Unlimited AI assistance",
      "Advanced code completion",
      "Priority support",
      "Theme customization",
      "Desktop and web versions",
      "Advanced debugging tools"
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
      "Everything in Professional",
      "Team collaboration",
      "Shared workspaces",
      "Team analytics",
      "Admin controls",
      "SSO integration",
      "Dedicated support"
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
              Choose the plan that fits your development needs. All plans include a 14-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
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