"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  BookOpen,
  Code,
  Settings,
  Users,
  Zap,
  ArrowRight,
  ExternalLink,
  Star,
  Clock
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const docCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of Ottokode",
    icon: BookOpen,
    color: "bg-blue-500",
    docs: [
      { title: "Installation Guide", time: "5 min read", popular: true },
      { title: "First Project Setup", time: "10 min read", popular: true },
      { title: "Interface Overview", time: "8 min read", popular: false },
      { title: "Basic Navigation", time: "5 min read", popular: false }
    ]
  },
  {
    title: "AI Features",
    description: "Master AI-powered development",
    icon: Zap,
    color: "bg-ai-primary",
    docs: [
      { title: "AI Code Completion", time: "12 min read", popular: true },
      { title: "AI Chat Assistant", time: "8 min read", popular: true },
      { title: "Code Review AI", time: "15 min read", popular: false },
      { title: "Smart Refactoring", time: "10 min read", popular: false }
    ]
  },
  {
    title: "Configuration",
    description: "Customize your IDE experience",
    icon: Settings,
    color: "bg-green-500",
    docs: [
      { title: "Themes & Appearance", time: "6 min read", popular: false },
      { title: "Keyboard Shortcuts", time: "7 min read", popular: true },
      { title: "Extension Management", time: "9 min read", popular: false },
      { title: "Workspace Settings", time: "11 min read", popular: false }
    ]
  },
  {
    title: "Collaboration",
    description: "Work effectively with teams",
    icon: Users,
    color: "bg-purple-500",
    docs: [
      { title: "Team Workspaces", time: "10 min read", popular: true },
      { title: "Real-time Editing", time: "8 min read", popular: false },
      { title: "Code Comments", time: "5 min read", popular: false },
      { title: "Share Projects", time: "6 min read", popular: false }
    ]
  }
];

const quickLinks = [
  { title: "API Reference", href: "/docs/api", icon: Code },
  { title: "Extensions Guide", href: "/extensions", icon: Settings },
  { title: "Troubleshooting", href: "/help", icon: BookOpen },
  { title: "Community Forum", href: "/community", icon: Users }
];

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Documentation
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Everything you need to know about Ottokode. From basic setup to advanced AI features,
              find comprehensive guides and references to help you build amazing software.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <link.icon className="h-8 w-8 text-ai-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-sm">{link.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Documentation Categories */}
          <div className="grid lg:grid-cols-2 gap-8">
            {docCategories.map((category, index) => (
              <Card key={index} className="border-border">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.docs.map((doc, docIndex) => (
                    <div
                      key={docIndex}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium group-hover:text-ai-primary transition-colors">
                              {doc.title}
                            </span>
                            {doc.popular && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {doc.time}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-ai-primary transition-colors" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Resources */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-8">Need More Help?</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Community Forum</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join thousands of developers in our community
                  </p>
                  <Link href="/community">
                    <Button variant="outline" size="sm">
                      Join Community
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <ExternalLink className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">GitHub</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Contribute to the project or report issues
                  </p>
                  <a href="https://github.com/tempandmajor/ottokode" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      View on GitHub
                    </Button>
                  </a>
                </CardContent>
              </Card>

              <Card className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get direct help from our support team
                  </p>
                  <Link href="/support">
                    <Button variant="outline" size="sm">
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}