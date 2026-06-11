"use client";

import { AlertTriangle, ExternalLink, Loader2, Wallet } from "lucide-react";
import { PUBLIC_TESTER_WRONG_NETWORK_MESSAGE } from "@/lib/arena/publicTesterUx";
import { Button } from "@/components/ui/button";
import {
  formatTestStakeLabel,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { EscrowPayoutUiInfo } from "@/lib/stake/escrowLiquidityPreview";
import type { LockSettlement, StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import {
  formatTxHash,
  getLockSettlementLabel,
  getShortAddress,
} from "@/lib/onchain/baseSepolia";
import { getEscrowTxUrl } from "@/lib/onchain/escrowContract";
import {
  resolveTestnetSessionLifecycle,
  LIFECYCLE_TITLE_NEW_SESSION,
} from "@/lib/stake/testnetSessionLifecycle";
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
  const escrowBusy = cashingOut || preparingEscrow || payingStake;

  const lifecycle = resolveTestnetSessionLifecycle({
    paymentSuccess,
    isWalletConnected,
    connectedWalletAddress,
    stakeSessionMeta,
    currentHumanChips,
    escrowPayoutUi,
    escrowResolved,
    handInProgress,
  });

  const showSessionDetails =
    sessionActive &&
    lifecycle.statusKey !== "wallet_disconnected" &&
    lifecycle.statusKey !== "wrong_wallet" &&
    lifecycle.statusKey !== "no_session";

  const canPrepare =
    lifecycle.showPreparePayout &&
    !escrowBusy &&
    escrowResolverConfigured !== false;

  const canCashOut = lifecycle.showClaimPayout && !escrowBusy;

  const canBeginNewStakeSession =
    lifecycle.showBeginNewStakeSession && !escrowBusy && Boolean(onBeginNewStakeSession);

  const claimLabel =
    lifecycle.statusKey === "payout_ready"
      ? "Claim payout"
      : lifecycle.statusKey === "claimed"
        ? "Cash out complete"
        : "Claim payout";

  const buttonLabel = cashingOut
    ? "Processing…"
    : preparingEscrow
      ? "Preparing…"
      : handInProgress
        ? "Finish hand first"
        : claimLabel;

  const helperText = handInProgress
    ? "Cash-out unlocks after the hand ends."
    : escrowResolverConfigured === false &&
        (lifecycle.statusKey === "prepare_payout" ||
          lifecycle.statusKey === "payout_ready")
      ? "Resolver not configured"
      : lifecycle.description;

  const cashOut = stakeSessionMeta?.cashOut;

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

      <div className="mt-2 space-y-1">
        <p className="text-[11px] font-medium text-white/90">{lifecycle.title}</p>
        <p className="text-[10px] leading-snug text-muted-foreground">
          {lifecycle.description}
        </p>
        {lifecycle.statusKey === "wrong_wallet" && stakeSessionMeta?.walletAddress ? (
          <p className="text-[10px] text-white/45">
            Session wallet: {getShortAddress(stakeSessionMeta.walletAddress)}
          </p>
        ) : null}
      </div>

      {lifecycle.statusKey === "claimed" && cashOut ? (
        <dl className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/20 p-2 text-[10px]">
          {cashOut.claimedEthAmount ? (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Claimed</dt>
              <dd className="font-semibold text-[var(--arena-cyan)]">
                {cashOut.claimedEthAmount} ETH
              </dd>
            </div>
          ) : null}
          {cashOut.claimTxHash ? (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Claim tx</dt>
              <dd className="min-w-0">
                <a
                  href={cashOut.claimExplorerUrl ?? getEscrowTxUrl(cashOut.claimTxHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[9px] text-[var(--arena-cyan)] hover:underline"
                >
                  {formatTxHash(cashOut.claimTxHash)}
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {showSessionDetails && !cashedOut ? (
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
                  "Prepare payout"
                )}
              </Button>
            ) : null}
            {lifecycle.showClaimPayout ? (
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
            ) : null}
            {helperText &&
            (lifecycle.showPreparePayout ||
              lifecycle.showClaimPayout ||
              lifecycle.showBeginNewStakeSession) ? (
              <p className="max-w-[14rem] text-center text-[10px] leading-snug text-muted-foreground">
                {helperText}
              </p>
            ) : null}
            {canBeginNewStakeSession ? (
              <Button
                type="button"
                className={cn(
                  "min-w-[9.5rem] gap-2 text-xs",
                  (lifecycle.statusKey === "no_chips_left" ||
                    lifecycle.statusKey === "claimed" ||
                    lifecycle.statusKey === "closed_ready_new") &&
                    "v1-button-primary",
                )}
                onClick={() => onBeginNewStakeSession?.()}
              >
                {LIFECYCLE_TITLE_NEW_SESSION}
              </Button>
            ) : null}
          </div>
        </>
      ) : lifecycle.statusKey === "claimed" && canBeginNewStakeSession ? (
        <div className="mt-3 flex justify-center">
          <Button
            type="button"
            className="v1-button-primary min-w-[9.5rem] gap-2 text-xs"
            onClick={() => onBeginNewStakeSession?.()}
          >
            {LIFECYCLE_TITLE_NEW_SESSION}
          </Button>
        </div>
      ) : lifecycle.statusKey === "no_session" ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Lock test stake to play.</p>
      ) : null}
    </section>
  );
}
