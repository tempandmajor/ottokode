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
      <div className="container mx-auto px-4 h-28 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src={theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="Ottokode"
            width={120}
            height={120}
            className="h-24 w-24"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/download" className="text-muted-foreground hover:text-foreground transition-colors">
            Download
          </Link>
          <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
            Community
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-3">
          {/* Desktop only elements */}
          <div className="hidden sm:flex items-center space-x-3">
            <ThemeToggle />
          </div>

          {/* Authentication/Dashboard CTA */}
          {user ? (
            <Link href="/dashboard">
              <Button variant="hero" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="hero" size="sm">
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="outline"
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
            <Link
              href="/download"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Download
            </Link>
            <Link
              href="/docs"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Docs
            </Link>
            <Link
              href="/pricing"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/community"
              className="block text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <hr className="border-border" />
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">
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