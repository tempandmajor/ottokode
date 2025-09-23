'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CreditCard,
  Download,
  Calendar,
  TrendingUp,
  AlertCircle,
  Check,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Users,
  HardDrive,
  Shield
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/auth/user-menu';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/components/theme-provider';

// Mock billing data - in real app, this would come from Stripe/payment provider
const MOCK_BILLING_DATA = {
  currentPlan: {
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: [
      '5,000 AI requests per month',
      '10 GB cloud storage',
      'Unlimited local projects',
      '10 team collaborators',
      'Priority support',
      'Advanced AI models'
    ]
  },
  usage: {
    aiRequests: { used: 1247, limit: 5000 },
    storage: { used: 2.3, limit: 10, unit: 'GB' },
    collaborators: { used: 3, limit: 10 }
  },
  billingHistory: [
    { date: '2024-12-15', amount: 29, status: 'paid', invoice: 'INV-2024-12-001' },
    { date: '2024-11-15', amount: 29, status: 'paid', invoice: 'INV-2024-11-001' },
    { date: '2024-10-15', amount: 29, status: 'paid', invoice: 'INV-2024-10-001' }
  ],
  nextBilling: '2025-01-15',
  paymentMethod: {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: 12,
    expiryYear: 2027
  }
};

const AVAILABLE_PLANS = [
  {
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Perfect for trying out Ottokode',
    features: [
      '100 AI requests per month',
      '1 GB cloud storage',
      'Unlimited local projects',
      'Community support',
      'Basic AI models'
    ],
    limitations: ['Limited AI usage', 'Basic support'],
    popular: false
  },
  {
    name: 'Pro',
    price: 29,
    interval: 'month',
    description: 'Best for individual developers',
    features: [
      '5,000 AI requests per month',
      '10 GB cloud storage',
      'Unlimited local projects',
      '10 team collaborators',
      'Priority support',
      'Advanced AI models',
      'Custom templates'
    ],
    limitations: [],
    popular: true
  },
  {
    name: 'Team',
    price: 89,
    interval: 'month',
    description: 'Perfect for development teams',
    features: [
      '20,000 AI requests per month',
      '100 GB cloud storage',
      'Unlimited local projects',
      'Unlimited team collaborators',
      'Priority support',
      'Advanced AI models',
      'Custom templates',
      'Team analytics',
      'SSO integration'
    ],
    limitations: [],
    popular: false
  }
];

export default function BillingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [billingData] = useState(MOCK_BILLING_DATA);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const aiUsagePercent = (billingData.usage.aiRequests.used / billingData.usage.aiRequests.limit) * 100;
  const storagePercent = (billingData.usage.storage.used / billingData.usage.storage.limit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
                  alt="Ottokode"
                  width={40}
                  height={40}
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                  Ottokode
                </span>
              </Link>
              <Badge variant="outline" className="border-ai-primary/20">
                Billing & Usage
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">
                  Back to Dashboard
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
          <p className="text-muted-foreground">
            Manage your subscription, view usage analytics, and billing history.
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-ai-primary" />
                    <span>Current Plan</span>
                  </div>
                  <Badge className="bg-ai-primary">{billingData.currentPlan.name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">${billingData.currentPlan.price}</p>
                    <p className="text-sm text-muted-foreground">per {billingData.currentPlan.interval}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Next billing</p>
                    <p className="text-sm text-muted-foreground">{billingData.nextBilling}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Plan Features</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {billingData.currentPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Manage Payment Method</Button>
                </div>
              </CardContent>
            </Card>

            {/* Usage Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>AI Requests</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This month</span>
                      <span>{billingData.usage.aiRequests.used.toLocaleString()} / {billingData.usage.aiRequests.limit.toLocaleString()}</span>
                    </div>
                    <Progress value={aiUsagePercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(aiUsagePercent)}% used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <HardDrive className="h-4 w-4 text-green-600" />
                    <span>Storage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{billingData.usage.storage.used} / {billingData.usage.storage.limit} {billingData.usage.storage.unit}</span>
                    </div>
                    <Progress value={storagePercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(storagePercent)}% used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Collaborators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active</span>
                      <span>{billingData.usage.collaborators.used} / {billingData.usage.collaborators.limit}</span>
                    </div>
                    <Progress value={(billingData.usage.collaborators.used / billingData.usage.collaborators.limit) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {billingData.usage.collaborators.limit - billingData.usage.collaborators.used} slots available
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {billingData.paymentMethod.brand} ending in {billingData.paymentMethod.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expires {billingData.paymentMethod.expiryMonth}/{billingData.paymentMethod.expiryYear}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Usage Analytics</CardTitle>
                <CardDescription>
                  Track your usage patterns and optimize your plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Usage Chart Placeholder */}
                <div className="space-y-4">
                  <h4 className="font-medium">AI Requests (Last 30 Days)</h4>
                  <div className="h-64 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/25 flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Usage chart would go here</p>
                      <p className="text-xs text-muted-foreground">Analytics data will be available when usage tracking is enabled</p>
                    </div>
                  </div>
                </div>

                {/* Usage Breakdown */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">This Month&apos;s Breakdown</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Code completions</span>
                        <span className="text-sm font-medium">847 requests</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Code explanations</span>
                        <span className="text-sm font-medium">234 requests</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm">Bug fixes</span>
                        <span className="text-sm font-medium">166 requests</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Usage Recommendations</h4>
                    <div className="space-y-3">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You&apos;re using {Math.round(aiUsagePercent)}% of your AI quota. Consider upgrading if you need more requests.
                        </AlertDescription>
                      </Alert>
                      {storagePercent > 80 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Storage is {Math.round(storagePercent)}% full. Consider cleaning up old projects.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
                <p className="text-muted-foreground">
                  Select the plan that best fits your development needs
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {AVAILABLE_PLANS.map((plan) => (
                  <Card key={plan.name} className={`relative ${plan.popular ? 'ring-2 ring-ai-primary/20' : ''}`}>
                    {plan.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ai-primary">
                        Most Popular
                      </Badge>
                    )}

                    <CardHeader>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="space-y-1">
                        <div className="text-3xl font-bold">
                          ${plan.price}
                          <span className="text-base font-normal text-muted-foreground">
                            /{plan.interval}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {plan.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <span>{limitation}</span>
                          </div>
                        ))}
                      </div>

                      <Button
                        className={`w-full ${plan.name === billingData.currentPlan.name ? 'bg-muted text-muted-foreground' : 'bg-ai-primary hover:bg-ai-primary/90'}`}
                        disabled={plan.name === billingData.currentPlan.name}
                      >
                        {plan.name === billingData.currentPlan.name ? 'Current Plan' : `Upgrade to ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {billingData.billingHistory.map((bill, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{bill.invoice}</p>
                          <p className="text-sm text-muted-foreground">{bill.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">${bill.amount}</p>
                          <Badge variant={bill.status === 'paid' ? 'default' : 'destructive'} className="text-xs">
                            {bill.status}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}