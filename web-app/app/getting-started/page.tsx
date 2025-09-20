"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, User, Zap, Settings, Code, ChevronRight } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export default function GettingStartedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-16 px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              Get Started with Ottokode
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start building with AI-powered development in minutes. Choose your path below.
          </p>
        </div>

        {/* Quick Start Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Download Desktop App */}
          <Card className="border-2 border-ai-primary/20 hover:border-ai-primary/40 transition-colors">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-ai-primary/10 rounded-full flex items-center justify-center">
                <Download className="h-8 w-8 text-ai-primary" />
              </div>
              <CardTitle className="text-2xl">Desktop App</CardTitle>
              <CardDescription>
                Full-featured IDE with offline capabilities and native performance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <a href="/#download">
                <Button size="lg" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download for Desktop
                </Button>
              </a>
              <p className="text-sm text-muted-foreground">
                Available for macOS, Windows, and Linux
              </p>
            </CardContent>
          </Card>

          {/* Web App */}
          <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                <Code className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Web App</CardTitle>
              <CardDescription>
                Browser-based coding with instant access and cloud sync
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <Link href="/ide">
                <Button size="lg" variant="secondary" className="w-full">
                  <Code className="h-4 w-4 mr-2" />
                  Launch Web IDE
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">
                No installation required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Account Section */}
        <Card className="mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-xl flex items-center justify-center">
              <User className="h-5 w-5 mr-2" />
              {user ? "Account Connected" : "Create Your Account"}
            </CardTitle>
            <CardDescription>
              {user
                ? "You're signed in and ready to use AI features"
                : "Sign up to unlock AI-powered coding features and cloud sync"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {!user ? (
              <div className="space-y-3">
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full max-w-md">
                    Sign In / Sign Up
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  Free tier includes basic AI features
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center text-green-600">
                  <span className="text-sm font-medium">✓ Connected as {user.email}</span>
                </div>
                <Link href="/settings/ai">
                  <Button size="lg" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure AI Settings
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div>
          <h2 className="text-2xl font-bold text-center mb-8">What&apos;s Next?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Zap className="h-6 w-6 text-ai-primary" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">AI Features</h3>
                <p className="text-sm text-muted-foreground">
                  Learn about code completion, refactoring, and chat assistance
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <Settings className="h-6 w-6 text-secondary" />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Customize themes, shortcuts, and AI model preferences
                </p>
              </CardContent>
            </Card>

            <Link href="/help">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Code className="h-6 w-6 text-muted-foreground" />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive guides and tutorials
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
