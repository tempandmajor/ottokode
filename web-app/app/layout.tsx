import { Metadata } from "next";
import { Providers } from "./providers";
import { AuthProvider } from "@/components/auth/auth-provider";
import "@/index.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://ottokode.ai'),
  title: "Ottokode - AI-Powered IDE for Modern Developers",
  description: "Ottokode is an intelligent IDE with AI-powered code completion, multi-language support, and advanced debugging tools. Available for desktop and web.",
  keywords: ["AI IDE", "code completion", "developer tools", "artificial intelligence", "programming", "code editor", "software development"],
  authors: [{ name: "Ottokode" }],
  robots: "index, follow",
  openGraph: {
    title: "Ottokode - AI-Powered Development Environment",
    description: "Experience the future of coding with AI-powered assistance",
    type: "website",
    url: "https://ottokode.ai",
    siteName: "Ottokode",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ottokode - AI-Powered IDE"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    site: "@ottokode",
    creator: "@ottokode",
    title: "Ottokode - AI-Powered IDE",
    description: "Experience the future of coding with AI-powered assistance",
    images: ["/og-image.png"]
  },
  alternates: {
    canonical: "https://ottokode.ai"
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}