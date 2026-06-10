"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import type { LockSettlement } from "@/lib/stake/stakeSessionStorage";
import { getLockSettlementLabel } from "@/lib/onchain/baseSepolia";
import {
  PUBLIC_TESTER_DISCLAIMER_ITEMS,
  PUBLIC_TESTER_HOW_TO_STEPS,
  PUBLIC_TESTER_LINKS,
  PUBLIC_TESTER_MOBILE_NOTE,
  PUBLIC_TESTER_WALLET_NOTES,
  PUBLIC_TESTER_WRONG_NETWORK_MESSAGE,
} from "@/lib/arena/publicTesterUx";
import { cn } from "@/lib/utils";

type ArenaMenuOverviewPanelProps = {
  lockSettlement?: LockSettlement;
  wrongNetwork?: boolean;
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
  wrongNetwork = false,
  className,
}: ArenaMenuOverviewPanelProps) {
  const settlementLabel = getLockSettlementLabel(lockSettlement);

  return (
    <div className={cn("space-y-2", className)}>
      {wrongNetwork ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/90" />
          <p className="text-[10px] leading-snug text-amber-100/90">
            {PUBLIC_TESTER_WRONG_NETWORK_MESSAGE}
          </p>
        </div>
      ) : null}

      <section className="arena-menu-card px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
          How to test
        </p>
        <ol className="mt-2 space-y-1.5">
          {PUBLIC_TESTER_HOW_TO_STEPS.map((step, index) => (
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
          Helpful links
        </p>
        <ul className="mt-1.5 space-y-1">
          {PUBLIC_TESTER_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[var(--arena-cyan)]/90 underline-offset-2 hover:underline"
              >
                {link.label}
                <ExternalLink className="h-2.5 w-2.5 opacity-70" />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="arena-menu-card px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
          Wallet note
        </p>
        <ul className="mt-1.5 space-y-1">
          {PUBLIC_TESTER_WALLET_NOTES.map((note) => (
            <li key={note} className="text-[10px] leading-snug text-white/55">
              {note}
            </li>
          ))}
        </ul>
      </section>

      <section className="arena-menu-card px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
          Testnet disclaimer
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {PUBLIC_TESTER_DISCLAIMER_ITEMS.map((item) => sessionChip(item))}
        </div>
      </section>

      <p className="px-0.5 text-[9px] leading-snug text-white/40">
        {PUBLIC_TESTER_MOBILE_NOTE}
      </p>

      <section className="arena-menu-card px-3 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
          Current session
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {sessionChip(settlementLabel)}
          {sessionChip("Base Sepolia")}
        </div>
      </section>
    </div>
  );
}
