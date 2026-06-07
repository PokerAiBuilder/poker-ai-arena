"use client";

import type { LockSettlement } from "@/lib/stake/stakeSessionStorage";
import { getLockSettlementLabel } from "@/lib/onchain/baseSepolia";
import { cn } from "@/lib/utils";

const OVERVIEW_STEPS = [
  "Lock test stake",
  "Play hand",
  "Resolve result",
  "Claim payout",
] as const;

type ArenaMenuOverviewPanelProps = {
  lockSettlement?: LockSettlement;
  className?: string;
};

function sessionChip(label: string) {
  return (
    <span
      key={label}
      className="rounded-full border border-[var(--arena-cyan)]/18 bg-[var(--arena-blue)]/8 px-2 py-0.5 text-[9px] text-white/55"
    >
      {label}
    </span>
  );
}

export function ArenaMenuOverviewPanel({
  lockSettlement = "mock",
  className,
}: ArenaMenuOverviewPanelProps) {
  const settlementLabel = getLockSettlementLabel(lockSettlement);

  return (
    <div className={cn("space-y-2", className)}>
      <section className="arena-menu-card px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
          How it works
        </p>
        <ol className="mt-2 space-y-1.5">
          {OVERVIEW_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-2 text-[11px] leading-snug text-white/80"
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[var(--arena-cyan)]/30 bg-[var(--arena-blue)]/12 text-[9px] font-semibold tabular-nums text-[var(--arena-cyan)]">
                {index + 1}
              </span>
              <span className="pt-px">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="arena-menu-card px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
          Current session
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sessionChip(settlementLabel)}
          {sessionChip("Base Sepolia")}
          {sessionChip("Testnet only")}
          {sessionChip("No mainnet funds")}
        </div>
      </section>
    </div>
  );
}
