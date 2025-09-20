"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Download,
  Star,
  Users,
  Palette,
  Code,
  Terminal,
  Globe,
  Zap,
  Shield,
  Heart,
  Filter,
  TrendingUp,
  Package
} from "lucide-react";
import { useState } from "react";

const extensionCategories = [
  { name: "Themes", count: "Planned", icon: Palette },
  { name: "Languages", count: "Planned", icon: Code },
  { name: "Debuggers", count: "Planned", icon: Zap },
  { name: "Formatters", count: "Planned", icon: Terminal },
  { name: "Tools", count: "Planned", icon: Globe },
  { name: "Security", count: "Planned", icon: Shield }
];

const featuredExtensions = [
  {
    name: "AI Code Reviewer",
    description: "Intelligent code review powered by advanced AI models with context-aware suggestions.",
    author: "OttoCore Team",
    version: "2.1.0",
    downloads: "45.2k",
    rating: 4.9,
    reviews: 1240,
    category: "AI Tools",
    featured: true,
    verified: true
  },
  {
    name: "Dark Pro Theme",
    description: "A beautiful dark theme with perfect syntax highlighting for all programming languages.",
    author: "ThemeStudio",
    version: "1.8.3",
    downloads: "892k",
    rating: 4.8,
    reviews: 3480,
    category: "Themes",
    featured: true,
    verified: false
  },
  {
    name: "Python Advanced",
    description: "Enhanced Python support with intelligent debugging, linting, and formatting tools.",
    author: "PythonDev",
    version: "3.2.1",
    downloads: "234k",
    rating: 4.7,
    reviews: 1876,
    category: "Languages",
    featured: true,
    verified: true
  },
  {
    name: "Git Flow Master",
    description: "Advanced Git workflow management with visual branch tracking and merge assistance.",
    author: "GitTools Inc",
    version: "1.5.2",
    downloads: "156k",
    rating: 4.6,
    reviews: 892,
    category: "Tools",
    featured: false,
    verified: true
  },
  {
    name: "REST Client Pro",
    description: "Comprehensive REST API testing and documentation tools integrated into your editor.",
    author: "WebDev Solutions",
    version: "2.0.4",
    downloads: "78k",
    rating: 4.5,
    reviews: 445,
    category: "Tools",
    featured: false,
    verified: false
  },
  {
    name: "Markdown Preview Plus",
    description: "Enhanced markdown editing with live preview, math support, and export options.",
    author: "DocTools",
    version: "1.9.1",
    downloads: "124k",
    rating: 4.4,
    reviews: 678,
    category: "Languages",
    featured: false,
    verified: true
  }
];

const plannedExtensions = [
  "Theme Creator",
  "Language Pack",
  "Git Visualizer",
  "Code Formatter",
  "Project Templates"
];

export default function ExtensionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Themes");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Extensions Marketplace
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Extension support is planned for future releases. Help us build a great ecosystem
              by sharing your ideas and contributing to the development.
            </p>

            {/* Search and Stats */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-8">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 py-3 text-lg"
                />
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  Coming Soon
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Community Driven
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Categories */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {extensionCategories.map((category, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-ai-primary/10 text-ai-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      <div className="flex items-center space-x-2">
                        <category.icon className="h-4 w-4" />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Trending */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Planned
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plannedExtensions.map((name, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-ai-primary font-bold">•</span>
                      <span className="text-muted-foreground">{name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Extension Development */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Extension Development</h2>
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <Package className="h-16 w-16 text-ai-primary mx-auto mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Extensions Coming Soon</h3>
                    <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                      We're building an extensible architecture that will allow developers to create custom themes,
                      language support, debugging tools, and productivity enhancements. Extension support will be
                      available in a future release.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Palette className="h-8 w-8 text-ai-primary mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">Themes</h4>
                        <p className="text-sm text-muted-foreground">Custom color schemes and UI themes</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Code className="h-8 w-8 text-ai-primary mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">Languages</h4>
                        <p className="text-sm text-muted-foreground">Additional language support</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <Zap className="h-8 w-8 text-ai-primary mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">Tools</h4>
                        <p className="text-sm text-muted-foreground">Productivity and workflow tools</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline">
                        Join the Discussion
                      </Button>
                      <Button variant="outline">
                        Follow Development
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Developer Info */}
              <Card className="border-ai-primary/20 bg-ai-primary/5">
                <CardContent className="p-8 text-center">
                  <Code className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-4">Build Your Own Extension</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Create powerful extensions for Ottokode using our comprehensive SDK.
                    Add new features, themes, or integrate with your favorite tools.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="bg-ai-primary hover:bg-ai-primary/90">
                      View Documentation
                    </Button>
                    <Button variant="outline">
                      Extension Template
                    </Button>
                  </div>
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