import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { PoweredBy } from "@/components/landing/PoweredBy";
import { Roadmap } from "@/components/landing/Roadmap";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TablePreview } from "@/components/landing/TablePreview";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 overflow-x-hidden">
        <Hero />
        <FeatureCards />
        <TablePreview />
        <Roadmap />
        <PoweredBy />
      </main>
      <SiteFooter />
    </>
  );
}
