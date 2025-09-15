"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  FileText,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Book,
  Video,
  Github
} from "lucide-react";

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: ""
  });

  const supportCategories = [
    {
      icon: HelpCircle,
      title: "Getting Started",
      description: "Setup guides and basic tutorials",
      articles: 24,
      color: "text-blue-500"
    },
    {
      icon: MessageSquare,
      title: "IDE Features",
      description: "Learn about editor capabilities",
      articles: 18,
      color: "text-green-500"
    },
    {
      icon: FileText,
      title: "AI Assistant",
      description: "AI code completion and chat",
      articles: 12,
      color: "text-purple-500"
    },
    {
      icon: Mail,
      title: "Account & Billing",
      description: "Subscription and payment help",
      articles: 15,
      color: "text-orange-500"
    }
  ];

  const faqs = [
    {
      question: "How do I get started with Ottokode?",
      answer: "Simply create a free account and start using our web IDE immediately. No installation required! For the desktop version, download the app from our homepage and follow the setup wizard."
    },
    {
      question: "What programming languages are supported?",
      answer: "We support 50+ programming languages including JavaScript, TypeScript, Python, Java, C++, Go, Rust, and more. Our AI assistant provides intelligent suggestions for all supported languages."
    },
    {
      question: "How does the AI code completion work?",
      answer: "Our AI models analyze your code context, comments, and patterns to provide intelligent suggestions. The more you use it, the better it becomes at understanding your coding style and preferences."
    },
    {
      question: "Can I use Ottokode offline?",
      answer: "The desktop version works offline for basic editing, but AI features require an internet connection. We're working on offline AI capabilities for future releases."
    },
    {
      question: "Is my code data secure and private?",
      answer: "Yes! We use end-to-end encryption for your code. AI training only uses anonymized, aggregated patterns - never your actual code. Enterprise customers get additional privacy controls."
    },
    {
      question: "How do I collaborate with my team?",
      answer: "Create an organization account to invite team members. You can share projects, collaborate in real-time, and manage permissions. See our Team Collaboration guide for details."
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes access to the web IDE, basic AI suggestions (limited), file management, and community support. Upgrade for unlimited AI usage and advanced features."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from your account settings. Your subscription remains active until the end of the billing period, and you can download your data before it expires."
    }
  ];

  const statusUpdates = [
    {
      status: "operational",
      service: "Web IDE",
      lastUpdate: "2 hours ago"
    },
    {
      status: "operational",
      service: "AI Assistant",
      lastUpdate: "1 hour ago"
    },
    {
      status: "maintenance",
      service: "Desktop Sync",
      lastUpdate: "30 minutes ago"
    },
    {
      status: "operational",
      service: "Authentication",
      lastUpdate: "3 hours ago"
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Contact form submitted:", contactForm);
    // Reset form or show success message
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "maintenance":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "issue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            Support Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get help, find answers, and learn how to make the most of Ottokode
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search for help articles, guides, and FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-3 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-ai-primary/20 hover:border-ai-primary/40 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Book className="h-12 w-12 text-ai-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Documentation</h3>
              <p className="text-muted-foreground text-sm">
                Comprehensive guides and API references
              </p>
            </CardContent>
          </Card>

          <Card className="border-ai-secondary/20 hover:border-ai-secondary/40 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Video className="h-12 w-12 text-ai-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Video Tutorials</h3>
              <p className="text-muted-foreground text-sm">
                Step-by-step video guides and demos
              </p>
            </CardContent>
          </Card>

          <Card className="border-ai-glow/20 hover:border-ai-glow/40 transition-colors cursor-pointer">
            <CardContent className="p-6 text-center">
              <Github className="h-12 w-12 text-ai-glow mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Community</h3>
              <p className="text-muted-foreground text-sm">
                Join discussions and get help from other developers
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Help Categories */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Browse by Category</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {supportCategories.map((category, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <category.icon className={`h-8 w-8 ${category.color} flex-shrink-0`} />
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3">{category.description}</p>
                          <Badge variant="secondary">{category.articles} articles</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Contact Form */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Contact Support</h2>
              <Card>
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <p className="text-muted-foreground">
                    Can&apos;t find what you&apos;re looking for? We&apos;re here to help!
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => setContactForm({ ...contactForm, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing & Account</SelectItem>
                          <SelectItem value="feature">Feature Request</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="general">General Question</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="Please provide as much detail as possible..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" className="bg-ai-primary hover:bg-ai-primary/90">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Service Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Service Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statusUpdates.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm">{item.service}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.lastUpdate}</span>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View Status Page
                </Button>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Getting Started Guide
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  API Documentation
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub Repository
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Video Tutorials
                </Button>
              </CardContent>
            </Card>

            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">General Inquiries</span>
                  <span className="text-sm font-medium">24 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Technical Issues</span>
                  <span className="text-sm font-medium">4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Billing Issues</span>
                  <span className="text-sm font-medium">2-4 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Enterprise</span>
                  <span className="text-sm font-medium">1 hour</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}