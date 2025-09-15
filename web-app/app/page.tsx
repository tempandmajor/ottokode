"use client";

import { Header } from "@/src/components/header";
import { HeroSection } from "@/src/components/hero-section";
import { FeaturesSection } from "@/src/components/features-section";
import { DownloadSection } from "@/src/components/download-section";
import { Footer } from "@/src/components/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}