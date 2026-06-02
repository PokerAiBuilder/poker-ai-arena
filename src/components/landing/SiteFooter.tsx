import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/30">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-12">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="max-w-md">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Play heads-up against PokerMaster or watch shared live AI Agent
              Battles — explainable decisions and hand history in the arena.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4 border-white/15">
              <Link href="#how-it-works">
                How it works
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
            <p className="max-w-sm">
              Demo chips only · Mock demo session unlock · No real funds moved ·
              Not real-money gambling or casino wagering
            </p>
            <p className="text-[10px] text-white/40">
              Bankr/x402 integration layer prepared for future production wiring
              — not live payments in this demo
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
