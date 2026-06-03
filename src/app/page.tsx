import { FeatureCards } from "@/components/landing/FeatureCards";
import { Hero } from "@/components/landing/Hero";
import { PoweredBy } from "@/components/landing/PoweredBy";
import { Roadmap } from "@/components/landing/Roadmap";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function HomePage() {
  return (
    <div className="v1-gradient-bg min-h-dvh min-w-0 overflow-x-hidden">
      <SiteHeader />
      <main className="min-w-0">
        <Hero />
        <FeatureCards />
        <Roadmap />
        <PoweredBy />
      </main>
      <SiteFooter />
    </div>
  );
}
