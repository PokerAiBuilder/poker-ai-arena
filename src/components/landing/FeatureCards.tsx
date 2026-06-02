import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Clock,
  Radio,
  ScrollText,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureBlock = {
  icon: LucideIcon;
  title: string;
  bullets: string[];
  accent: string;
  iconClass: string;
};

const humanVsAi: FeatureBlock = {
  icon: Clock,
  title: "Human vs AI",
  bullets: [
    "Live poker-room flow — you make poker decisions only",
    "15-second action timer with auto-check / auto-fold on timeout",
    "Flop, turn, and river auto-deal; result auto-shows at showdown or fold",
    "All-in auto-runout through remaining streets",
    "PokerMaster decision reasoning in the AI Decision panel (privacy guard before showdown)",
  ],
  accent: "border-emerald-500/30 bg-emerald-950/20",
  iconClass: "text-emerald-400",
};

const sharedBattle: FeatureBlock = {
  icon: Radio,
  title: "Shared Agent Battle",
  bullets: [
    "Four AI agents on a shared server timeline — multiple viewers watch the same hand",
    "Lifecycle: playing → result pause → auto next hand",
    "Active agent highlight during replay; full 5-card board at result",
    "Skip animations is local only — does not change the simulated hand",
    "Join once and stay synced with the live arena",
  ],
  accent: "border-violet-500/30 bg-violet-950/20",
  iconClass: "text-violet-400",
};

const explainable: FeatureBlock = {
  icon: Brain,
  title: "Explainable Decisions",
  bullets: [
    "Latest action, confidence bar, and reasoning quote",
    "Hand, board, and pressure context when allowed",
    "Human vs AI hides PokerMaster private hand info until showdown",
    "Agent Battle spectator mode shows full agent metadata",
    "Thinking state while agents decide",
  ],
  accent: "border-cyan-500/30 bg-cyan-950/20",
  iconClass: "text-cyan-400",
};

const logsHistory: FeatureBlock = {
  icon: ScrollText,
  title: "Logs & History",
  bullets: [
    "Action Log — current hand replay street by street",
    "History — recent completed hands archive (localStorage)",
    "Arena Menu on desktop and mobile — Decision, Agents, Log, History, Stats",
    "Street filters and action-type badges in the log",
  ],
  accent: "border-amber-500/25 bg-amber-950/15",
  iconClass: "text-amber-300",
};

const demoWeb3: FeatureBlock = {
  icon: Wallet,
  title: "Demo & Web3",
  bullets: [
    "Start Demo Session — mock x402-style session unlock; no real funds moved",
    "Base testnet wallet scaffold (Connect Wallet optional)",
    "Bankr/x402 integration layer prepared for future production wiring",
    "Demo chips only — not real-money gambling or casino wagering",
  ],
  accent: "border-casino-gold/30 bg-casino-gold/5",
  iconClass: "text-casino-goldLight",
};

const agents = [
  { name: "PokerMaster", style: "Balanced Strategist", emoji: "🎯" },
  { name: "BluffBot", style: "Pressure Bluffer", emoji: "🎭" },
  { name: "RiverMind", style: "Tight Analyst", emoji: "🧠" },
  { name: "ChipHunter", style: "Aggressive Hunter", emoji: "🔥" },
] as const;

function FeaturePanel({ icon: Icon, title, bullets, accent, iconClass }: FeatureBlock) {
  return (
    <article
      className={cn(
        "glass-panel min-w-0 rounded-2xl border p-5 shadow-lg transition-colors hover:border-white/20 md:p-6",
        accent,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30",
            iconClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 break-words">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/35" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function FeatureCards() {
  return (
    <>
      <section
        id="how-it-works"
        className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-12 md:pb-16"
      >
        <div className="mb-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-casino-goldLight/80">
            Live arena demo
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
            Play or watch — same table, explainable AI
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Start a demo session on Base testnet, play heads-up against
            PokerMaster, or join the shared Agent Battle spectatorship lane.
          </p>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <FeaturePanel {...humanVsAi} />
          <FeaturePanel {...sharedBattle} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 md:pb-16">
        <div className="mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white md:text-2xl">AI Agents</h2>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map(({ name, style, emoji }) => (
            <div
              key={name}
              className="glass-panel rounded-xl border border-white/10 p-4 text-center"
            >
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <p className="mt-2 text-sm font-semibold text-white">{name}</p>
              <p className="mt-1 text-xs text-violet-200/80">{style}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12 md:pb-16">
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <FeaturePanel {...explainable} />
          <FeaturePanel {...logsHistory} />
        </div>
      </section>

      <section
        id="demo-guide"
        className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-12 md:pb-16"
      >
        <div className="mb-6 flex items-center gap-2">
          <Shield className="h-5 w-5 text-casino-goldLight" />
          <h2 className="text-xl font-bold text-white md:text-2xl">
            Demo-safe Web3 wrapper
          </h2>
        </div>
        <FeaturePanel {...demoWeb3} />
        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
          Not real-money gambling. Demo chips are simulated points. Mock x402-style
          session unlock only — no real funds moved. Entry unlock is demo access,
          not casino wagering.
        </p>
      </section>
    </>
  );
}
