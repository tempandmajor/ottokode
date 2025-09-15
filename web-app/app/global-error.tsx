"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Global Error:", error);

    // You can integrate with error tracking services here
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              {/* Error Icon */}
              <div className="mb-8">
                <AlertTriangle className="h-24 w-24 text-red-500 mx-auto mb-4" />
                <div className="w-32 h-1 bg-red-500 mx-auto mb-8 rounded-full"></div>
              </div>

              {/* Error Message */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
                <p className="text-xl text-muted-foreground max-w-lg mx-auto mb-4">
                  We encountered an unexpected error. Our team has been notified
                  and is working to fix this issue.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <details className="text-left bg-muted p-4 rounded-lg mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs mt-2 overflow-auto">
                      {error.message}
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={reset}
                  className="bg-ai-primary hover:bg-ai-primary/90"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.location.href = "/"}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Support Info */}
              <div className="mt-12 pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Still having issues? Our support team is here to help.
                </p>
                <Button variant="link" asChild>
                  <a href="/support">Contact Support</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}