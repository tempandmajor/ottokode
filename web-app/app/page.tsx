"use client";

import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { DownloadSection } from "@/components/download-section";
import { Footer } from "@/components/footer";
import { UserAgreementWrapper } from "@/components/legal/user-agreement-wrapper";

export default function HomePage() {
  return (
    <UserAgreementWrapper isDesktop={false}>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <DownloadSection />
        </main>
        <Footer />
      </div>
    </UserAgreementWrapper>
  );
}