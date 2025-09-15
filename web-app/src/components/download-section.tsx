import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Monitor, Smartphone, Tablet, CheckCircle } from "lucide-react";

const platforms = [
  {
    icon: Monitor,
    name: "Windows",
    description: "Windows 10/11 (64-bit)",
    size: "~127 MB"
  },
  {
    icon: Monitor,
    name: "macOS",
    description: "macOS 10.15+ (Intel & Apple Silicon)",
    size: "~142 MB"
  },
  {
    icon: Monitor,
    name: "Linux",
    description: "Ubuntu 18.04+ / Debian 10+",
    size: "~134 MB"
  }
];

const features = [
  "AI-powered code completion",
  "Multi-language support",
  "Git integration",
  "Extension marketplace",
  "Cloud sync",
  "Collaborative editing"
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
            Get started with the most intelligent IDE available. Free for individual developers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Download Options */}
          <div className="space-y-6">
            <div className="grid gap-4">
              {platforms.map((platform, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-white p-2.5">
                        <platform.icon className="h-full w-full text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground">{platform.description}</p>
                        <p className="text-xs text-muted-foreground">{platform.size}</p>
                      </div>
                    </div>
                    <Button variant="hero" className="group-hover:scale-105 transition-transform">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Or try the web version instantly
              </p>
              <Button variant="outline" size="lg" className="group">
                <Smartphone className="h-5 w-5 mr-2" />
                Launch Web IDE
              </Button>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold">What's included:</h3>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <div className="bg-white/10 border border-white/20 rounded-xl p-6 mt-8">
              <h4 className="font-semibold mb-2">🎉 Launch Special</h4>
              <p className="text-sm text-muted-foreground">
                All premium features are free during our beta period. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}