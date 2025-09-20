"use client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { UsageBadge } from "@/components/ai/usage-badge";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";
import Image from "next/image";

export function Header() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="Ottokode"
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/whats-new" className="text-muted-foreground hover:text-foreground transition-colors">
            What&apos;s New
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Desktop only elements */}
          <div className="hidden sm:flex items-center space-x-3">
            <ThemeToggle />
          </div>

          {/* Getting Started CTA - always visible */}
          <Link href="/getting-started">
            <Button variant="hero" size="sm">
              Get Started
            </Button>
          </Link>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <a
              href="/#features"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <Link
              href="/whats-new"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              What&apos;s New
            </Link>
            <Link
              href="/docs"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <hr className="border-border" />
            <Link href="/getting-started" onClick={() => setMobileMenuOpen(false)}>
              <Button size="sm" className="w-full">
                Get Started
              </Button>
            </Link>
            {!user && (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}