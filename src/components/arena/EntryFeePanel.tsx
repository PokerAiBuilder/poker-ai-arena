"use client";

import { useAccount } from "wagmi";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Lock,
  ShieldCheck,
  Unlock,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TestStakePicker } from "@/components/arena/TestStakePicker";
import type { X402PaymentResult } from "@/lib/bankr/x402Client";
import { getPaymentModeUserLabel } from "@/lib/bankr/x402Client";
import {
  DEFAULT_TEST_STAKE,
  formatStakeToChipsLine,
  formatTestBalance,
  formatTestBalanceAmount,
  getTestStakeTier,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { isStakeSessionCashedOut } from "@/lib/stake/stakeSessionStorage";
import { cn } from "@/lib/utils";

type EntryFeePanelProps = {
  paymentResult: X402PaymentResult | null;
  stakeSessionMeta?: StakeSessionMeta | null;
  onPayMock: (stakeAmount: TestStakeAmount) => Promise<void>;
  onCashOut?: () => void | Promise<void>;
  paying?: boolean;
  cashingOut?: boolean;
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
  onPayMock,
  onCashOut,
  paying = false,
  cashingOut = false,
  error,
  selectedStake = DEFAULT_TEST_STAKE,
  onStakeChange,
  startingChips,
  currentHumanChips = 0,
  handInProgress = false,
  compact = false,
  className,
}: EntryFeePanelProps) {
  const { isConnected, address } = useAccount();

  const recipientWalletLabel = (wallet?: string) =>
    wallet
      ? truncateMiddle(wallet, 6, 4)
      : "Local preview / no wallet connected";

  const isCashedOut = isStakeSessionCashedOut(stakeSessionMeta);
  const isActive = !isCashedOut && paymentResult?.success === true;
  const cashOut = stakeSessionMeta?.cashOut;
  const stakeAmount =
    stakeSessionMeta?.stakeAmount ?? paymentResult?.amount ?? selectedStake;
  const tier = getTestStakeTier(stakeAmount);
  const resolvedStartingChips =
    startingChips ??
    stakeSessionMeta?.startingChips ??
    paymentResult?.chipAmount ??
    tier.chipAmount;

  const canCashOut =
    isActive &&
    currentHumanChips > 0 &&
    !handInProgress &&
    !cashingOut &&
    !paying;

  const lockingLabel = isConnected ? "Locking test stake…" : "Starting mock session…";

  const panelTone = isCashedOut
    ? "border-emerald-500/40 shadow-emerald-900/20"
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
            ? "bg-emerald-950/30"
            : isActive
              ? "bg-[var(--arena-blue)]/10"
              : "bg-[var(--arena-surface-2)]/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isCashedOut ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
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
              isCashedOut && "bg-emerald-600/80",
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
            <p className="text-[10px] leading-relaxed text-emerald-200/85">
              {cashOut.walletAddress
                ? "Test balance recorded for your connected wallet. No on-chain transfer yet — escrow payout will send testnet funds to the same wallet address."
                : "Test balance recorded locally — no wallet connected at cash-out. No on-chain transfer yet — connect wallet before your next session for escrow payout."}
            </p>
            <dl
              className={cn(
                "space-y-1 rounded-lg border border-emerald-500/25 bg-emerald-950/20",
                compact ? "p-2" : "p-2.5",
              )}
            >
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Chips cashed out</dt>
                <dd className="font-semibold text-white">
                  {cashOut.cashOutChips.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Test balance</dt>
                <dd className="font-semibold text-emerald-300">
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
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Mock withdrawal receipt</dt>
                <dd
                  className="max-w-[6.5rem] truncate font-mono text-[9px] text-white/80"
                  title={cashOut.mockWithdrawalId}
                >
                  {truncateMiddle(cashOut.mockWithdrawalId, 8, 6)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="text-white">Base Sepolia</dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Mock withdrawal recorded</dt>
                <dd className="text-emerald-300/90">Yes</dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">No on-chain transfer yet</dt>
                <dd className="text-white/80">Confirmed</dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Escrow payout target</dt>
                <dd className="text-right text-emerald-300/90">
                  {cashOut.walletAddress
                    ? "Connected wallet"
                    : "Connect wallet for next session"}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Cashed out</dt>
                <dd className="text-[9px] text-white/70">
                  {new Date(cashOut.cashedOutAt).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>
            <Button
              onClick={() => onPayMock(selectedStake)}
              disabled={paying}
              className="v1-button-primary w-full"
              size={compact ? "default" : "lg"}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting new session…
                </>
              ) : (
                "Start New Test Stake Session"
              )}
            </Button>
          </>
        ) : !isActive ? (
          <>
            {compact ? (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Stake converts to starting chips. Pay with test ETH on Base
                Sepolia — mock settlement for now.
              </p>
            ) : (
              <p className="leading-relaxed text-muted-foreground">
                Connect wallet → choose stake → lock test stake. Your stake
                becomes the Human vs AI chip stack for this session.
              </p>
            )}

            <TestStakePicker
              value={selectedStake}
              onChange={onStakeChange ?? (() => undefined)}
              disabled={paying || !onStakeChange}
              compact={compact}
            />

            <div
              className={cn(
                "rounded-xl border border-white/10 bg-black/30",
                compact ? "p-2.5" : "p-3",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Stake converts to chips
              </p>
              <p
                className={cn(
                  "font-bold text-[var(--arena-cyan)]",
                  compact ? "mt-0.5 text-base" : "mt-1 text-lg",
                )}
              >
                {formatStakeToChipsLine(selectedStake)}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                {tier.testPaymentLabel} on Base Sepolia · mock lock (no real
                transfer yet)
              </p>
            </div>

            <Button
              onClick={() => onPayMock(selectedStake)}
              disabled={paying}
              className="v1-button-primary w-full"
              size={compact ? "default" : "lg"}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lockingLabel}
                </>
              ) : isConnected ? (
                "Lock Test Stake"
              ) : (
                "Start Mock Test Session"
              )}
            </Button>

            {!isConnected ? (
              <p className="text-center text-[9px] leading-relaxed text-muted-foreground">
                Connect wallet for the primary testnet path · mock session works
                without wallet for local preview
              </p>
            ) : null}

            {compact ? (
              <p className="text-[9px] leading-relaxed text-amber-200/75">
                No mainnet funds · mock testnet only.
              </p>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-[10px] leading-relaxed text-amber-200/80">
                  Mock testnet stake only — no contracts, no real transfer.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <dl
              className={cn(
                "space-y-1 rounded-lg border border-white/10 bg-black/30",
                compact ? "p-2" : "p-2.5",
              )}
            >
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Selected stake</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-white">
                  {tier.usdLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Starting chips</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  {resolvedStartingChips.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Current chips</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-[var(--arena-cyan)]">
                  {currentHumanChips.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="text-muted-foreground">Est. test balance</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  {formatTestBalance(currentHumanChips)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Network</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  Base Sepolia
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Payment asset</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  {tier.testPaymentLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Settlement</dt>
                <dd className="min-w-0 truncate text-right text-[var(--arena-cyan)]">
                  {getPaymentModeUserLabel(paymentResult.mode)} · escrow next
                </dd>
              </div>
            </dl>

            <Button
              type="button"
              variant="outline"
              disabled={!canCashOut}
              className="w-full gap-2 border-white/15 text-[11px]"
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
              <p className="text-[9px] leading-relaxed text-amber-200/80">
                Finish the current hand before cashing out.
              </p>
            ) : currentHumanChips <= 0 ? (
              <p className="text-[9px] leading-relaxed text-muted-foreground">
                No chips left to cash out.
              </p>
            ) : isConnected ? (
              <p className="text-[9px] leading-relaxed text-muted-foreground">
                Cash out records your current test balance for the connected
                wallet. On-chain payout comes in the escrow phase.
                {address ? (
                  <>
                    {" "}
                    Payout target:{" "}
                    <span className="font-mono text-white/75">
                      {truncateMiddle(address, 6, 4)}
                    </span>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="text-[9px] leading-relaxed text-muted-foreground">
                Connect wallet to set your escrow payout target. Cash out still
                records your test balance locally — on-chain payout comes in the
                escrow phase.
              </p>
            )}

            {paymentResult.receiptId || paymentResult.txHash ? (
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
