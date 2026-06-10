"use client";

import { AlertTriangle, Loader2, Wallet } from "lucide-react";
import { PUBLIC_TESTER_WRONG_NETWORK_MESSAGE } from "@/lib/arena/publicTesterUx";
import { Button } from "@/components/ui/button";
import {
  formatTestStakeLabel,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { EscrowPayoutUiInfo } from "@/lib/stake/escrowLiquidityPreview";
import {
  isDepletedZeroPayoutEscrowSession,
  shouldRequireEscrowPrepareClaim,
} from "@/lib/stake/depletedEscrowSession";
import type { LockSettlement, StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { getLockSettlementLabel, getShortAddress } from "@/lib/onchain/baseSepolia";
import {
  shouldShowWalletDisconnectedEscrowState,
  shouldShowWalletMismatchEscrowState,
  WALLET_DISCONNECTED_BODY,
  WALLET_DISCONNECTED_TITLE,
  WALLET_MISMATCH_BODY,
} from "@/lib/stake/walletSessionAccess";
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
  preparingEscrow?: boolean;
  escrowResolverConfigured?: boolean | null;
  escrowPayoutUi?: EscrowPayoutUiInfo | null;
  stakeSessionMeta?: StakeSessionMeta | null;
  onPrepareEscrowPayout?: () => void | Promise<void>;
  onCashOut?: () => void | Promise<void>;
  onBeginNewStakeSession?: () => void;
  isWalletConnected?: boolean;
  connectedWalletAddress?: string;
  paymentSuccess?: boolean;
  wrongNetwork?: boolean;
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
  preparingEscrow = false,
  escrowResolverConfigured = null,
  escrowPayoutUi = null,
  stakeSessionMeta = null,
  onPrepareEscrowPayout,
  onCashOut,
  onBeginNewStakeSession,
  isWalletConnected = false,
  connectedWalletAddress,
  paymentSuccess = false,
  wrongNetwork = false,
  className,
}: StakeSessionMenuSectionProps) {
  const isEscrow = lockSettlement === "escrow-deposit";
  const showWalletDisconnectedEscrow = shouldShowWalletDisconnectedEscrowState(
    stakeSessionMeta,
    paymentSuccess,
    isWalletConnected,
  );
  const showWalletMismatchEscrow = shouldShowWalletMismatchEscrowState(
    stakeSessionMeta,
    paymentSuccess,
    isWalletConnected,
    connectedWalletAddress,
  );
  const escrowSessionVisible =
    sessionActive && !showWalletDisconnectedEscrow && !showWalletMismatchEscrow;
  const isTreasury = lockSettlement === "base-sepolia-test-tx";

  const escrowBusy = cashingOut || preparingEscrow || payingStake;

  const isDepletedZeroPayout = isDepletedZeroPayoutEscrowSession(
    stakeSessionMeta,
    currentHumanChips,
    escrowPayoutUi,
  );

  const requiresEscrowPrepareClaim = shouldRequireEscrowPrepareClaim(
    stakeSessionMeta,
    currentHumanChips,
    escrowPayoutUi,
  );

  const canPrepare =
    isEscrow &&
    escrowSessionVisible &&
    requiresEscrowPrepareClaim &&
    !escrowResolved &&
    !handInProgress &&
    !escrowBusy &&
    escrowResolverConfigured !== false;

  const canCashOut =
    escrowSessionVisible &&
    !handInProgress &&
    !escrowBusy &&
    !isDepletedZeroPayout &&
    (isEscrow ? escrowResolved && requiresEscrowPrepareClaim : currentHumanChips > 0);

  const canBeginNewStakeSession =
    escrowSessionVisible &&
    !handInProgress &&
    !escrowBusy &&
    (isDepletedZeroPayout ||
      (!isEscrow && currentHumanChips <= 0));

  const claimLabel = isEscrow
    ? currentHumanChips <= 0
      ? "Cash Out Complete"
      : "Claim Payout"
    : isTreasury
      ? "Close Session"
      : "Mock cash out";

  const buttonLabel = cashingOut
    ? "Processing…"
    : preparingEscrow
      ? "Preparing…"
      : handInProgress
        ? "Finish hand first"
        : claimLabel;

  const helperText = handInProgress
    ? "Cash-out unlocks after the hand ends."
    : isDepletedZeroPayout
      ? "No payout available. Start a new test stake session."
      : isEscrow && requiresEscrowPrepareClaim && !escrowResolved && !handInProgress
        ? escrowResolverConfigured === false
          ? "Resolver not configured"
          : "Prepare payout first"
        : null;

  return (
    <section
      className={cn("arena-menu-card p-3", className)}
      aria-label="Stake session"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
        Stake Session
      </p>

      {wrongNetwork ? (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/8 px-2 py-1.5">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-300/85" />
          <p className="text-[10px] leading-snug text-amber-100/85">
            {PUBLIC_TESTER_WRONG_NETWORK_MESSAGE}
          </p>
        </div>
      ) : null}

      {cashedOut ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Session complete.
        </p>
      ) : showWalletDisconnectedEscrow ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-[11px] font-medium text-white/85">
            {WALLET_DISCONNECTED_TITLE}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {WALLET_DISCONNECTED_BODY}
          </p>
        </div>
      ) : showWalletMismatchEscrow ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-[11px] font-medium text-white/85">Wallet mismatch</p>
          <p className="text-[11px] text-muted-foreground">{WALLET_MISMATCH_BODY}</p>
          {stakeSessionMeta?.walletAddress ? (
            <p className="text-[10px] text-white/45">
              Session wallet: {getShortAddress(stakeSessionMeta.walletAddress)}
            </p>
          ) : null}
        </div>
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

          {isEscrow && escrowPayoutUi ? (
            <dl className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/20 p-2 text-[10px]">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Expected payout</dt>
                <dd className="font-medium text-white">
                  {escrowPayoutUi.expectedPayoutEth} ETH
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Claimable payout</dt>
                <dd className="font-semibold text-[var(--arena-cyan)]">
                  {escrowPayoutUi.claimablePayoutEth} ETH
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Escrow liquidity</dt>
                <dd className="text-white/80">
                  {escrowPayoutUi.escrowLiquidityEth} ETH
                </dd>
              </div>
            </dl>
          ) : null}

          {isEscrow && escrowPayoutUi?.wasPayoutCapped ? (
            <p className="mt-2 text-[10px] leading-snug text-amber-200/85">
              Payout capped by escrow liquidity.
            </p>
          ) : null}

          <div className="mt-3 flex flex-col items-center gap-1.5">
            {canPrepare ? (
              <Button
                type="button"
                variant="outline"
                disabled={!canPrepare}
                className="min-w-[9.5rem] gap-2 border-[var(--arena-cyan)]/30 text-xs text-[var(--arena-cyan)]"
                onClick={() => onPrepareEscrowPayout?.()}
              >
                {preparingEscrow ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Preparing…
                  </>
                ) : (
                  "Prepare Payout"
                )}
              </Button>
            ) : null}
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
            {canBeginNewStakeSession ? (
              <Button
                type="button"
                className={cn(
                  "min-w-[9.5rem] gap-2 text-xs",
                  isDepletedZeroPayout && "v1-button-primary",
                )}
                disabled={!onBeginNewStakeSession}
                onClick={() => onBeginNewStakeSession?.()}
              >
                New Stake Session
              </Button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
