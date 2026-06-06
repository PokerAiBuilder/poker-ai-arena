"use client";

import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatTestBalance,
  formatTestStakeLabel,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import { cn } from "@/lib/utils";

type StakeSessionMenuSectionProps = {
  sessionActive: boolean;
  cashedOut: boolean;
  currentHumanChips: number;
  startingChips: number;
  stakeAmount?: TestStakeAmount | string;
  handInProgress: boolean;
  cashingOut: boolean;
  payingStake?: boolean;
  onCashOut?: () => void | Promise<void>;
  className?: string;
};

export function StakeSessionMenuSection({
  sessionActive,
  cashedOut,
  currentHumanChips,
  startingChips,
  stakeAmount,
  handInProgress,
  cashingOut,
  payingStake = false,
  onCashOut,
  className,
}: StakeSessionMenuSectionProps) {
  const canCashOut =
    sessionActive &&
    currentHumanChips > 0 &&
    !handInProgress &&
    !cashingOut &&
    !payingStake;

  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface-2)]/60 p-3",
        className,
      )}
      aria-label="Stake session"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--arena-cyan)]">
        Stake Session
      </p>

      {cashedOut ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Previous session cashed out. Choose a new test stake from the table
          overlay or lock panel on desktop.
        </p>
      ) : !sessionActive ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Lock a test stake to play Human vs AI. Use the table overlay to choose
          stake and lock or start a mock session.
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
              <dt className="text-muted-foreground">Starting chips</dt>
              <dd className="text-white">{startingChips.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Current chips</dt>
              <dd className="font-semibold text-[var(--arena-cyan)]">
                {currentHumanChips.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Est. test balance</dt>
              <dd className="text-white">{formatTestBalance(currentHumanChips)}</dd>
            </div>
          </dl>

          <Button
            type="button"
            variant="outline"
            disabled={!canCashOut}
            className="mt-3 w-full gap-2 border-white/15 text-xs"
            onClick={() => onCashOut?.()}
          >
            {cashingOut ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Cashing out…
              </>
            ) : (
              <>
                <Wallet className="h-3.5 w-3.5 shrink-0" />
                Cash Out Test Balance To Wallet
              </>
            )}
          </Button>

          {handInProgress ? (
            <p className="mt-2 text-[10px] leading-relaxed text-amber-200/85">
              Finish the current hand before cashing out.
            </p>
          ) : currentHumanChips <= 0 ? (
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              No chips left to cash out.
            </p>
          ) : (
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Cash out records your current test balance. Escrow payout comes
              next.
            </p>
          )}
        </>
      )}
    </section>
  );
}
