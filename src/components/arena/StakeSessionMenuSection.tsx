"use client";

import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatTestStakeLabel,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { LockSettlement } from "@/lib/stake/stakeSessionStorage";
import { getLockSettlementLabel } from "@/lib/onchain/baseSepolia";
import { cn } from "@/lib/utils";

type StakeSessionMenuSectionProps = {
  sessionActive: boolean;
  cashedOut: boolean;
  currentHumanChips: number;
  stakeAmount?: TestStakeAmount | string;
  lockSettlement?: LockSettlement;
  handInProgress: boolean;
  cashingOut: boolean;
  payingStake?: boolean;
  escrowResolved?: boolean;
  onCashOut?: () => void | Promise<void>;
  className?: string;
};

export function StakeSessionMenuSection({
  sessionActive,
  cashedOut,
  currentHumanChips,
  stakeAmount,
  lockSettlement = "mock",
  handInProgress,
  cashingOut,
  payingStake = false,
  escrowResolved = false,
  onCashOut,
  className,
}: StakeSessionMenuSectionProps) {
  const isEscrow = lockSettlement === "escrow-deposit";
  const isTreasury = lockSettlement === "base-sepolia-test-tx";

  const canCashOut =
    sessionActive &&
    !handInProgress &&
    !cashingOut &&
    !payingStake &&
    (isEscrow ? true : currentHumanChips > 0);

  const claimLabel = isEscrow
    ? currentHumanChips <= 0
      ? "Close Session"
      : "Claim Payout"
    : isTreasury
      ? "Close Session"
      : "Mock cash out";

  const buttonLabel = cashingOut
    ? "Processing…"
    : handInProgress
      ? "Finish hand first"
      : claimLabel;

  const helperText = handInProgress
    ? "Cash-out unlocks after the hand ends."
    : isEscrow &&
        !escrowResolved &&
        currentHumanChips > 0 &&
        !handInProgress
      ? "Resolve result before claim"
      : null;

  return (
    <section
      className={cn("arena-menu-card p-3", className)}
      aria-label="Stake session"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
        Stake Session
      </p>

      {cashedOut ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Session complete.
        </p>
      ) : !sessionActive ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Lock stake to play.
        </p>
      ) : (
        <>
          <dl className="mt-2 space-y-1 text-[11px]">
            {stakeAmount ? (
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Stake</dt>
                <dd className="font-medium text-white">
                  {formatTestStakeLabel(String(stakeAmount))}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Current chips</dt>
              <dd className="font-semibold text-[var(--arena-cyan)]">
                {currentHumanChips.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Settlement</dt>
              <dd className="text-[var(--arena-cyan)]/90">
                {getLockSettlementLabel(lockSettlement)}
              </dd>
            </div>
          </dl>

          <div className="mt-3 flex flex-col items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              disabled={!canCashOut}
              className={cn(
                "min-w-[9.5rem] gap-2 text-xs",
                canCashOut
                  ? "border-[var(--arena-cyan)]/30 bg-[var(--arena-blue)]/10 text-[var(--arena-cyan)] hover:bg-[var(--arena-blue)]/18"
                  : "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/35 opacity-80 hover:bg-white/[0.03] hover:text-white/35",
              )}
              onClick={() => onCashOut?.()}
            >
              {cashingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {buttonLabel}
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5 shrink-0 opacity-80" />
                  {buttonLabel}
                </>
              )}
            </Button>
            {helperText ? (
              <p className="max-w-[14rem] text-center text-[10px] leading-snug text-muted-foreground">
                {helperText}
              </p>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
