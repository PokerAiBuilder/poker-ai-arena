"use client";

import {
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Lock,
  Unlock,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestStakePicker } from "@/components/arena/TestStakePicker";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import type { X402PaymentResult } from "@/lib/bankr/x402Client";
import { useTestnetStakeNetwork } from "@/hooks/useTestnetStakeNetwork";
import {
  formatTxHash,
  getBaseSepoliaExplorerTxUrl,
  getLockSettlementLabel,
  getShortAddress,
} from "@/lib/onchain/baseSepolia";
import {
  getEscrowTxUrl,
  isEscrowDevMode,
} from "@/lib/onchain/escrowContract";
import type { EscrowCashOutPhase } from "@/lib/stake/escrowCashOutFlow";
import {
  DEFAULT_TEST_STAKE,
  formatStakeToChipsLine,
  formatTestBalanceAmount,
  getTestStakeTier,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { isStakeSessionCashedOut } from "@/lib/stake/stakeSessionStorage";
import {
  getLockStakePhaseLabel,
  type LockStakePhase,
} from "@/lib/stake/lockStakeFlow";
import { cn } from "@/lib/utils";

type EntryFeePanelProps = {
  paymentResult: X402PaymentResult | null;
  stakeSessionMeta?: StakeSessionMeta | null;
  onLockStake: (stakeAmount: TestStakeAmount) => Promise<void>;
  onPayMock: (stakeAmount: TestStakeAmount) => Promise<void>;
  onBeginNewStakeSession?: () => void;
  onCashOut?: () => void | Promise<void>;
  onResolveEscrow?: () => void | Promise<void>;
  payingLock?: boolean;
  payingMock?: boolean;
  lockStakePhase?: LockStakePhase;
  cashingOut?: boolean;
  resolvingEscrow?: boolean;
  escrowCashOutPhase?: EscrowCashOutPhase | null;
  error?: string | null;
  selectedStake?: TestStakeAmount;
  onStakeChange?: (stake: TestStakeAmount) => void;
  startingChips?: number;
  currentHumanChips?: number;
  handInProgress?: boolean;
  compact?: boolean;
  className?: string;
};

function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function EntryFeePanel({
  paymentResult,
  stakeSessionMeta = null,
  onLockStake,
  onPayMock,
  onBeginNewStakeSession,
  onCashOut,
  onResolveEscrow,
  payingLock = false,
  payingMock = false,
  lockStakePhase = "idle",
  cashingOut = false,
  resolvingEscrow = false,
  escrowCashOutPhase = null,
  error,
  selectedStake = DEFAULT_TEST_STAKE,
  onStakeChange,
  startingChips: _startingChips,
  currentHumanChips = 0,
  handInProgress = false,
  compact = false,
  className,
}: EntryFeePanelProps) {
  const {
    address,
    isConnected,
    onBaseSepolia,
    wrongNetwork,
    lockPathConfigured,
    canSendLockTx,
    switchToBaseSepolia,
    isSwitching,
  } = useTestnetStakeNetwork();

  const recipientWalletLabel = (wallet?: string) =>
    wallet
      ? getShortAddress(wallet)
      : "Local preview / no wallet connected";

  const lockTxHash =
    stakeSessionMeta?.lockTxHash ?? paymentResult?.txHash;
  const lockExplorerUrl =
    stakeSessionMeta?.explorerUrl ??
    (lockTxHash ? getBaseSepoliaExplorerTxUrl(lockTxHash) : undefined);
  const lockSettlement = stakeSessionMeta?.lockSettlement ?? "mock";
  const isEscrowDeposit = lockSettlement === "escrow-deposit";
  const isTreasuryLock = lockSettlement === "base-sepolia-test-tx";
  const isMockLock = lockSettlement === "mock";

  const isCashedOut = isStakeSessionCashedOut(stakeSessionMeta);
  const isActive = !isCashedOut && paymentResult?.success === true;
  const cashOut = stakeSessionMeta?.cashOut;
  const isEscrowClaimed =
    cashOut?.settlement === "escrow-claim" ||
    cashOut?.settlement === "escrow-zero-payout";
  const stakeAmount =
    stakeSessionMeta?.stakeAmount ?? paymentResult?.amount ?? selectedStake;
  const tier = getTestStakeTier(stakeAmount);

  const canCashOut =
    isActive &&
    !handInProgress &&
    !cashingOut &&
    !resolvingEscrow &&
    !payingLock &&
    !payingMock &&
    (isEscrowDeposit
      ? isConnected && onBaseSepolia
      : currentHumanChips > 0);

  const canCloseZeroEscrow =
    isEscrowDeposit &&
    isActive &&
    !handInProgress &&
    !cashingOut &&
    !resolvingEscrow &&
    currentHumanChips <= 0 &&
    isConnected &&
    onBaseSepolia;

  const showDevResolve =
    isEscrowDevMode() &&
    isEscrowDeposit &&
    isActive &&
    !stakeSessionMeta?.escrowResolved;

  const isPaying = payingLock || payingMock;
  const phaseLabel = getLockStakePhaseLabel(lockStakePhase);
  const phaseTone =
    lockStakePhase === "locked"
      ? "arena-status-success"
      : lockStakePhase === "rejected" || lockStakePhase === "failed"
        ? "border-red-500/30 bg-red-950/25 text-red-200/90"
        : "border-[var(--arena-cyan)]/30 bg-[var(--arena-blue)]/10 text-[var(--arena-cyan)]";

  const panelTone = isCashedOut
    ? "border-[var(--arena-cyan)]/35 shadow-[0_0_24px_rgba(34,211,238,0.08)]"
    : isActive
      ? "border-[var(--arena-cyan)]/40 shadow-arena-cyan"
      : "border-[var(--arena-border)] shadow-arena-blue";

  return (
    <div
      className={cn(
        "v1-panel v1-glow-border shrink-0 overflow-hidden rounded-2xl shadow-lg",
        panelTone,
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/5 px-3 py-2",
          isCashedOut
            ? "arena-status-success-bg"
            : isActive
              ? "bg-[var(--arena-blue)]/10"
              : "bg-[var(--arena-surface-2)]/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isCashedOut ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--arena-cyan)]" />
            ) : isActive ? (
              <Unlock className="h-3.5 w-3.5 shrink-0 text-[var(--arena-cyan)]" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--arena-blue-bright)]" />
            )}
            <h3 className="truncate text-xs font-semibold text-[var(--arena-text)]">
              {isCashedOut
                ? "Cash Out Complete"
                : isActive
                  ? "Stake → Chips Active"
                  : "Lock Test Stake"}
            </h3>
          </div>
          <Badge
            variant={isCashedOut ? "default" : isActive ? "default" : "secondary"}
            className={cn(
              "shrink-0 text-[9px]",
              isCashedOut && "arena-badge-pill-active border-[var(--arena-cyan)]/40 bg-[var(--arena-blue)]/20",
            )}
          >
            {isCashedOut
              ? "Cashed out"
              : isActive
                ? "Session active"
                : "Base Sepolia"}
          </Badge>
        </div>
      </div>

      <div className={cn(compact ? "space-y-1.5 p-2" : "space-y-3 p-4", "text-xs")}>
        {isCashedOut && cashOut ? (
          <>
            <p className="text-[10px] leading-relaxed text-[var(--arena-cyan)]/85">
              {cashOut.settlement === "escrow-claim"
                ? "Payout claimed."
                : cashOut.settlement === "escrow-zero-payout"
                  ? "Session closed."
                  : cashOut.settlement === "treasury-record"
                    ? "Session closed."
                    : "Mock session closed."}
            </p>
            <dl
              className={cn(
                "space-y-1 rounded-lg border border-[var(--arena-cyan)]/20 bg-[var(--arena-blue)]/10 arena-status-success",
                compact ? "p-2" : "p-2.5",
              )}
            >
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Chips</dt>
                <dd className="font-semibold text-white">
                  {cashOut.cashOutChips.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Test balance</dt>
                <dd className="font-semibold text-[var(--arena-cyan)]">
                  {formatTestBalanceAmount(cashOut.cashOutTestBalance)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Recipient wallet</dt>
                <dd
                  className="max-w-[6.5rem] truncate font-mono text-[9px] text-white/80"
                  title={cashOut.walletAddress ?? undefined}
                >
                  {recipientWalletLabel(cashOut.walletAddress)}
                </dd>
              </div>
              {isEscrowClaimed && stakeSessionMeta?.escrowSessionId ? (
                <div className="flex justify-between gap-2 text-[11px]">
                  <dt className="text-muted-foreground">Escrow session</dt>
                  <dd className="font-mono text-[9px] text-white/80">
                    #{stakeSessionMeta.escrowSessionId}
                  </dd>
                </div>
              ) : null}
              {cashOut.settlement === "mock withdrawal" && cashOut.mockWithdrawalId ? (
                <div className="flex justify-between gap-2 text-[11px]">
                  <dt className="text-muted-foreground">Receipt</dt>
                  <dd
                    className="max-w-[6.5rem] truncate font-mono text-[9px] text-white/80"
                    title={cashOut.mockWithdrawalId}
                  >
                    {truncateMiddle(cashOut.mockWithdrawalId, 8, 6)}
                  </dd>
                </div>
              ) : null}
              {cashOut.claimTxHash ? (
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <dt className="text-muted-foreground">Claim tx</dt>
                  <dd className="min-w-0">
                    <a
                      href={cashOut.claimExplorerUrl ?? getEscrowTxUrl(cashOut.claimTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 font-mono text-[9px] text-[var(--arena-cyan)] hover:underline"
                      title={cashOut.claimTxHash}
                    >
                      {formatTxHash(cashOut.claimTxHash)}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-70" />
                    </a>
                  </dd>
                </div>
              ) : null}
              {cashOut.claimedEthAmount ? (
                <div className="flex justify-between gap-2 text-[11px]">
                  <dt className="text-muted-foreground">Claimed</dt>
                  <dd className="font-semibold text-[var(--arena-cyan)]">
                    {cashOut.claimedEthAmount} ETH
                  </dd>
                </div>
              ) : null}
              {stakeSessionMeta?.claimStatus &&
              stakeSessionMeta.claimStatus !== "none" ? (
                <div className="flex justify-between gap-2 text-[11px]">
                  <dt className="text-muted-foreground">Claim status</dt>
                  <dd className="capitalize text-[var(--arena-cyan)]/90">
                    {stakeSessionMeta.claimStatus === "not-applicable"
                      ? "No payout"
                      : stakeSessionMeta.claimStatus}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Closed</dt>
                <dd className="text-[9px] text-white/70">
                  {new Date(cashOut.cashedOutAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>
            <Button
              onClick={() => onBeginNewStakeSession?.()}
              disabled={isPaying}
              className="v1-button-primary w-full"
              size={compact ? "default" : "lg"}
            >
              New Stake Session
            </Button>
          </>
        ) : !isActive ? (
          <>
            <p
              className={cn(
                "leading-relaxed text-muted-foreground",
                compact ? "text-[10px]" : "text-sm",
              )}
            >
              Choose stake. Confirm escrow deposit. Play with chips.
            </p>
            {!compact ? (
              <p className="text-[9px] text-muted-foreground">
                Base Sepolia testnet only · no mainnet funds
              </p>
            ) : null}

            {wrongNetwork ? (
              <div className="arena-panel-warn">
                <p>Switch to Base Sepolia to lock stake.</p>
              </div>
            ) : null}

            <TestStakePicker
              value={selectedStake}
              onChange={onStakeChange ?? (() => undefined)}
              disabled={isPaying || !onStakeChange}
              compact={compact}
            />

            <div
              className={cn(
                "rounded-xl border border-white/10 bg-black/30",
                compact ? "p-2.5" : "p-3",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Stake → chips
              </p>
              <p
                className={cn(
                  "font-bold text-[var(--arena-cyan)]",
                  compact ? "mt-0.5 text-base" : "mt-1 text-lg",
                )}
              >
                {formatStakeToChipsLine(selectedStake)}
              </p>
            </div>

            {wrongNetwork ? (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSwitching || isPaying}
                  className="w-full"
                  size={compact ? "default" : "lg"}
                  onClick={() => switchToBaseSepolia()}
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Switching network…
                    </>
                  ) : (
                    "Switch to Base Sepolia"
                  )}
                </Button>
                <Button
                  onClick={() => onPayMock(selectedStake)}
                  disabled={isPaying}
                  variant="secondary"
                  className="w-full"
                  size={compact ? "default" : "lg"}
                >
                  {payingMock ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting mock session…
                    </>
                  ) : (
                    "Mock session"
                  )}
                </Button>
              </div>
            ) : isConnected && onBaseSepolia ? (
              <div className="space-y-2">
                <Button
                  onClick={() => onLockStake(selectedStake)}
                  disabled={isPaying || !canSendLockTx}
                  className="v1-button-primary w-full"
                  size={compact ? "default" : "lg"}
                >
                  {payingLock ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {phaseLabel ?? "Locking test stake…"}
                    </>
                  ) : (
                    "Lock Test Stake"
                  )}
                </Button>
                <Button
                  onClick={() => onPayMock(selectedStake)}
                  disabled={isPaying}
                  variant="secondary"
                  className="w-full"
                  size={compact ? "default" : "lg"}
                >
                  {payingMock ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting mock session…
                    </>
                  ) : (
                    "Mock session"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <ConnectWalletButton
                  size={compact ? "default" : "lg"}
                  showDemoHint={false}
                  className="v1-button-primary w-full"
                />
                <Button
                  onClick={() => onPayMock(selectedStake)}
                  disabled={isPaying}
                  variant="secondary"
                  className="w-full"
                  size={compact ? "default" : "lg"}
                >
                  {payingMock ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting mock session…
                    </>
                  ) : (
                    "Mock session"
                  )}
                </Button>
              </div>
            )}

            {isConnected && onBaseSepolia && !lockPathConfigured ? (
              <p className="text-[9px] leading-relaxed text-amber-200/85">
                On-chain lock unavailable. Use mock session.
              </p>
            ) : null}

            {phaseLabel && lockStakePhase !== "idle" ? (
              <p
                className={cn(
                  "rounded-lg border px-2.5 py-2 text-[10px] leading-relaxed",
                  phaseTone,
                )}
              >
                {phaseLabel}
              </p>
            ) : null}

            <details className="arena-details-muted rounded-lg border border-white/5 bg-black/15 px-2.5 py-2">
              <summary>Details</summary>
              <div className="mt-2 space-y-1.5 text-[9px] leading-relaxed text-muted-foreground">
                <p>Base Sepolia testnet only · no mainnet funds</p>
                {!canSendLockTx ? <p>Mock session · local preview only</p> : null}
              </div>
            </details>
          </>
        ) : (
          <>
            <dl
              className={cn(
                "space-y-1.5 rounded-lg border border-white/10 bg-black/30",
                compact ? "p-2" : "p-3",
              )}
            >
              <div className="flex justify-between gap-3 text-[11px]">
                <dt className="text-muted-foreground">Stake</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-white">
                  {tier.usdLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-[11px]">
                <dt className="text-muted-foreground">Chips</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-[var(--arena-cyan)]">
                  {currentHumanChips.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-3 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Settlement</dt>
                <dd className="min-w-0 truncate text-right text-[var(--arena-cyan)]">
                  {getLockSettlementLabel(lockSettlement)}
                </dd>
              </div>
              {lockTxHash ? (
                <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2 text-[11px]">
                  <dt className="shrink-0 text-muted-foreground">
                    {isEscrowDeposit ? "Deposit tx" : "Lock tx"}
                  </dt>
                  <dd className="min-w-0">
                    {lockExplorerUrl ? (
                      <a
                        href={lockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[var(--arena-cyan)]/25 bg-[var(--arena-cyan)]/5 px-2 py-1 font-mono text-[10px] text-[var(--arena-cyan)] hover:bg-[var(--arena-cyan)]/10"
                        title={lockTxHash}
                      >
                        <span className="truncate">{formatTxHash(lockTxHash)}</span>
                        <span className="shrink-0 font-sans text-[9px] font-medium uppercase tracking-wide">
                          View
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-80" />
                      </a>
                    ) : (
                      <span
                        className="font-mono text-[10px] text-white/75"
                        title={lockTxHash}
                      >
                        {formatTxHash(lockTxHash)}
                      </span>
                    )}
                  </dd>
                </div>
              ) : null}
              {isEscrowDeposit && stakeSessionMeta?.escrowSessionId ? (
                <div className="flex justify-between gap-3 text-[11px]">
                  <dt className="shrink-0 text-muted-foreground">Escrow session</dt>
                  <dd className="min-w-0 truncate text-right font-mono text-white/85">
                    #{stakeSessionMeta.escrowSessionId}
                  </dd>
                </div>
              ) : null}
              {stakeSessionMeta?.lockTxStatus &&
              stakeSessionMeta.lockTxStatus !== "mock" ? (
                <div className="flex justify-between gap-3 text-[11px]">
                  <dt className="shrink-0 text-muted-foreground">Status</dt>
                  <dd className="min-w-0 truncate text-right capitalize text-[var(--arena-cyan)]/90">
                    {stakeSessionMeta.lockTxStatus}
                  </dd>
                </div>
              ) : null}
            </dl>

            <p className="text-[9px] leading-relaxed text-muted-foreground">
              {isTreasuryLock
                ? "Treasury fallback · automated payout unavailable"
                : isEscrowDeposit
                  ? "Stake is held in escrow until result resolution."
                  : "Mock session · local preview only"}
            </p>

            {isEscrowDeposit ? (
              <div className="arena-panel-info">
                <p className="leading-relaxed opacity-90">
                  Resolve result, then claim payout.
                </p>
                {showDevResolve && !stakeSessionMeta?.escrowResolved ? (
                  <p className="mt-1 text-[9px] opacity-80">
                    Dev resolve required in this build.
                  </p>
                ) : null}
                {stakeSessionMeta?.escrowResolveTxHash ? (
                  <p className="mt-1 font-mono text-[9px] opacity-80">
                    Resolve tx:{" "}
                    <a
                      href={getEscrowTxUrl(stakeSessionMeta.escrowResolveTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--arena-cyan)] hover:underline"
                    >
                      {formatTxHash(stakeSessionMeta.escrowResolveTxHash)}
                    </a>
                  </p>
                ) : null}
                {showDevResolve ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resolvingEscrow || handInProgress || !isConnected}
                    className="mt-2 h-7 w-full border-[var(--arena-cyan)]/30 text-[10px] text-[var(--arena-cyan)]"
                    onClick={() => onResolveEscrow?.()}
                  >
                    {resolvingEscrow ? (
                      <>
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        Resolving…
                      </>
                    ) : (
                      "Resolve Session"
                    )}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <Button
              type="button"
              variant="outline"
              disabled={!canCashOut && !canCloseZeroEscrow}
              className="w-full gap-2 border-white/15 text-[11px]"
              onClick={() => onCashOut?.()}
            >
              {cashingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {escrowCashOutPhase === "resolving"
                    ? "Resolving escrow…"
                    : escrowCashOutPhase === "claiming"
                      ? "Claiming payout…"
                      : isEscrowDeposit
                        ? "Processing escrow cash-out…"
                        : "Cashing out…"}
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  {isMockLock
                    ? "Mock cash out"
                    : isTreasuryLock
                      ? "Close Session"
                      : currentHumanChips <= 0
                        ? "Close Session"
                        : "Claim Payout"}
                </>
              )}
            </Button>
            {handInProgress ? (
              <p className="text-[9px] leading-relaxed text-amber-200/80">
                Finish the hand first.
              </p>
            ) : isEscrowDeposit && !isConnected ? (
              <p className="text-[9px] leading-relaxed text-muted-foreground">
                Connect wallet to claim payout.
              </p>
            ) : null}

            {currentHumanChips <= 0 && !handInProgress && !cashingOut ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isPaying}
                className="w-full text-[11px]"
                onClick={() => onBeginNewStakeSession?.()}
              >
                New Stake Session
              </Button>
            ) : null}

            {(paymentResult.receiptId || lockTxHash) &&
            lockSettlement === "mock" ? (
              <details className="shrink-0 rounded-lg border border-white/10 bg-black/20 text-[10px]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>Stake lock receipt (mock)</span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
                </summary>
                <dl className="max-h-14 space-y-0.5 overflow-y-auto overscroll-contain border-t border-white/5 px-2 py-1.5">
                  {paymentResult.receiptId ? (
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <dt className="shrink-0 text-muted-foreground">Receipt</dt>
                      <dd
                        className="min-w-0 max-w-[6.75rem] truncate text-right font-mono text-[9px] text-white/75"
                        title={paymentResult.receiptId}
                      >
                        {truncateMiddle(paymentResult.receiptId, 6, 4)}
                      </dd>
                    </div>
                  ) : null}
                  {paymentResult.paidAt ? (
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <dt className="shrink-0 text-muted-foreground">Locked</dt>
                      <dd className="min-w-0 truncate text-right text-[9px] text-white/70">
                        {new Date(paymentResult.paidAt).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </details>
            ) : null}
          </>
        )}

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-[10px] text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
