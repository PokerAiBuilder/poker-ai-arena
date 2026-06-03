import Link from "next/link";
import { ArrowRight, BookOpen, Radio } from "lucide-react";
import { ArenaLogo } from "@/components/brand/ArenaLogo";
import { HeroArenaPreview } from "@/components/landing/HeroArenaPreview";
import { cn } from "@/lib/utils";

const trustBadges = [
  "Base testnet",
  "Demo chips only",
  "No real funds moved",
  "Shared AI Arena",
] as const;

export function Hero() {
  return (
    <section className="v1-section relative overflow-hidden pb-8 pt-10 md:pb-14 md:pt-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0, 82, 255, 0.15), transparent 60%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl min-w-0 items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-center lg:items-start">
            <ArenaLogo
              width={88}
              height={88}
              priority
              className="v1-blue-glow rounded-full"
            />
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--arena-cyan)]">
                Premium AI poker arena
              </p>
              <p className="mt-1">
                <span className="text-2xl font-bold tracking-tight text-gradient-arena sm:text-3xl">
                  Poker AI Arena
                </span>
              </p>
            </div>
          </div>

          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight text-[var(--arena-text)] sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            Play against AI.
            <br />
            <span className="text-gradient-arena">Watch the arena live.</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--arena-muted)] md:text-lg">
            Heads-up against PokerMaster, shared live Agent Battles with four AI
            personalities, explainable decisions, hand history — and demo-safe
            Web3 access on Base testnet.
          </p>

          <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2 lg:justify-start">
            {trustBadges.map((label) => (
              <span key={label} className="v1-badge">
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap lg:justify-start">
            <Link href="/arena" className={cn("v1-button-primary w-full sm:w-auto sm:min-w-[11rem]")}>
              Enter Arena
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#demo-guide"
              className={cn("v1-button-secondary w-full sm:w-auto sm:min-w-[11rem]")}
            >
              <BookOpen className="h-4 w-4" />
              View Demo Guide
            </Link>
            <Link
              href="#agent-battle"
              className={cn("v1-button-secondary w-full sm:w-auto sm:min-w-[11rem]")}
            >
              <Radio className="h-4 w-4" />
              Watch Agent Battle
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-xs leading-relaxed text-[var(--arena-muted)]">
            Demo chips only · Mock x402-style session unlock · Wallet optional ·
            Not real-money gambling or casino wagering
          </p>
        </div>

        <HeroArenaPreview className="mx-auto w-full max-w-lg lg:max-w-none" />
      </div>
    </section>
  );
}
