"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import type { InsightsTab } from "@/components/arena/ArenaInsightsTabs";
import { ArenaInsightsTabs } from "@/components/arena/ArenaInsightsTabs";
import { BankrStatusPanel } from "@/components/arena/BankrStatusPanel";
import { DemoDisclaimers } from "@/components/arena/DemoDisclaimers";
import { DemoHelpPanel } from "@/components/arena/DemoHelpPanel";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry, SessionStats } from "@/lib/analytics/types";
import type { GameAction } from "@/lib/poker/types";
import type { X402PaymentMode } from "@/lib/bankr/x402Client";
import { cn } from "@/lib/utils";

type DrawerTab =
  | "guide"
  | InsightsTab
  | "integration"
  | "disclaimers";

type ArenaMenuDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLogEntries: GameAction[];
  leaderboardEntries: LeaderboardEntry[];
  highlightId?: string;
  sessionStats: SessionStats;
  sessionStatus: "locked" | "unlocked";
  paymentMode: X402PaymentMode | null;
  entryFee: string;
  onResetStats: () => void;
};

const drawerTabs: { id: DrawerTab; label: string }[] = [
  { id: "guide", label: "Demo Guide" },
  { id: "log", label: "Log" },
  { id: "leaderboard", label: "Board" },
  { id: "stats", label: "Stats" },
  { id: "integration", label: "Integration" },
  { id: "disclaimers", label: "Info" },
];

const insightsPanels = new Set<DrawerTab>(["log", "leaderboard", "stats"]);

export function ArenaMenuTrigger({
  onClick,
  className,
  compact = false,
}: {
  onClick: () => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      className={cn(
        "border-casino-gold/30 bg-black/40 text-casino-goldLight hover:bg-casino-gold/10",
        className,
      )}
      onClick={onClick}
    >
      <Menu className="h-4 w-4" />
      {compact ? "Menu" : "Arena Menu"}
    </Button>
  );
}

export function ArenaMenuDrawer({
  open,
  onOpenChange,
  actionLogEntries,
  leaderboardEntries,
  highlightId,
  sessionStats,
  sessionStatus,
  paymentMode,
  entryFee,
  onResetStats,
}: ArenaMenuDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("guide");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close arena menu"
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn(
          "relative flex h-full w-full max-w-md flex-col",
          "border-l border-casino-gold/20 bg-[#050508]/95 shadow-[-16px_0_48px_rgba(0,0,0,0.55)] backdrop-blur-xl",
          "animate-fade-in",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Arena menu"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-casino-goldLight/80">
              Arena Menu
            </p>
            <p className="text-xs text-muted-foreground">
              Demo guide, logs, stats & integration
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="border-b border-white/10 px-3 py-2">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {drawerTabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  tab === id
                    ? "bg-emerald-950/60 text-emerald-100 ring-1 ring-emerald-500/30"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white/80",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === "guide" ? (
            <div className="space-y-4">
              <DemoHelpPanel className="border-white/10 shadow-none" />
            </div>
          ) : null}

          {insightsPanels.has(tab) ? (
            <ArenaInsightsTabs
              panel={tab as InsightsTab}
              actionLogEntries={actionLogEntries}
              leaderboardEntries={leaderboardEntries}
              highlightId={highlightId}
              sessionStats={sessionStats}
              sessionStatus={sessionStatus}
              paymentMode={paymentMode}
              entryFee={entryFee}
              onResetStats={onResetStats}
            />
          ) : null}

          {tab === "integration" ? <BankrStatusPanel /> : null}

          {tab === "disclaimers" ? (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <DemoDisclaimers className="justify-start" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Session analytics and demo stacks are stored in localStorage on
                this device only.
              </p>
              <p className="text-[10px] leading-relaxed text-white/40">
                Built with Next.js · Base-ready · Bankr/x402 integration layer
                (x402-style access flow mocked in this MVP).
              </p>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
