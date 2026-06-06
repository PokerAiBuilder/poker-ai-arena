"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { ActionLog } from "@/components/arena/ActionLog";
import { Leaderboard } from "@/components/arena/Leaderboard";
import { TableStats } from "@/components/arena/TableStats";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry, SessionStats } from "@/lib/analytics/types";
import type { GameAction } from "@/lib/poker/types";
import type { X402PaymentMode } from "@/lib/bankr/x402Client";
import { cn } from "@/lib/utils";

export type InsightsTab = "log" | "leaderboard" | "stats";

type ArenaInsightsTabsProps = {
  actionLogEntries: GameAction[];
  agentBattleMode?: boolean;
  leaderboardEntries: LeaderboardEntry[];
  highlightId?: string;
  sessionStats: SessionStats;
  sessionStatus: "locked" | "unlocked";
  paymentMode: X402PaymentMode | null;
  entryFee: string;
  onResetStats: () => void;
  className?: string;
  /** When set, hides the tab bar and renders a single panel (for menu drawer). */
  panel?: InsightsTab;
  /** Drawer layout — parent scrolls, no nested max-height clipping */
  embedded?: boolean;
};

const tabLabels: Record<InsightsTab, string> = {
  log: "Action Log",
  leaderboard: "Leaderboard",
  stats: "Session Stats",
};

export function ArenaInsightsTabs({
  actionLogEntries,
  agentBattleMode = false,
  leaderboardEntries,
  highlightId,
  sessionStats,
  sessionStatus,
  paymentMode,
  entryFee,
  onResetStats,
  className,
  panel,
  embedded = false,
}: ArenaInsightsTabsProps) {
  const [tab, setTab] = useState<InsightsTab>("log");
  const activeTab = panel ?? tab;

  return (
    <div className={cn("space-y-2", className)}>
      {panel == null ? (
        <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
          {(Object.keys(tabLabels) as InsightsTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 rounded-lg px-2 py-2 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:text-[11px]",
                tab === key
                  ? "bg-white/10 text-casino-goldLight shadow-sm"
                  : "text-muted-foreground hover:text-white/80",
              )}
            >
              {tabLabels[key]}
            </button>
          ))}
        </div>
      ) : null}

      {activeTab === "log" ? (
        <ActionLog
          entries={actionLogEntries}
          agentBattleMode={agentBattleMode}
          embedded={embedded}
        />
      ) : null}

      {activeTab === "leaderboard" ? (
        <div className="min-w-0 space-y-2">
          <Leaderboard entries={leaderboardEntries} highlightId={highlightId} embedded={embedded} />
          {process.env.NODE_ENV === "development" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-amber-500/30 text-xs text-amber-200/90"
              onClick={onResetStats}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Dev reset session
            </Button>
          ) : null}
        </div>
      ) : null}

      {activeTab === "stats" ? (
        <TableStats
          sessionStats={sessionStats}
          sessionStatus={sessionStatus}
          paymentMode={paymentMode}
          entryFee={entryFee}
        />
      ) : null}
    </div>
  );
}
