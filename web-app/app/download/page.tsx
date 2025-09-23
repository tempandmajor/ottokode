'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Download,
  Apple,
  Monitor,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Info,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { isFeatureEnabled } from '@/lib/feature-flags';

const DESKTOP_RELEASES = [
  {
    platform: 'macOS',
    icon: Apple,
    version: '1.0.0',
    size: '120 MB',
    downloadUrl: '#',
    requirements: 'macOS 10.15 or later',
    featured: true
  },
  {
    platform: 'Windows',
    icon: Monitor,
    version: '1.0.0',
    size: '95 MB',
    downloadUrl: '#',
    requirements: 'Windows 10 or later',
    featured: true
  },
  {
    platform: 'Linux',
    icon: Monitor,
    version: '1.0.0',
    size: '110 MB',
    downloadUrl: '#',
    requirements: 'Ubuntu 18.04, Debian 9, or equivalent',
    featured: false
  }
];

const FEATURES = [
  'AI-powered code completion and assistance',
  'Integrated terminal and package management',
  'Git integration with visual diff tools',
  'Extensible plugin system',
  'Project templates and scaffolding',
  'Real-time collaboration features',
  'Secure local development environment'
];

function DownloadContent() {
  const searchParams = useSearchParams();
  const [showMigrationNotice, setShowMigrationNotice] = useState(false);

  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'web-ide-disabled') {
      setShowMigrationNotice(true);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 py-12">
        {/* Migration Notice */}
        {showMigrationNotice && (
          <Alert className="mb-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
            <Info className="h-4 w-4" />
            <AlertTitle>Platform Update Notice</AlertTitle>
            <AlertDescription>
              We&apos;ve streamlined our platform! The web IDE has been moved to focus on providing
              you with a more powerful desktop experience. All coding features are now available
              exclusively in our desktop application.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-ai-primary/10 border border-ai-primary/20 rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-ai-primary" />
            <span className="text-sm font-medium text-ai-primary">Desktop First Development</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent mb-6">
            Download Ottokode
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get the full-featured desktop IDE with AI assistance, powerful tools, and seamless development experience.
          </p>

          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Free to use</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cross-platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Regular updates</span>
            </div>
          </div>
        </div>

        {/* Download Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {DESKTOP_RELEASES.map((release) => {
            const IconComponent = release.icon;
            return (
              <Card key={release.platform} className={`relative transition-all hover:shadow-lg ${
                release.featured ? 'ring-2 ring-ai-primary/20' : ''
              }`}>
                {release.featured && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ai-primary">
                    Recommended
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-ai-primary/10 rounded-xl">
                      <IconComponent className="h-8 w-8 text-ai-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{release.platform}</CardTitle>
                  <CardDescription>
                    Version {release.version} • {release.size}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {release.requirements}
                  </p>

                  <Button
                    className="w-full bg-ai-primary hover:bg-ai-primary/90"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download for {release.platform}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Why Choose Ottokode Desktop?
            </CardTitle>
            <CardDescription className="text-center">
              Everything you need for modern development, powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-ai-primary flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Information Platform CTA */}
        <Card className="bg-gradient-to-r from-ai-primary/5 to-ai-secondary/5 border-ai-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-semibold mb-4">
              Manage Your Account Online
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              While you code on desktop, use our web platform to manage your subscription,
              view usage analytics, access documentation, and connect with the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">
                  View Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/docs">
                  Read Documentation
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Release Notes */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Looking for release notes and changelog?{' '}
            <Link href="/changelog" className="text-ai-primary hover:underline">
              View latest updates
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <DownloadContent />
    </Suspense>
  );
}