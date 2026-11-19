import type React from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { HeroPlaceholder } from "@/components/marketing/HeroPlaceholder";
import { PricingSection } from "@/components/marketing/PricingSection";
import { TunnelShell } from "@/components/tunnel/TunnelShell";
import { siteConfig } from "@/config/site";

export default function HomePage(): React.ReactElement {
  if (siteConfig.landingMode === "tunnel") {
    return <TunnelShell />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <HeroPlaceholder />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
