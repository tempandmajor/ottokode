"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  Code,
  Settings,
  Users,
  Zap,
  HelpCircle,
  ChevronRight,
  MessageCircle,
  Video,
  FileText
} from "lucide-react";
import { useState } from "react";

const helpCategories = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Learn the basics of Ottokode",
    color: "bg-blue-500",
    articles: [
      "Installation Guide",
      "First Project Setup",
      "Interface Overview",
      "Basic Navigation"
    ]
  },
  {
    icon: Code,
    title: "AI Features",
    description: "Maximize AI-powered development",
    color: "bg-ai-primary",
    articles: [
      "AI Code Completion",
      "AI Chat Assistant",
      "Code Review AI",
      "Smart Refactoring"
    ]
  },
  {
    icon: Settings,
    title: "Configuration",
    description: "Customize your IDE experience",
    color: "bg-green-500",
    articles: [
      "Themes & Appearance",
      "Keyboard Shortcuts",
      "Extension Management",
      "Workspace Settings"
    ]
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Work with your team",
    color: "bg-purple-500",
    articles: [
      "Team Workspaces",
      "Real-time Editing",
      "Code Comments",
      "Share Projects"
    ]
  }
];

const popularArticles = [
  "How to set up AI code completion",
  "Troubleshooting installation issues",
  "Keyboard shortcuts reference",
  "Setting up team workspaces",
  "Customizing themes and colors",
  "Using the AI chat assistant"
];

const faqItems = [
  {
    question: "How do I activate AI code completion?",
    answer: "AI code completion is enabled by default. Make sure you're logged in to your Ottokode account and have an active subscription. You can toggle it in Settings > AI Features > Code Completion."
  },
  {
    question: "Why is my IDE running slowly?",
    answer: "Performance issues can be caused by large projects, too many extensions, or insufficient system resources. Try closing unused files, disabling unnecessary extensions, or increasing your system's memory allocation."
  },
  {
    question: "Can I use Ottokode offline?",
    answer: "Basic editing features work offline, but AI-powered features require an internet connection. Your work is automatically saved locally and synced when you reconnect."
  },
  {
    question: "How do I report a bug?",
    answer: "You can report bugs through GitHub Issues, the in-app feedback form, or by contacting our support team. Please include your system information and steps to reproduce the issue."
  },
  {
    question: "Is my code data secure?",
    answer: "Yes, we take security seriously. Your code is encrypted in transit and at rest. We never store your code on our servers unless you explicitly enable cloud sync features."
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription anytime from your account settings. Your plan remains active until the end of your billing period, and you can reactivate anytime."
  }
];

export default function HelpPage() {
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
                Help Center
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to your questions and learn how to get the most out of Ottokode.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <MessageCircle className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get help from our support team
                </p>
                <Button variant="outline" size="sm">
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <Video className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Watch step-by-step guides
                </p>
                <Button variant="outline" size="sm">
                  Watch Now
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comprehensive guides and API docs
                </p>
                <Button variant="outline" size="sm">
                  Read Docs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Help Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {category.articles.map((article, articleIndex) => (
                        <li key={articleIndex} className="flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                          <ChevronRight className="h-3 w-3 mr-2" />
                          {article}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Popular Articles</h2>
            <div className="max-w-3xl mx-auto">
              <div className="grid gap-3">
                {popularArticles.map((article, index) => (
                  <Card key={index} className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <HelpCircle className="h-5 w-5 text-ai-primary mr-3" />
                          <span className="font-medium">{article}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Still Need Help */}
            <div className="mt-16 text-center">
              <Card className="border-ai-primary/20 bg-ai-primary/5">
                <CardContent className="pt-8 pb-8">
                  <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Can't find what you're looking for? Our support team is here to help you
                    get the most out of Ottokode.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button className="bg-ai-primary hover:bg-ai-primary/90">
                      Contact Support
                    </Button>
                    <Button variant="outline">
                      Join Community
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