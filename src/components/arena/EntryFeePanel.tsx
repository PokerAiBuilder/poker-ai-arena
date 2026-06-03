"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, Lock, ShieldCheck, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  X402PaymentRequest,
  X402PaymentResult,
} from "@/lib/bankr/x402Client";
import {
  getPaymentModeUserLabel,
  getUserNetworkLabel,
  formatDemoAccessAmountLabel,
} from "@/lib/bankr/x402Client";
import { cn } from "@/lib/utils";

type EntryFeePanelProps = {
  paymentResult: X402PaymentResult | null;
  onPayMock: () => Promise<void>;
  paying?: boolean;
  error?: string | null;
  /** Compact layout for poker-room sidebar */
  compact?: boolean;
  className?: string;
};

function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export function EntryFeePanel({
  paymentResult,
  onPayMock,
  paying = false,
  error,
  compact = false,
  className,
}: EntryFeePanelProps) {
  const [config, setConfig] = useState<X402PaymentRequest | null>(null);

  useEffect(() => {
    fetch("/api/x402/entry")
      .then((res) => res.json())
      .then((data: { config: X402PaymentRequest }) => setConfig(data.config))
      .catch(() => {
        setConfig({
          amount: "0.01",
          currency: "USDC",
          network: "base-sepolia",
          receiverAddress: "0x0000000000000000000000000000000000000000",
          description: "Poker AI Arena demo session access",
        });
      });
  }, []);

  const isUnlocked = paymentResult?.success === true;
  const amount = paymentResult?.amount ?? config?.amount ?? "0.01";
  const network = paymentResult?.network ?? config?.network ?? "base-sepolia";
  const hasReceiptDetails =
    Boolean(paymentResult?.receiptId) ||
    Boolean(paymentResult?.txHash) ||
    Boolean(paymentResult?.paidAt);

  return (
    <div
      className={cn(
        "v1-panel v1-glow-border shrink-0 overflow-hidden rounded-2xl shadow-lg",
        isUnlocked
          ? "border-[var(--arena-cyan)]/40 shadow-arena-cyan"
          : "border-[var(--arena-border)] shadow-arena-blue",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/5 px-3 py-2",
          isUnlocked ? "bg-[var(--arena-blue)]/10" : "bg-[var(--arena-surface-2)]/50",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {isUnlocked ? (
              <Unlock className="h-3.5 w-3.5 shrink-0 text-[var(--arena-cyan)]" />
            ) : (
              <Lock className="h-3.5 w-3.5 shrink-0 text-[var(--arena-blue-bright)]" />
            )}
            <h3 className="truncate text-xs font-semibold text-[var(--arena-text)]">
              {isUnlocked ? "Arena Unlocked" : "Demo Access"}
            </h3>
          </div>
          <Badge
            variant={isUnlocked ? "default" : "secondary"}
            className="shrink-0 text-[9px]"
          >
            {isUnlocked ? "Demo session active" : "Demo Mode"}
          </Badge>
        </div>
      </div>

      <div className={cn(compact ? "space-y-1.5 p-2" : "space-y-3 p-4", "text-xs")}>
        {!isUnlocked ? (
          <>
            {compact ? (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Start a demo session to play. Demo only — no real funds moved.
              </p>
            ) : (
              <p className="leading-relaxed text-muted-foreground">
                Start a demo session to play Human vs AI and Agent Battle. This
                unlocks the arena for the current browser session only — not
                real-money gambling.
              </p>
            )}

            <div
              className={cn(
                "rounded-xl border border-white/10 bg-black/30",
                compact ? "p-2.5" : "p-3",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Mock x402-style session unlock
              </p>
              <p
                className={cn(
                  "font-bold text-[var(--arena-cyan)]",
                  compact ? "mt-0.5 text-base" : "mt-1 text-xl",
                )}
              >
                {formatDemoAccessAmountLabel(amount)}
              </p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                Base testnet demo · {getUserNetworkLabel(network)} · Connect
                Wallet optional
              </p>
            </div>

            <Button
              onClick={onPayMock}
              disabled={paying}
              className="v1-button-primary w-full"
              size={compact ? "default" : "lg"}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting…
                </>
              ) : (
                "Start Demo Session"
              )}
            </Button>

            {compact ? (
              <p className="text-[9px] leading-relaxed text-amber-200/75">
                Demo only — no real funds moved.
              </p>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-[10px] leading-relaxed text-amber-200/80">
                  Mock demo unlock only — no real funds moved. Demo chips only;
                  not real-money gambling.
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
                <dt className="text-muted-foreground">Access</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-white">
                  {formatDemoAccessAmountLabel(amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Network</dt>
                <dd className="min-w-0 truncate text-right text-white">
                  {getUserNetworkLabel(network)}
                </dd>
              </div>
              <div className="flex justify-between gap-2 text-[11px]">
                <dt className="shrink-0 text-muted-foreground">Mode</dt>
                <dd className="min-w-0 truncate text-right text-[var(--arena-cyan)]">
                  {getPaymentModeUserLabel(paymentResult.mode)}
                </dd>
              </div>
            </dl>

            {hasReceiptDetails ? (
              <details className="shrink-0 rounded-lg border border-white/10 bg-black/20 text-[10px]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2 py-1.5 text-muted-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>Demo receipt details</span>
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
                  {paymentResult.txHash ? (
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <dt className="shrink-0 text-muted-foreground">Demo tx</dt>
                      <dd
                        className="min-w-0 max-w-[6.75rem] truncate text-right font-mono text-[9px] text-white/75"
                        title={paymentResult.txHash}
                      >
                        {truncateMiddle(paymentResult.txHash, 6, 4)}
                      </dd>
                    </div>
                  ) : null}
                  {paymentResult.paidAt ? (
                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <dt className="shrink-0 text-muted-foreground">Unlocked</dt>
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

            <p className="text-center text-[9px] leading-none text-emerald-400/75">
              No real funds moved.
            </p>
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
