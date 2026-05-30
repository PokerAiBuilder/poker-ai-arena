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
};

export function BankrStatusPanel({ className }: BankrStatusPanelProps) {
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
        "glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        className,
      )}
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold text-casino-goldLight">Bankr</h3>
          </div>
          <Badge variant="secondary">Integration layer ready</Badge>
        </div>
      </div>

      <div className="space-y-3 p-4 text-xs">
        <p className="leading-relaxed text-muted-foreground">
          Optional Web3 integration layer for future arena payments and agent
          skills. The poker demo runs fully without it.
        </p>

        <dl className="space-y-2">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd className={isDemo ? "text-amber-400" : "text-emerald-400"}>
              {isDemo ? "Demo" : "Configured"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Agent ID</dt>
            <dd className="font-mono text-white/80">
              {status?.agentId ?? "not configured"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Skills URL</dt>
            <dd className="text-white/80">
              {status?.skillsUrl === "configured" ? "configured" : "missing"}
            </dd>
          </div>
        </dl>

        <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] leading-relaxed text-amber-200/80">
          Demo layer only — no live Bankr API calls until credentials and
          official endpoints are configured.
        </p>

        <p className="rounded-lg border border-white/10 bg-black/30 p-2.5 text-[10px] leading-relaxed text-muted-foreground">
          x402-style access flow is mocked in this MVP. Technical network: Base
          Sepolia (Base testnet).
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
