import { Map } from "lucide-react";
import { cn } from "@/lib/utils";

const milestones = [
  {
    version: "v1.1",
    label: "Base Sepolia stake lock",
    status: "current" as const,
    items: [
      "Wallet selector and Base Sepolia network",
      "Test stake tiers",
      "Confirmed tx receipt before chips",
      "Stake → chips flow",
    ],
  },
  {
    version: "v1.2",
    label: "Escrow contract + payout",
    status: "next" as const,
    items: [
      "Deposit stakes into contract",
      "Resolve sessions on-chain",
      "Claim and refund test payouts",
      "Replace temporary treasury path",
    ],
  },
  {
    version: "v1.3",
    label: "Smarter AI agents",
    status: "future" as const,
    items: [
      "Better bot logic and profiles",
      "Agent-vs-agent tournaments",
      "Explainable strategy upgrades",
      "Richer decision metadata",
    ],
  },
  {
    version: "v1.4",
    label: "Persistent arena",
    status: "future" as const,
    items: [
      "Durable shared hand history",
      "Spectator sessions",
      "Player stats and leaderboards",
      "Public replays",
    ],
  },
] as const;

const statusStyles = {
  current:
    "border-[var(--arena-cyan)]/50 bg-[var(--arena-blue)]/15 text-[var(--arena-cyan)]",
  next: "border-[var(--arena-blue-bright)]/40 bg-[var(--arena-surface-2)] text-[var(--arena-text)]",
  future: "border-[var(--arena-border)] bg-[var(--arena-bg)]/60 text-[var(--arena-muted)]",
};

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="v1-section mx-auto max-w-6xl scroll-mt-24 py-6 md:py-8"
    >
      <div className="mb-6 text-center">
        <div className="mb-2 flex justify-center">
          <Map className="h-5 w-5 text-[var(--arena-cyan)]" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--arena-cyan)]">
          Roadmap
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--arena-text)] md:text-3xl">
          From testnet stake lock to onchain arena
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--arena-muted)]">
          Base Sepolia stake lock is live today. Escrow payouts, smarter agents,
          and a persistent shared arena come next.
        </p>
      </div>

      <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {milestones.map(({ version, label, status, items }) => (
          <article
            key={version}
            className={cn(
              "v1-card v1-glow-border flex min-w-0 flex-col p-4 md:p-5",
              status === "current" && "ring-1 ring-[var(--arena-cyan)]/30",
            )}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={cn("v1-badge border", statusStyles[status])}>{version}</span>
              <span className="text-sm font-semibold text-[var(--arena-text)]">{label}</span>
            </div>
            <ul className="space-y-1.5 text-sm leading-relaxed text-[var(--arena-muted)]">
              {items.map((item) => (
                <li key={item} className="break-words">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
