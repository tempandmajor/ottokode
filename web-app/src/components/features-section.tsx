import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Zap, Shield, Code2, GitBranch, Palette } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Code Assistance",
    description: "Built-in chat interface for coding help and guidance from external AI providers when configured."
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized performance with instant startup and responsive editing for the smoothest experience."
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Your code stays private with local processing and enterprise-grade security features."
  },
  {
    icon: Code2,
    title: "Multi-Language",
    description: "Support for popular programming languages with syntax highlighting and code editing features."
  },
  {
    icon: GitBranch,
    title: "Git Integration",
    description: "Seamless version control with visual diff, branch management, and conflict resolution."
  },
  {
    icon: Palette,
    title: "Customizable",
    description: "Extensive themes, layouts, and extensions to match your preferred development environment."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Supercharge Your Development
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Built for modern developers who demand speed, simplicity, and reliability in their tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-white p-2.5 mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-full w-full text-black" />
                </div>
                <CardTitle className="group-hover:text-ai-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}