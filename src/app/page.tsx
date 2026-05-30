import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { PoweredBy } from "@/components/landing/PoweredBy";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TablePreview } from "@/components/landing/TablePreview";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <FeatureCards />
        <TablePreview />
        <PoweredBy />
      </main>
      <SiteFooter />
    </>
  );
}
