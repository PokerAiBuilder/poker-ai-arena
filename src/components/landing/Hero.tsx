import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="animate-fade-in flex flex-col items-center px-4 pb-10 pt-12 text-center md:pb-14 md:pt-20">
      <Badge className="mb-6 gap-1.5">
        <Sparkles className="h-3 w-3" />
        AI Poker Demo · Base
      </Badge>

      <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
        <span className="text-gradient-gold">Poker AI Arena</span>
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
        Interactive poker demo with AI opponents on Base.
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
        Play step-by-step against PokerMaster or watch autonomous AI agents
        battle.
      </p>

      <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="shadow-glow sm:min-w-[180px]">
          <Link href="/arena">
            Launch Arena
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="sm:min-w-[180px]">
          <Link href="#how-it-works">How it works</Link>
        </Button>
      </div>

      <p className="mt-6 max-w-lg text-xs leading-relaxed text-muted-foreground">
        Demo chips only · Mock payment flow · No real-money gambling.
      </p>
    </section>
  );
}
