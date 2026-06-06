"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BankrStatusData = {
  configured: boolean;
  environment: string;
  agentId: string | null;
  skillsUrl: "configured" | "missing";
  mode: "mock" | "configured";
  note: string;
};

type BankrStatusPanelProps = {
  className?: string;
  embedded?: boolean;
};

export function BankrStatusPanel({ className, embedded = false }: BankrStatusPanelProps) {
  const [status, setStatus] = useState<BankrStatusData | null>(null);

  useEffect(() => {
    fetch("/api/bankr/status")
      .then((res) => res.json())
      .then((statusData) => {
        setStatus(statusData as BankrStatusData);
      })
      .catch(() => {
        setStatus(null);
      });
  }, []);

  const isDemo = status?.mode !== "configured";

  return (
    <div
      className={cn(
        "glass-panel min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        embedded && "shadow-none",
        className,
      )}
    >
      <div className="border-b border-white/5 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Bot className="h-4 w-4 shrink-0 text-violet-400" />
            <h3 className="text-sm font-semibold text-casino-goldLight">Bankr</h3>
          </div>
          <Badge variant="secondary" className="max-w-full shrink text-[10px]">
            Integration layer ready
          </Badge>
        </div>
      </div>

      <div className="min-w-0 space-y-3 p-3 text-xs sm:p-4">
        <p className="break-words leading-relaxed text-muted-foreground">
          Bankr/x402-ready layer for future production settlement. Current flow is
          a testnet/mock stake session — the arena runs without live Bankr calls.
        </p>

        <dl className="min-w-0 space-y-2">
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">Status</dt>
            <dd className={cn("break-words text-right", isDemo ? "text-amber-400" : "text-emerald-400")}>
              {isDemo ? "Demo" : "Configured"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">Agent ID</dt>
            <dd className="break-all text-right font-mono text-white/80">
              {status?.agentId ?? "not configured"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">Skills URL</dt>
            <dd className="break-words text-right text-white/80">
              {status?.skillsUrl === "configured" ? "configured" : "missing"}
            </dd>
          </div>
        </dl>

        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] leading-relaxed text-amber-200/80">
          Not live for staking — no Bankr API calls until credentials and
          official endpoints are configured.
        </p>

        <p className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
          Current flow: testnet/mock stake session. Bankr/x402 production
          settlement is prepared for a later phase. Network: Base Sepolia
          (testnet only).
        </p>

        {status?.note ? (
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {status.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
