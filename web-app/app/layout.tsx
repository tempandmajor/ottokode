import { Metadata } from "next";
import { Providers } from "./providers";
import { AuthProvider } from "@/src/components/auth/auth-provider";
import "@/src/index.css";

export const metadata: Metadata = {
  title: "Branchcode AI - AI-Powered IDE for Modern Developers",
  description: "Branchcode AI is an intelligent IDE with AI-powered code completion, multi-language support, and advanced debugging tools. Available for desktop and web.",
  authors: [{ name: "Branchcode AI" }],
  openGraph: {
    title: "Branchcode AI - AI-Powered Development Environment",
    description: "Experience the future of coding with AI-powered assistance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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