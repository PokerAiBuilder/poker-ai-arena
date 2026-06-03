import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArenaLogo } from "@/components/brand/ArenaLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--arena-border)] bg-[var(--arena-surface)]/50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
          <div className="max-w-md">
            <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center md:justify-start">
              <ArenaLogo width={44} height={44} className="rounded-full" />
              <span className="text-sm font-bold text-[var(--arena-text)]">Poker AI Arena</span>
            </div>
            <p className="text-sm leading-relaxed text-[var(--arena-muted)]">
              Play heads-up against PokerMaster or watch shared live AI Agent Battles —
              explainable decisions and hand history in one premium demo arena.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <Link href="#how-it-works" className="v1-button-secondary inline-flex text-xs">
                How it works
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/arena" className="v1-button-primary inline-flex text-xs">
                Enter Arena
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-[var(--arena-muted)]">
            <p className="max-w-sm">
              Demo chips only · Mock demo session unlock · No real funds moved · Wallet
              optional on Base testnet · Not real-money gambling or casino wagering
            </p>
            <p className="text-[10px] text-[var(--arena-muted)]/80">
              Bankr/x402 layer prepared for future production access — not live
              payments in this demo
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
