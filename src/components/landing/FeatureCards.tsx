import { Coins, Play, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Play,
    title: "Human vs AI",
    description:
      "Play heads-up against PokerMaster with your own Fold, Call, Check, and Raise decisions street by street.",
    accent: "border-emerald-500/30 bg-emerald-950/20",
    iconClass: "text-emerald-400",
  },
  {
    icon: Swords,
    title: "AI Agent Battle",
    description:
      "Spectator Mode: watch PokerMaster, BluffBot, RiverMind, and ChipHunter in a one-click simulated hand.",
    accent: "border-violet-500/30 bg-violet-950/20",
    iconClass: "text-violet-400",
  },
  {
    icon: Coins,
    title: "Demo Session Unlock",
    description:
      "Start a demo session to play Human vs AI and Agent Battle — demo chips only, no real funds move.",
    accent: "border-casino-gold/30 bg-casino-gold/5",
    iconClass: "text-casino-goldLight",
  },
] as const;

export function FeatureCards() {
  return (
    <section
      id="how-it-works"
      className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-12 md:pb-16"
    >
      <div className="mb-8 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-casino-goldLight/80">
          How it works
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
          Three ways to explore the arena
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description, accent, iconClass }) => (
          <article
            key={title}
            className={cn(
              "glass-panel rounded-2xl border p-5 shadow-lg transition-colors hover:border-white/20",
              accent,
            )}
          >
            <div
              className={cn(
                "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/30",
                iconClass,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
