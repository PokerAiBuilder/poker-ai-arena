"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import type { InsightsTab } from "@/components/arena/ArenaInsightsTabs";
import { ArenaInsightsTabs } from "@/components/arena/ArenaInsightsTabs";
import { AiDecisionPanel } from "@/components/arena/AiDecisionPanel";
import { BankrStatusPanel } from "@/components/arena/BankrStatusPanel";
import { DemoDisclaimers } from "@/components/arena/DemoDisclaimers";
import { AgentProfilesPanel } from "@/components/arena/AgentProfilesPanel";
import { DemoHelpPanel } from "@/components/arena/DemoHelpPanel";
import { HandHistoryPanel } from "@/components/arena/HandHistoryPanel";
import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import { Button } from "@/components/ui/button";
import type { LeaderboardEntry, SessionStats } from "@/lib/analytics/types";
import type { HandResultDisplayType } from "@/lib/arena/simulationDisplay";
import type { GameAction, SimulationAgentDecision } from "@/lib/poker/types";
import type { X402PaymentMode } from "@/lib/bankr/x402Client";
import { cn } from "@/lib/utils";

type DrawerTab =
  | "guide"
  | "agents"
  | "decision"
  | InsightsTab
  | "history"
  | "integration"
  | "disclaimers";

type ArenaMenuDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLogEntries: GameAction[];
  agentBattleMode?: boolean;
  leaderboardEntries: LeaderboardEntry[];
  highlightId?: string;
  sessionStats: SessionStats;
  sessionStatus: "locked" | "unlocked";
  paymentMode: X402PaymentMode | null;
  entryFee: string;
  onResetStats: () => void;
  handHistoryEntries?: HandHistoryRecord[];
  onClearHandHistory?: () => void;
  isArenaUnlocked?: boolean;
  latestAiDecision?: SimulationAgentDecision;
  hidePrivateHandInfo?: boolean;
  aiThinking?: boolean;
  aiThinkingLabel?: string;
  spectatorMode?: boolean;
  guidedHand?: boolean;
  handSettled?: boolean;
  settledWinnerName?: string;
  settledWinningHand?: string;
  settledResultType?: HandResultDisplayType;
  humanCallAmount?: number;
  totalDecisions?: number;
};

const drawerTabs: { id: DrawerTab; label: string }[] = [
  { id: "guide", label: "Guide" },
  { id: "agents", label: "Agents" },
  { id: "decision", label: "Decision" },
  { id: "log", label: "Log" },
  { id: "leaderboard", label: "Board" },
  { id: "stats", label: "Stats" },
  { id: "history", label: "History" },
  { id: "integration", label: "Bankr" },
  { id: "disclaimers", label: "Info" },
];

const insightsPanels = new Set<DrawerTab>(["log", "leaderboard", "stats"]);

export function ArenaMenuTrigger({
  onClick,
  className,
  compact = false,
  iconOnly = false,
  "aria-label": ariaLabel = "Open arena menu",
}: {
  onClick: () => void;
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
  "aria-label"?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size={iconOnly ? "icon" : compact ? "sm" : "default"}
      className={cn(
        "border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 text-[var(--arena-cyan)] hover:bg-[var(--arena-blue)]/15",
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Menu className="h-4 w-4" />
      {iconOnly ? (
        <span className="sr-only">Menu</span>
      ) : compact ? (
        "Menu"
      ) : (
        "Arena Menu"
      )}
    </Button>
  );
}

export function ArenaMenuDrawer({
  open,
  onOpenChange,
  actionLogEntries,
  agentBattleMode = false,
  leaderboardEntries,
  highlightId,
  sessionStats,
  sessionStatus,
  paymentMode,
  entryFee,
  onResetStats,
  handHistoryEntries = [],
  onClearHandHistory,
  isArenaUnlocked = false,
  latestAiDecision,
  hidePrivateHandInfo = false,
  aiThinking = false,
  aiThinkingLabel,
  spectatorMode = false,
  guidedHand = false,
  handSettled = false,
  settledWinnerName,
  settledWinningHand,
  settledResultType,
  humanCallAmount,
  totalDecisions = 0,
}: ArenaMenuDrawerProps) {
  const [tab, setTab] = useState<DrawerTab>("guide");
  const tabRefs = useRef<Map<DrawerTab, HTMLButtonElement>>(new Map());

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

  useEffect(() => {
    if (!open) return;
    const activeTab = tabRefs.current.get(tab);
    activeTab?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
  }, [tab, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label="Close arena menu"
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn("arena-menu-drawer animate-fade-in")}
        role="dialog"
        aria-modal="true"
        aria-label="Arena menu"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--arena-border)] px-3 py-3 sm:px-4">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--arena-cyan)]">
              Arena Menu
            </p>
            <p className="truncate text-xs text-[var(--arena-muted)]">
              Guide, decisions, logs & stats
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="arena-action-btn-tap shrink-0 text-muted-foreground hover:text-white sm:h-9 sm:w-9"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="shrink-0 border-b border-[var(--arena-border)] px-3 py-2">
          <div className="arena-menu-tabs" role="tablist" aria-label="Arena menu sections">
            {drawerTabs.map(({ id, label }) => (
              <button
                key={id}
                ref={(node) => {
                  if (node) tabRefs.current.set(id, node);
                  else tabRefs.current.delete(id);
                }}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "arena-menu-tab",
                  tab === id
                    ? "arena-menu-tab-active"
                    : "text-[var(--arena-muted)] hover:bg-[var(--arena-surface-2)]/80 hover:text-[var(--arena-text)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="arena-menu-scroll">
          <div className="arena-menu-panel">
            {tab === "guide" ? (
              <div className="space-y-4">
                <DemoHelpPanel className="border-white/10 shadow-none" />
              </div>
            ) : null}

            {tab === "agents" ? <AgentProfilesPanel /> : null}

            {tab === "decision" ? (
              isArenaUnlocked ? (
                <AiDecisionPanel
                  latest={latestAiDecision}
                  guidedHand={guidedHand}
                  hidePrivateHandInfo={hidePrivateHandInfo}
                  thinking={aiThinking}
                  thinkingLabel={aiThinkingLabel}
                  spectatorMode={spectatorMode}
                  handSettled={handSettled}
                  settledWinnerName={settledWinnerName}
                  settledWinningHand={settledWinningHand}
                  settledResultType={settledResultType}
                  humanCallAmount={humanCallAmount}
                  totalDecisions={totalDecisions}
                  className="shadow-none"
                />
              ) : (
                <div className="v1-card rounded-xl border-dashed px-4 py-6 text-center">
                  <p className="text-sm text-[var(--arena-muted)]">
                    Lock a test stake session to see AI decisions.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    Choose a test stake and lock a session from the sidebar or
                    table overlay to enable Decision, Log, and History panels.
                  </p>
                </div>
              )
            ) : null}

            {insightsPanels.has(tab) ? (
              <ArenaInsightsTabs
                panel={tab as InsightsTab}
                actionLogEntries={actionLogEntries}
                agentBattleMode={agentBattleMode}
                leaderboardEntries={leaderboardEntries}
                highlightId={highlightId}
                sessionStats={sessionStats}
                sessionStatus={sessionStatus}
                paymentMode={paymentMode}
                entryFee={entryFee}
                onResetStats={onResetStats}
                embedded
              />
            ) : null}

            {tab === "history" ? (
              <HandHistoryPanel
                entries={handHistoryEntries}
                onClear={() => onClearHandHistory?.()}
                embedded
              />
            ) : null}

            {tab === "integration" ? <BankrStatusPanel embedded /> : null}

            {tab === "disclaimers" ? (
              <div className="space-y-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <DemoDisclaimers className="justify-start" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Session analytics and stake session data are stored in localStorage on
                  this device only. Balances are stake- and hand-driven — not manually reset.
                </p>
                <p className="text-xs leading-relaxed text-violet-200/70">
                  Agent Battle uses a shared server timeline. Multiple viewers can
                  watch the same AI hand. Skip animations is local only.
                </p>
                <p className="text-[10px] leading-relaxed text-white/40">
                  Built with Next.js · Base testnet demo · Bankr/x402 integration
                  layer prepared — mock session unlock in this MVP.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
