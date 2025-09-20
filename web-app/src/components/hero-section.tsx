import React from "react";
import { Button } from "@/components/ui/button";
import { Download, Play, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm text-foreground mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Modern Development
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-ai-primary to-ai-secondary bg-clip-text text-transparent leading-tight">
              Code with
              <br />
              <span className="text-ai-glow">Confidence</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              A powerful IDE designed for modern developers. Clean interface,
              fast performance, and extensible architecture in one reliable editor.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/ide">
                <Button size="lg" className="bg-ai-primary hover:bg-ai-primary/90 text-ai-primary-foreground shadow-ai">
                  <Play className="h-5 w-5 mr-2" />
                  Try Web IDE
                </Button>
              </Link>
              <Link href="/desktop">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent">
                  <Download className="h-5 w-5 mr-2" />
                  Download Desktop
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-card/40 backdrop-blur">
              <div className="absolute inset-0 bg-gradient-to-br from-ai-primary/20 to-ai-secondary/20"></div>
              <div className="p-6 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-ai-primary rounded-lg mb-4 mx-auto animate-glow-pulse"></div>
                  <p className="text-muted-foreground">Interactive IDE Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}