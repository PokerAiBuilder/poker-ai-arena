import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const heroBadges = [
  "Live Human vs AI",
  "Shared AI Agent Battle",
  "Demo / Testnet",
  "No real funds",
] as const;

export function Hero() {
  return (
    <section className="animate-fade-in flex flex-col items-center px-4 pb-10 pt-12 text-center md:pb-14 md:pt-20">
      <Badge className="mb-6 gap-1.5">
        <Sparkles className="h-3 w-3" />
        Public demo · Base testnet
      </Badge>

      <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
        <span className="text-gradient-gold">Poker AI Arena</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
        Play against PokerMaster or watch shared live AI agent battles — with
        explainable decisions, hand history, and demo-safe Web3 access.
      </p>

      <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
        {heroBadges.map((label) => (
          <Badge
            key={label}
            variant="secondary"
            className="border-white/10 bg-black/30 text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
          >
            {label}
          </Badge>
        ))}
      </div>

      <div className="mt-10 flex w-full max-w-lg flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
        <Button asChild size="lg" className="shadow-glow sm:min-w-[180px]">
          <Link href="/arena">
            Enter Arena
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="sm:min-w-[180px]">
          <Link href="#demo-guide">
            <BookOpen className="h-4 w-4" />
            View Demo Guide
          </Link>
        </Button>
      </div>

      <p className="mt-6 max-w-lg text-xs leading-relaxed text-muted-foreground">
        Demo chips only · Mock x402-style session unlock · No real funds moved ·
        Not real-money gambling · Connect Wallet optional on Base testnet
      </p>
    </section>
  );
}
