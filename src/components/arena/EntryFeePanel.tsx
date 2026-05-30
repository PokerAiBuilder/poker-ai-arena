"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, ShieldCheck, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  X402PaymentRequest,
  X402PaymentResult,
} from "@/lib/bankr/x402Client";
import { getNetworkLabel } from "@/lib/bankr/x402Client";
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
          description: "Poker AI Arena session entry fee (demo access)",
        });
      });
  }, []);

  const isUnlocked = paymentResult?.success === true;
  const amount = paymentResult?.amount ?? config?.amount ?? "0.01";
  const network = paymentResult?.network ?? config?.network ?? "base-sepolia";

  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-2xl border shadow-lg",
        isUnlocked
          ? "border-emerald-500/30 shadow-[0_0_32px_rgba(16,185,129,0.1)]"
          : "border-casino-gold/30 shadow-glow",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/5 px-4 py-3",
          isUnlocked ? "bg-emerald-500/5" : "bg-casino-gold/5",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <Unlock className="h-4 w-4 text-emerald-400" />
            ) : (
              <Lock className="h-4 w-4 text-casino-gold" />
            )}
            <h3 className="text-sm font-semibold text-casino-goldLight">
              {isUnlocked ? "Arena Unlocked" : "Unlock Poker AI Arena"}
            </h3>
          </div>
          <Badge variant={isUnlocked ? "default" : "secondary"}>
            {isUnlocked ? "Ready to play" : "Dev mode"}
          </Badge>
        </div>
      </div>

      <div className={cn(compact ? "space-y-2 p-3" : "space-y-3 p-4", "text-xs")}>
        {!isUnlocked ? (
          <>
            {compact ? (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Mock x402 demo unlock — no real funds moved.
              </p>
            ) : (
              <p className="leading-relaxed text-muted-foreground">
                Pay a small USDC entry fee to launch an AI poker session. This is a
                demo access fee — not real-money gambling settlement.
              </p>
            )}

            <div
              className={cn(
                "rounded-xl border border-white/10 bg-black/30",
                compact ? "p-2.5" : "p-3",
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Entry fee
              </p>
              <p
                className={cn(
                  "font-bold text-casino-goldLight",
                  compact ? "mt-0.5 text-lg" : "mt-1 text-2xl",
                )}
              >
                {amount} USDC
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Network: {getNetworkLabel(network)}
              </p>
            </div>

            <Button
              onClick={onPayMock}
              disabled={paying}
              className="w-full shadow-glow"
              size={compact ? "default" : "lg"}
            >
              {paying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Mock Pay Entry Fee"
              )}
            </Button>

            {compact ? (
              <p className="text-[9px] leading-relaxed text-amber-200/75">
                Demo payment only — no real funds moved.
              </p>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-[10px] leading-relaxed text-amber-200/80">
                  Mock payment only. No real funds are moved. Real x402 mode is not
                  implemented yet.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="font-medium text-emerald-400">
              {compact ? "Session active" : "Session access granted"}
            </p>

            {!compact ? (
            <dl className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-semibold text-white">{amount} USDC</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Network</dt>
                <dd className="text-white">{getNetworkLabel(network)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Mode</dt>
                <dd className="uppercase text-casino-goldLight">
                  {paymentResult.mode}
                </dd>
              </div>
              {paymentResult.receiptId ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Receipt</dt>
                  <dd className="truncate font-mono text-[10px] text-white/80">
                    {paymentResult.receiptId}
                  </dd>
                </div>
              ) : null}
              {paymentResult.txHash ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Tx hash</dt>
                  <dd className="truncate font-mono text-[10px] text-white/80">
                    {paymentResult.txHash}
                  </dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Paid at</dt>
                <dd className="text-white/80">
                  {new Date(paymentResult.paidAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            ) : null}

            <p className="text-center text-[10px] leading-relaxed text-emerald-400/80">
              {compact
                ? "Ready — use Play Step Demo below."
                : "Ready to play — start with Step Demo below, then try full-hand or Agent Battle."}
            </p>
          </>
        )}

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
