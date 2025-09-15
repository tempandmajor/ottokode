import { Button } from "@/src/components/ui/button";
import { Download, Play, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-white/5 opacity-50"></div>
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-white/20 rounded-full opacity-30 animate-glow-pulse"></div>
      <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-white/20 rounded-full opacity-20 animate-glow-pulse" style={{ animationDelay: "2s" }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm text-white mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              AI-Powered Development
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Code with{" "}
                <span className="bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                  AI Intelligence
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Branchcode AI transforms your development workflow with intelligent code completion,
                automated refactoring, and AI-powered debugging. Write better code, faster.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="group bg-ai-primary hover:bg-ai-primary/90">
                <a href="https://github.com/your-username/branchcode-ai/releases" target="_blank" rel="noopener noreferrer">
                  <Download className="h-5 w-5 mr-2 group-hover:animate-bounce" />
                  Download Desktop App
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="group">
                <Link href="/ide">
                  <Play className="h-5 w-5 mr-2" />
                  Try Web IDE
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Free to use
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Cross-platform
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                Open source
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute -inset-4 bg-ai-glow/20 rounded-2xl opacity-20 blur-xl"></div>
            <div className="relative rounded-2xl shadow-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm text-muted-foreground">Branchcode AI IDE</div>
                </div>
                <div className="bg-background/90 rounded-lg p-4 font-mono text-sm">
                  <div className="text-ai-primary">// AI-powered code completion</div>
                  <div className="text-foreground">function <span className="text-ai-secondary">createComponent</span>() {'{'}
                  <div className="ml-4 text-muted-foreground">// AI suggestion: Add TypeScript types</div>
                  <div className="ml-4">return <span className="text-green-400">&lt;div&gt;Hello World&lt;/div&gt;</span>;</div>
                  <div>{'}'}</div>
                </div>
                <div className="bg-ai-primary/10 rounded-lg p-3 border border-ai-primary/20">
                  <div className="text-xs text-ai-primary font-medium">✨ AI Assistant</div>
                  <div className="text-sm text-foreground mt-1">I can help you optimize this function for better performance.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}