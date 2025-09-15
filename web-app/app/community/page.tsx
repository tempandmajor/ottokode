"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  MessageSquare,
  Github,
  Twitter,
  Calendar,
  Trophy,
  Heart,
  ExternalLink,
  Code,
  BookOpen,
  Lightbulb,
  Star
} from "lucide-react";

const communityStats = [
  { label: "Active Developers", value: "12,500+", icon: Users },
  { label: "GitHub Stars", value: "8,200+", icon: Star },
  { label: "Discord Members", value: "5,800+", icon: MessageSquare },
  { label: "Extensions Created", value: "340+", icon: Code }
];

const communityPlatforms = [
  {
    name: "Discord Server",
    description: "Join our active Discord community for real-time discussions, help, and collaboration.",
    icon: MessageSquare,
    members: "5,800+ members",
    link: "#",
    color: "bg-indigo-500"
  },
  {
    name: "GitHub Discussions",
    description: "Share ideas, ask questions, and contribute to the development of Ottokode.",
    icon: Github,
    members: "2,400+ participants",
    link: "https://github.com/tempandmajor/ottokode/discussions",
    color: "bg-gray-800"
  },
  {
    name: "Twitter Community",
    description: "Follow us for updates, tips, and community highlights.",
    icon: Twitter,
    members: "3,200+ followers",
    link: "#",
    color: "bg-blue-400"
  }
];

const upcomingEvents = [
  {
    title: "AI Coding Workshop",
    date: "Dec 28, 2024",
    time: "2:00 PM EST",
    type: "Workshop",
    description: "Learn advanced AI coding techniques and best practices."
  },
  {
    title: "Community Showcase",
    date: "Jan 15, 2025",
    time: "6:00 PM EST",
    type: "Showcase",
    description: "Present your projects and see what others have built."
  },
  {
    title: "Extension Development Masterclass",
    date: "Jan 22, 2025",
    time: "3:00 PM EST",
    type: "Masterclass",
    description: "Deep dive into creating powerful extensions for Ottokode."
  }
];

const featuredContributors = [
  {
    name: "Sarah Chen",
    role: "Core Contributor",
    avatar: "/api/placeholder/40/40",
    contributions: "142 commits",
    speciality: "AI Features"
  },
  {
    name: "Alex Rodriguez",
    role: "Extension Developer",
    avatar: "/api/placeholder/40/40",
    contributions: "8 extensions",
    speciality: "Theme Development"
  },
  {
    name: "Jamie Kim",
    role: "Documentation Lead",
    avatar: "/api/placeholder/40/40",
    contributions: "98 docs updates",
    speciality: "User Guides"
  },
  {
    name: "Morgan Taylor",
    role: "Community Moderator",
    avatar: "/api/placeholder/40/40",
    contributions: "500+ helped",
    speciality: "Community Support"
  }
];

const communityResources = [
  {
    title: "Contribution Guidelines",
    description: "Learn how to contribute code, documentation, and ideas to Ottokode.",
    icon: BookOpen,
    link: "#"
  },
  {
    title: "Extension Development Guide",
    description: "Complete guide to building and publishing extensions.",
    icon: Code,
    link: "#"
  },
  {
    title: "Feature Request Board",
    description: "Suggest new features and vote on existing proposals.",
    icon: Lightbulb,
    link: "#"
  },
  {
    title: "Bug Bounty Program",
    description: "Help us improve Ottokode and earn rewards for finding bugs.",
    icon: Trophy,
    link: "#"
  }
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Join the{" "}
              <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Ottokode Community
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with thousands of developers, share your projects, get help, and contribute
              to the future of AI-powered development tools.
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {communityStats.map((stat, index) => (
              <Card key={index} className="text-center border-border">
                <CardContent className="pt-6">
                  <stat.icon className="h-8 w-8 text-ai-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Community Platforms */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Connect With Us</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {communityPlatforms.map((platform, index) => (
                <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${platform.color} flex items-center justify-center mb-4`}>
                      <platform.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {platform.name}
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>{platform.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{platform.members}</span>
                      <Button size="sm" variant="outline">
                        Join Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Upcoming Events</h2>
            <div className="max-w-4xl mx-auto space-y-4">
              {upcomingEvents.map((event, index) => (
                <Card key={index} className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary">{event.type}</Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.date} • {event.time}
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                        <p className="text-muted-foreground">{event.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Register
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Contributors */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Contributors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredContributors.map((contributor, index) => (
                <Card key={index} className="text-center border-border">
                  <CardContent className="pt-6">
                    <Avatar className="w-16 h-16 mx-auto mb-4">
                      <AvatarImage src={contributor.avatar} alt={contributor.name} />
                      <AvatarFallback>{contributor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-foreground">{contributor.name}</h3>
                    <p className="text-sm text-ai-primary mb-1">{contributor.role}</p>
                    <p className="text-xs text-muted-foreground mb-2">{contributor.contributions}</p>
                    <Badge variant="outline" className="text-xs">
                      {contributor.speciality}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Community Resources */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Community Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {communityResources.map((resource, index) => (
                <Card key={index} className="border-border hover:border-ai-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-ai-primary/10 p-3 rounded-lg">
                        <resource.icon className="h-6 w-6 text-ai-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{resource.title}</h3>
                        <p className="text-muted-foreground text-sm">{resource.description}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Get Involved CTA */}
          <div className="text-center">
            <Card className="border-ai-primary/20 bg-ai-primary/5 max-w-4xl mx-auto">
              <CardContent className="pt-8 pb-8">
                <Heart className="h-12 w-12 text-ai-primary mx-auto mb-6" />
                <h3 className="text-3xl font-bold mb-4">Ready to Get Involved?</h3>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg">
                  Whether you&apos;re a seasoned developer or just starting out, there&apos;s a place for you
                  in the Ottokode community. Join us and help shape the future of development tools.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-ai-primary hover:bg-ai-primary/90" size="lg">
                    Join Discord Community
                  </Button>
                  <Button variant="outline" size="lg">
                    Contribute on GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}