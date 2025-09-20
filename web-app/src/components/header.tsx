import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Code, LogIn, Download } from "lucide-react";
import Link from "next/link";
import { UsageBadge } from "@/components/ai/usage-badge";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Code className="h-8 w-8 text-foreground" />
            <div className="absolute -inset-1 bg-primary/30 rounded-full opacity-50 animate-glow-pulse"></div>
          </div>
          <span className="text-xl font-bold text-foreground">
            Ottokode
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <Link href="/whats-new" className="text-muted-foreground hover:text-foreground transition-colors">
            What&apos;s New
          </Link>
          <Link href="/getting-started" className="text-muted-foreground hover:text-foreground transition-colors">
            Getting Started
          </Link>
          <a
            href="https://github.com/tempandmajor/ottokode/issues/new/choose"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Feedback
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <UsageBadge />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
          <a href="/#download">
            <Button variant="hero" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}