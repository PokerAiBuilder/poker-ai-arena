import type { LucideIcon } from "lucide-react";
import {
  Brain,
  Radio,
  ScrollText,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeatureBlock = {
  id?: string;
  icon: LucideIcon;
  title: string;
  bullets: string[];
};

const features: FeatureBlock[] = [
  {
    icon: Users,
    title: "Human vs AI",
    bullets: [
      "Lock a Base Sepolia test stake and receive chips",
      "Play heads-up against PokerMaster",
      "Explainable AI decision panel",
      "Hand history and result flow",
    ],
  },
  {
    id: "agent-battle",
    icon: Radio,
    title: "Shared Live Agent Battle",
    bullets: [
      "Four AI personalities in one shared hand",
      "Watch the same timeline and replay",
      "Full board and result visibility",
      "Designed for future agent tournaments",
    ],
  },
  {
    icon: Brain,
    title: "Explainable Decisions",
    bullets: [
      "Latest action, confidence bar, and reasoning quote",
      "Hand, board, and pressure context when allowed",
      "Human vs AI hides private hole info until showdown",
      "Spectator mode shows full agent metadata",
    ],
  },
  {
    icon: ScrollText,
    title: "Action Log + History",
    bullets: [
      "Action Log — current hand replay street by street",
      "History — recent completed hands (localStorage)",
      "Arena Menu on desktop and mobile",
      "Street filters and action-type badges",
    ],
  },
  {
    icon: Wallet,
    title: "Base Sepolia stake flow",
    bullets: [
      "Connect wallet and choose a test stake tier",
      "Confirm a Base Sepolia test ETH transaction",
      "Receive chips after tx confirmation",
      "Escrow contract payout layer is next",
    ],
  },
];

const agents = [
  {
    name: "PokerMaster",
    style: "Balanced Strategist",
    trait: "Range control · position aware",
    accent: "from-[var(--arena-blue)]/30 to-[var(--arena-surface-2)]",
  },
  {
    name: "BluffBot",
    style: "Pressure Bluffer",
    trait: "Overbets · fold equity",
    accent: "from-[var(--arena-cyan)]/25 to-[var(--arena-surface-2)]",
  },
  {
    name: "RiverMind",
    style: "Tight Analyst",
    trait: "Pot odds · river discipline",
    accent: "from-indigo-500/20 to-[var(--arena-surface-2)]",
  },
  {
    name: "ChipHunter",
    style: "Aggressive Hunter",
    trait: "3-bets · stack pressure",
    accent: "from-sky-500/20 to-[var(--arena-surface-2)]",
  },
] as const;

function FeaturePanel({ icon: Icon, title, bullets, id }: FeatureBlock) {
  return (
    <article id={id} className="v1-card v1-glow-border min-w-0 scroll-mt-24 p-4 md:p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--arena-border)] bg-[var(--arena-bg)]/80 text-[var(--arena-cyan)] shadow-arena-cyan">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--arena-text)]">{title}</h3>
      </div>
      <ul className="space-y-2 text-sm leading-relaxed text-[var(--arena-muted)]">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 break-words">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--arena-blue-bright)]" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--arena-cyan)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold text-[var(--arena-text)] md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-[var(--arena-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function FeatureCards() {
  return (
    <>
      <section
        id="how-it-works"
        className="v1-section mx-auto max-w-6xl scroll-mt-24 py-6 md:py-8"
      >
        <SectionHeading
          eyebrow="Product"
          title="One arena. Play or spectate."
          description="Lock a Base Sepolia test stake, play heads-up against PokerMaster, or watch four AI agents battle on a shared live timeline."
        />

        <div className="grid min-w-0 gap-3 md:grid-cols-2 md:gap-4">
          {features.slice(0, 2).map((feature) => (
            <FeaturePanel key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="v1-section mx-auto max-w-6xl py-4 md:py-6">
        <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
          <Users className="h-5 w-5 text-[var(--arena-cyan)]" />
          <h2 className="text-xl font-bold text-[var(--arena-text)] md:text-2xl">
            AI Agent Profiles
          </h2>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map(({ name, style, trait, accent }) => (
            <div
              key={name}
              className={cn(
                "v1-card v1-glow-border overflow-hidden p-3.5 text-center transition-transform hover:-translate-y-0.5 md:p-4",
                "bg-gradient-to-b",
                accent,
              )}
            >
              <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--arena-border)] bg-[var(--arena-bg)]/60 text-xs font-bold text-[var(--arena-cyan)] shadow-arena-blue">
                {name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-[var(--arena-text)]">{name}</p>
              <p className="mt-0.5 text-xs font-medium text-[var(--arena-cyan)]">{style}</p>
              <p className="mt-1.5 text-[10px] leading-snug text-[var(--arena-muted)]">{trait}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="v1-section mx-auto max-w-6xl py-4 md:py-6">
        <div className="grid min-w-0 gap-3 md:grid-cols-2 md:gap-4">
          {features.slice(2, 4).map((feature) => (
            <FeaturePanel key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section
        id="demo-guide"
        className="v1-section mx-auto max-w-6xl scroll-mt-24 py-4 md:py-6"
      >
        <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
          <Shield className="h-5 w-5 text-[var(--arena-blue-bright)]" />
          <h2 className="text-xl font-bold text-[var(--arena-text)] md:text-2xl">
            Base Sepolia stake flow
          </h2>
        </div>
        <FeaturePanel {...features[4]!} />
        <p className="mt-3 text-center text-xs leading-relaxed text-[var(--arena-muted)]">
          Current public build uses testnet stake lock receipts to the treasury
          path. Escrow-based automated payouts are in development — not live
          yet. Local mock session unlock remains available as a preview fallback
          only. Not real-money wagering.
        </p>
      </section>
    </>
  );
}
