import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArenaLogo } from "@/components/brand/ArenaLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--arena-border)] bg-[var(--arena-surface)]/50">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-7">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:items-center">
            <ArenaLogo width={36} height={36} className="rounded-full" />
            <div>
              <p className="text-sm font-bold text-[var(--arena-text)]">Poker AI Arena</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--arena-muted)]">
                Base Sepolia testnet only. No mainnet funds. No real-money wagering.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link href="/arena" className="v1-button-primary inline-flex text-xs">
              Enter Arena
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="#how-it-works" className="v1-button-secondary inline-flex text-xs">
              How it works
            </Link>
            <Link href="#roadmap" className="v1-button-secondary inline-flex text-xs">
              Roadmap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
