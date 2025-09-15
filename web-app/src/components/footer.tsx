import { Code, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Code className="h-6 w-6 text-foreground" />
              <span className="text-lg font-bold text-foreground">
                Ottokode
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              The AI-powered IDE that makes development faster, smarter, and more enjoyable.
            </p>
            <div className="flex space-x-3">
              <a href="https://github.com/tempandmajor/ottokode" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com/ottokode" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="mailto:support@ottokode.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="/#download" className="hover:text-foreground transition-colors">Download</a></li>
              <li><a href="/pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="/changelog" className="hover:text-foreground transition-colors">Changelog</a></li>
            </ul>
          </div>

          {/* Developers */}
          <div className="space-y-4">
            <h3 className="font-semibold">Developers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="/docs/api" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="/extensions" className="hover:text-foreground transition-colors">Extensions</a></li>
              <li><a href="https://github.com/tempandmajor/ottokode" className="hover:text-foreground transition-colors">GitHub</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/help" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="/community" className="hover:text-foreground transition-colors">Community</a></li>
              <li><a href="/support" className="hover:text-foreground transition-colors">Contact Us</a></li>
              <li><a href="https://github.com/tempandmajor/ottokode/issues" className="hover:text-foreground transition-colors">Bug Reports</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Ottokode. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-muted-foreground mt-4 md:mt-0">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/support" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}