"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Bug, Plus, Zap, Shield } from "lucide-react";

const changelogEntries = [
  {
    version: "1.2.0",
    date: "2024-12-15",
    type: "major",
    title: "Enhanced AI Code Completion & Team Collaboration",
    description: "Major improvements to AI capabilities and new team features.",
    changes: [
      {
        type: "new",
        icon: Plus,
        title: "Team Workspaces",
        description: "Create shared workspaces for seamless team collaboration with real-time editing and comments."
      },
      {
        type: "enhancement",
        icon: Zap,
        title: "Improved AI Context Understanding",
        description: "AI now better understands project structure and provides more accurate code suggestions."
      },
      {
        type: "new",
        icon: Plus,
        title: "Advanced Git Integration",
        description: "Visual merge conflict resolution and enhanced branch management directly in the IDE."
      },
      {
        type: "enhancement",
        icon: Zap,
        title: "Performance Optimizations",
        description: "50% faster startup time and improved memory usage for large projects."
      }
    ]
  },
  {
    version: "1.1.2",
    date: "2024-11-28",
    type: "patch",
    title: "Bug Fixes & Stability Improvements",
    description: "Critical bug fixes and performance improvements.",
    changes: [
      {
        type: "bug",
        icon: Bug,
        title: "Fixed Monaco Editor Theme Issues",
        description: "Resolved theme switching problems that caused display issues in dark mode."
      },
      {
        type: "bug",
        icon: Bug,
        title: "File Explorer Refresh Bug",
        description: "Fixed issue where file explorer wouldn't refresh after external file changes."
      },
      {
        type: "enhancement",
        icon: Zap,
        title: "Improved Error Handling",
        description: "Better error messages and graceful handling of network connectivity issues."
      }
    ]
  },
  {
    version: "1.1.1",
    date: "2024-11-15",
    type: "patch",
    title: "Security Updates & Minor Enhancements",
    description: "Important security updates and small feature improvements.",
    changes: [
      {
        type: "security",
        icon: Shield,
        title: "Security Vulnerability Patches",
        description: "Updated dependencies to fix known security vulnerabilities."
      },
      {
        type: "enhancement",
        icon: Zap,
        title: "Auto-save Improvements",
        description: "More reliable auto-save functionality with better conflict resolution."
      },
      {
        type: "new",
        icon: Plus,
        title: "Keyboard Shortcuts Panel",
        description: "Added searchable keyboard shortcuts panel (Ctrl/Cmd + K + S)."
      }
    ]
  },
  {
    version: "1.1.0",
    date: "2024-11-01",
    type: "minor",
    title: "AI Chat Integration & Custom Themes",
    description: "Introducing AI chat assistance and customizable themes.",
    changes: [
      {
        type: "new",
        icon: Plus,
        title: "AI Chat Assistant",
        description: "Integrated AI chat for code explanations, debugging help, and technical questions."
      },
      {
        type: "new",
        icon: Plus,
        title: "Custom Theme Editor",
        description: "Create and share custom themes with full color customization."
      },
      {
        type: "enhancement",
        icon: Zap,
        title: "Enhanced Code Navigation",
        description: "Improved Go to Definition and Find References with better accuracy."
      },
      {
        type: "new",
        icon: Plus,
        title: "Extension Marketplace",
        description: "Browse and install community extensions directly from the IDE."
      }
    ]
  },
  {
    version: "1.0.0",
    date: "2024-10-15",
    type: "major",
    title: "Initial Release",
    description: "The first stable release of Ottokode with core AI-powered features.",
    changes: [
      {
        type: "new",
        icon: Plus,
        title: "AI Code Completion",
        description: "Intelligent code completion powered by advanced language models."
      },
      {
        type: "new",
        icon: Plus,
        title: "Multi-language Support",
        description: "Support for 50+ programming languages with syntax highlighting."
      },
      {
        type: "new",
        icon: Plus,
        title: "Integrated Terminal",
        description: "Built-in terminal with multiple shell support and customization options."
      },
      {
        type: "new",
        icon: Plus,
        title: "Git Integration",
        description: "Native Git support with visual diff, staging, and commit management."
      },
      {
        type: "new",
        icon: Plus,
        title: "Project Templates",
        description: "Quick start templates for popular frameworks and languages."
      }
    ]
  }
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "major":
      return "bg-ai-primary text-ai-primary-foreground";
    case "minor":
      return "bg-blue-500 text-white";
    case "patch":
      return "bg-green-500 text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getChangeTypeColor = (type: string) => {
  switch (type) {
    case "new":
      return "text-green-600 dark:text-green-400";
    case "enhancement":
      return "text-blue-600 dark:text-blue-400";
    case "bug":
      return "text-red-600 dark:text-red-400";
    case "security":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-muted-foreground";
  }
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="py-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                Changelog
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay up to date with new features, improvements, and bug fixes in Ottokode.
              We're constantly working to make your development experience better.
            </p>
          </div>

          {/* Changelog Entries */}
          <div className="space-y-12">
            {changelogEntries.map((entry, index) => (
              <Card key={index} className="border-border">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge className={getTypeColor(entry.type)}>
                        v{entry.version}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 mr-1" />
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl">{entry.title}</CardTitle>
                  <CardDescription className="text-base">
                    {entry.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex} className="flex items-start space-x-3">
                        <change.icon className={`h-5 w-5 mt-0.5 ${getChangeTypeColor(change.type)}`} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {change.title}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1">
                            {change.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscribe to Updates */}
          <div className="mt-16 text-center">
            <Card className="border-ai-primary/20 bg-ai-primary/5">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
                <p className="text-muted-foreground mb-4">
                  Follow our GitHub repository to get notified about new releases and updates.
                </p>
                <a
                  href="https://github.com/tempandmajor/ottokode"
                  className="inline-flex items-center px-4 py-2 bg-ai-primary text-ai-primary-foreground rounded-md hover:bg-ai-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Watch on GitHub
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}