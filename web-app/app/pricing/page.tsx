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
    description: "Full-featured development environment for everyone",
    features: [
      "Complete code editor",
      "Multi-language support",
      "Git integration",
      "Chat interface for AI assistance",
      "File management",
      "Syntax highlighting",
      "Theme customization",
      "Desktop and web versions"
    ],
    buttonText: "Download Now",
    popular: true
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
              Ottokode is completely free and open source. No subscriptions, no limits, no hidden costs.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center mb-16">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className="relative border-ai-primary shadow-lg max-w-md"
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
                <h3 className="text-lg font-semibold mb-2">Is Ottokode really free?</h3>
                <p className="text-muted-foreground">
                  Yes, Ottokode is completely free and open source. There are no hidden costs, subscriptions, or premium features.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">How do you make money if it's free?</h3>
                <p className="text-muted-foreground">
                  Ottokode is a passion project focused on providing great developer tools. We may explore optional paid services in the future.
                </p>
              </div>

              <div className="border-b border-border pb-6">
                <h3 className="text-lg font-semibold mb-2">Can I use my own AI providers?</h3>
                <p className="text-muted-foreground">
                  Yes! You can configure your own AI providers (OpenAI, Anthropic, Google) in the settings to enable AI-powered features.
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