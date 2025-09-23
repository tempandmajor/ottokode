import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle } from "lucide-react";
import Link from "next/link";
import { DownloadButtons } from "@/components/downloads/download-buttons";

// Platform cards removed in favor of dynamic GitHub-release driven buttons

const features = [
  "Code assistance chat interface",
  "Multi-language support",
  "Git integration",
  "Extension support",
  "File management",
  "Syntax highlighting"
];

export function DownloadSection() {
  return (
    <section id="download" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Download Ottokode
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with a modern, clean desktop IDE designed for productivity.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Download Options */}
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-lg mb-1">Get the latest release</h3>
                  <p className="text-sm text-muted-foreground">We automatically link the newest macOS builds from GitHub Releases. Currently supports macOS and web platforms.</p>
                </div>
                <DownloadButtons />
              </CardContent>
            </Card>

            <div className="text-center pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Need help getting started?
              </p>
              <Link href="/docs">
                <Button variant="outline" size="lg" className="group">
                  <Smartphone className="h-5 w-5 mr-2" />
                  View Documentation
                </Button>
              </Link>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">What&apos;s included:</h3>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-6 mt-8">
              <h4 className="font-semibold mb-2">🚀 Ready to Start</h4>
              <p className="text-sm text-muted-foreground">
                Download and start coding immediately. No setup required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}