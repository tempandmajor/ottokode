'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Download,
  CreditCard,
  TrendingUp,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  Calendar,
  Activity,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { UserMenu } from '@/components/auth/user-menu';
import { isFeatureEnabled } from '@/lib/feature-flags';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from '@/components/theme-provider';

// Mock data - in real app, this would come from APIs
const MOCK_USAGE_DATA = {
  currentPlan: 'Pro',
  billingPeriod: 'Monthly',
  nextBilling: '2025-01-15',
  usageThisMonth: {
    aiRequests: 1247,
    aiRequestsLimit: 5000,
    storageUsed: 2.3, // GB
    storageLimit: 10, // GB
    collaborators: 3,
    collaboratorsLimit: 10
  },
  recentActivity: [
    { type: 'ai_usage', description: 'Code completion in React project', timestamp: '2 hours ago' },
    { type: 'billing', description: 'Monthly subscription renewed', timestamp: '3 days ago' },
    { type: 'collaboration', description: 'Invited team member to Project Alpha', timestamp: '1 week ago' },
    { type: 'settings', description: 'Updated AI model preferences', timestamp: '1 week ago' }
  ]
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const [usageData] = useState(MOCK_USAGE_DATA);

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
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const aiUsagePercent = (usageData.usageThisMonth.aiRequests / usageData.usageThisMonth.aiRequestsLimit) * 100;
  const storagePercent = (usageData.usageThisMonth.storageUsed / usageData.usageThisMonth.storageLimit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
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
                Information Platform
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/download">
                  <Download className="h-4 w-4 mr-2" />
                  Download Desktop
                </Link>
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.user_metadata?.name || user.email?.split('@')[0] || 'Developer'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Manage your Ottokode experience from your information dashboard.
          </p>
        </div>

        {/* Migration Notice */}
        {!isFeatureEnabled('WEB_IDE') && (
          <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Platform Update: Desktop-First Development</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                We&apos;ve streamlined our platform! All coding features are now available exclusively in our desktop application
                for enhanced performance and capabilities.
              </p>
              <Button asChild size="sm" className="mt-2">
                <Link href="/download">
                  Download Desktop App
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-ai-primary/10 rounded-lg">
                    <Download className="h-5 w-5 text-ai-primary" />
                  </div>
                  <CardTitle className="text-lg">Desktop App</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Access the full IDE experience with AI assistance
                </p>
                <Button asChild className="w-full">
                  <Link href="/download">
                    Download Now
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Billing</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Manage your subscription and view usage
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/billing">
                    View Billing
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Documentation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Learn how to use Ottokode effectively
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/docs">
                    Read Docs
                    <BookOpen className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Current Plan */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="h-5 w-5 text-ai-primary" />
                      <span>Current Plan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="default" className="bg-ai-primary">
                        {usageData.currentPlan}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {usageData.billingPeriod}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Next billing: </span>
                        <span className="font-medium">{usageData.nextBilling}</span>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/billing">Manage Subscription</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="h-5 w-5 text-purple-600" />
                      <span>AI Usage</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>This month</span>
                        <span>{usageData.usageThisMonth.aiRequests.toLocaleString()} / {usageData.usageThisMonth.aiRequestsLimit.toLocaleString()}</span>
                      </div>
                      <Progress value={aiUsagePercent} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(aiUsagePercent)}% of monthly quota used
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <span>Storage</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span>{usageData.usageThisMonth.storageUsed} GB / {usageData.usageThisMonth.storageLimit} GB</span>
                      </div>
                      <Progress value={storagePercent} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(storagePercent)}% of storage used
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    Track your Ottokode usage across different features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">AI Requests</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>This month</span>
                          <span className="font-medium">{usageData.usageThisMonth.aiRequests.toLocaleString()}</span>
                        </div>
                        <Progress value={aiUsagePercent} />
                        <p className="text-xs text-muted-foreground">
                          {usageData.usageThisMonth.aiRequestsLimit - usageData.usageThisMonth.aiRequests} requests remaining
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Team Collaboration</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Active collaborators</span>
                          <span className="font-medium">{usageData.usageThisMonth.collaborators} / {usageData.usageThisMonth.collaboratorsLimit}</span>
                        </div>
                        <Progress value={(usageData.usageThisMonth.collaborators / usageData.usageThisMonth.collaboratorsLimit) * 100} />
                        <p className="text-xs text-muted-foreground">
                          {usageData.usageThisMonth.collaboratorsLimit - usageData.usageThisMonth.collaborators} slots available
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your recent actions and system updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {usageData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                        <div className="p-2 bg-muted rounded-lg">
                          {activity.type === 'ai_usage' && <Sparkles className="h-4 w-4" />}
                          {activity.type === 'billing' && <CreditCard className="h-4 w-4" />}
                          {activity.type === 'collaboration' && <Users className="h-4 w-4" />}
                          {activity.type === 'settings' && <Settings className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your profile and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/settings/profile">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/settings/ai">
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Preferences
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/settings/notifications">
                        <Calendar className="h-4 w-4 mr-2" />
                        Notifications
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resources</CardTitle>
                    <CardDescription>
                      Get help and connect with the community
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/docs">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Documentation
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/community">
                        <Users className="h-4 w-4 mr-2" />
                        Community
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href="/support">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get Support
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}