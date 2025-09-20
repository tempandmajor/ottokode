"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Target,
  Award,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Globe
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Alex Rodriguez",
      role: "CEO & Co-Founder",
      bio: "Former Google engineer with 10+ years in software development and developer tools",
      image: "/placeholder.svg",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder",
      bio: "Ex-Microsoft engineer, expert in distributed systems and IDE development",
      image: "/placeholder.svg",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    },
    {
      name: "Marcus Thompson",
      role: "Head of Engineering",
      bio: "PhD in Computer Science, experienced software architect specializing in development environments",
      image: "/placeholder.svg",
      social: {
        twitter: "#",
        linkedin: "#",
        github: "#"
      }
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "Company Founded",
      description: "Started with a vision to democratize modern development"
    },
    {
      year: "2024",
      title: "Beta Launch",
      description: "Released closed beta to 1,000+ developers worldwide"
    },
    {
      year: "2024",
      title: "Series A Funding",
      description: "Raised $10M to accelerate platform development"
    },
    {
      year: "2024",
      title: "Public Launch",
      description: "Launched public version with 50,000+ active users"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-ai-primary/10 to-ai-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4">About Ottokode</Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
            Building the Future of Development
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            We&apos;re on a mission to empower every developer with modern development tools that enhance creativity,
            productivity, and collaboration in software development.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-ai-primary hover:bg-ai-primary/90 text-white">
              <Mail className="h-5 w-5 mr-2 text-white" />
              Contact Us
            </Button>
            <Button size="lg" variant="outline">
              <Github className="h-5 w-5 mr-2" />
              Open Source
            </Button>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-ai-primary/20">
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-ai-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
                <p className="text-muted-foreground">
                  To democratize modern development tools and make powerful development environments
                  accessible to developers of all skill levels worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="border-ai-secondary/20">
              <CardContent className="p-8 text-center">
                <Award className="h-12 w-12 text-ai-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
                <p className="text-muted-foreground">
                  A world where modern tools amplify human creativity in software development,
                  enabling faster innovation and better solutions for global challenges.
                </p>
              </CardContent>
            </Card>

            <Card className="border-ai-glow/20">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-ai-glow mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Our Values</h3>
                <p className="text-muted-foreground">
                  Innovation, transparency, developer-first approach, and commitment to
                  user privacy and intellectual property protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Passionate engineers building the next generation of development tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-ai-primary to-ai-secondary rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                  <Badge variant="secondary" className="mb-4">{member.role}</Badge>
                  <p className="text-muted-foreground text-sm mb-6">{member.bio}</p>
                  <div className="flex justify-center gap-3">
                    <Button size="sm" variant="ghost">
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Linkedin className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Github className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
            <p className="text-xl text-muted-foreground">
              Key milestones in building Ottokode
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-ai-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {milestone.year.slice(-2)}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{milestone.title}</h3>
                      <Badge variant="outline">{milestone.year}</Badge>
                    </div>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-ai-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Active Developers</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ai-secondary mb-2">1M+</div>
              <div className="text-muted-foreground">Lines of Code</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ai-glow mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-ai-primary mb-2">150+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
            <p className="text-xl text-muted-foreground">
              Have questions or want to learn more? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <Mail className="h-8 w-8 text-ai-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Email Us</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  General inquiries and support
                </p>
                <Button variant="outline" size="sm">
                  hello@ottokode.ai
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="h-8 w-8 text-ai-secondary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Visit Us</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Our headquarters
                </p>
                <Button variant="outline" size="sm">
                  San Francisco, CA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <Globe className="h-8 w-8 text-ai-glow mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Follow Us</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Stay updated with our latest news
                </p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" variant="outline">
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Github className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-ai-primary/10 to-ai-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience Modern Development?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already building with confidence using Ottokode
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/ide">
              <Button size="lg" className="bg-ai-primary hover:bg-ai-primary/90 text-white">
                Try Web IDE
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Download Desktop
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}