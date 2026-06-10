"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { ActionLog } from "@/components/arena/ActionLog";
import { AgentProfilesPanel } from "@/components/arena/AgentProfilesPanel";
import { AiDecisionPanel } from "@/components/arena/AiDecisionPanel";
import { ArenaMenuOverviewPanel } from "@/components/arena/ArenaMenuOverviewPanel";
import {
  ArenaMenuTabList,
  type ArenaMenuTabId,
} from "@/components/arena/ArenaMenuTabList";
import { BankrStatusPanel } from "@/components/arena/BankrStatusPanel";
import { CurrentHandSummary } from "@/components/arena/CurrentHandSummary";
import { HandHistoryPanel } from "@/components/arena/HandHistoryPanel";
import { Leaderboard } from "@/components/arena/Leaderboard";
import { TestnetLeaderboard } from "@/components/arena/TestnetLeaderboard";
import { StakeSessionMenuSection } from "@/components/arena/StakeSessionMenuSection";
import { TableStats } from "@/components/arena/TableStats";
import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import type { EscrowPayoutUiInfo } from "@/lib/stake/escrowLiquidityPreview";
import { Button } from "@/components/ui/button";
import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";
import type { LeaderboardEntry, SessionStats } from "@/lib/analytics/types";
import type { HandResultDisplayType } from "@/lib/arena/simulationDisplay";
import type { GameAction, SimulationAgentDecision } from "@/lib/poker/types";
import type { X402PaymentMode } from "@/lib/bankr/x402Client";
import { cn } from "@/lib/utils";

type ArenaMenuDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLogEntries: GameAction[];
  agentBattleMode?: boolean;
  leaderboardEntries: LeaderboardEntry[];
  highlightId?: string;
  connectedWalletAddress?: string;
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
  stakeSessionActive?: boolean;
  stakeCashedOut?: boolean;
  currentHumanChips?: number;
  startingChips?: number;
  stakeAmount?: string;
  lockSettlement?: import("@/lib/stake/stakeSessionStorage").LockSettlement;
  escrowResolved?: boolean;
  handInProgress?: boolean;
  cashingOut?: boolean;
  payingStake?: boolean;
  preparingEscrow?: boolean;
  escrowResolverConfigured?: boolean | null;
  escrowPayoutUi?: EscrowPayoutUiInfo | null;
  stakeSessionMeta?: import("@/lib/stake/stakeSessionStorage").StakeSessionMeta | null;
  onPrepareEscrowPayout?: () => void | Promise<void>;
  onCashOut?: () => void | Promise<void>;
  onBeginNewStakeSession?: () => void;
  serverSession?: ArenaServerSession | null;
  serverHandHistoryEntries?: HandHistoryRecord[];
  currentHandNumber?: number | null;
  currentHandStreet?: string;
  currentHandPot?: number;
  isWalletConnected?: boolean;
  paymentSuccess?: boolean;
};

/** Public menu tabs — Bankr is never shown here (dev-only via ENABLE_BANKR_MENU_TAB). */
const BASE_MENU_TABS: { id: ArenaMenuTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "decision", label: "Decision" },
  { id: "history", label: "History" },
  { id: "stats", label: "Stats" },
];

/** Bankr tab hidden from player UI. Set true locally only when debugging Bankr integration. */
const ENABLE_BANKR_MENU_TAB = false;

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
  connectedWalletAddress,
  sessionStats,
  sessionStatus,
  paymentMode,
  entryFee,
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
  stakeSessionActive = false,
  stakeCashedOut = false,
  currentHumanChips = 0,
  startingChips = 0,
  stakeAmount,
  lockSettlement = "mock",
  escrowResolved = false,
  handInProgress = false,
  cashingOut = false,
  payingStake = false,
  preparingEscrow = false,
  escrowResolverConfigured = null,
  escrowPayoutUi = null,
  stakeSessionMeta = null,
  onPrepareEscrowPayout,
  onCashOut,
  onBeginNewStakeSession,
  serverSession = null,
  serverHandHistoryEntries = [],
  currentHandNumber = null,
  currentHandStreet,
  currentHandPot,
  isWalletConnected = false,
  paymentSuccess = false,
}: ArenaMenuDrawerProps) {
  const [tab, setTab] = useState<ArenaMenuTabId>("overview");

  const drawerTabs = useMemo(() => {
    if (ENABLE_BANKR_MENU_TAB) {
      return [...BASE_MENU_TABS, { id: "integration" as const, label: "Bankr" }];
    }
    return BASE_MENU_TABS;
  }, []);

  useEffect(() => {
    if (!ENABLE_BANKR_MENU_TAB && tab === "integration") {
      setTab("overview");
    }
  }, [tab]);

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
    <div className="fixed inset-0 z-[60] flex justify-end overflow-hidden">
      <button
        type="button"
        className="arena-menu-overlay absolute inset-0"
        aria-label="Close arena menu"
        onClick={() => onOpenChange(false)}
      />

      <aside
        className={cn("arena-menu-drawer animate-fade-in")}
        role="dialog"
        aria-modal="true"
        aria-label="Arena menu"
      >
        <div className="arena-menu-header flex shrink-0 items-center justify-between border-b border-[var(--arena-border)]/80 px-3 py-2 sm:px-3.5">
          <p className="min-w-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arena-cyan)]">
            Arena Menu
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-white/5 hover:text-white"
            onClick={() => onOpenChange(false)}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="shrink-0 border-b border-[var(--arena-border)]/80 px-1.5 py-1.5 sm:px-2">
          <ArenaMenuTabList
            tabs={drawerTabs}
            activeTab={tab}
            onTabChange={setTab}
            open={open}
          />
        </div>

        <div className="arena-menu-scroll">
          <div className="arena-menu-panel">
            {tab === "overview" ? (
              <div className="space-y-3">
                <StakeSessionMenuSection
                  sessionActive={stakeSessionActive}
                  cashedOut={stakeCashedOut}
                  currentHumanChips={currentHumanChips}
                  stakeAmount={stakeAmount}
                  lockSettlement={lockSettlement}
                  handInProgress={handInProgress}
                  cashingOut={cashingOut}
                  payingStake={payingStake}
                  escrowResolved={escrowResolved}
                  preparingEscrow={preparingEscrow}
                  escrowResolverConfigured={escrowResolverConfigured}
                  escrowPayoutUi={escrowPayoutUi}
                  stakeSessionMeta={stakeSessionMeta}
                  onPrepareEscrowPayout={onPrepareEscrowPayout}
                  onCashOut={onCashOut}
                  onBeginNewStakeSession={onBeginNewStakeSession}
                  isWalletConnected={isWalletConnected}
                  connectedWalletAddress={connectedWalletAddress}
                  paymentSuccess={paymentSuccess}
                />
                <ArenaMenuOverviewPanel lockSettlement={lockSettlement} />
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
                  compact
                  className="shadow-none"
                />
              ) : (
                <div className="v1-card rounded-xl border-dashed px-4 py-6 text-center">
                  <p className="text-sm text-[var(--arena-muted)]">
                    Lock a test stake to see AI decisions.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-white/45">
                    Lock stake from the table overlay, then open Decision or
                    History for reasoning and actions.
                  </p>
                </div>
              )
            ) : null}

            {tab === "history" ? (
              <div className="space-y-4">
                <section className="min-w-0 space-y-2 border-b border-[var(--arena-border)]/50 pb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
                    Current hand
                  </p>
                  <CurrentHandSummary
                    handNumber={currentHandNumber}
                    street={currentHandStreet}
                    pot={currentHandPot}
                    humanChips={currentHumanChips}
                    inProgress={handInProgress}
                  />
                  <ActionLog
                    entries={actionLogEntries}
                    agentBattleMode={agentBattleMode}
                    embedded
                  />
                </section>
                <HandHistoryPanel
                  entries={handHistoryEntries}
                  serverEntries={serverHandHistoryEntries}
                  onClear={() => onClearHandHistory?.()}
                  embedded
                  sectionTitle="Local History"
                />
              </div>
            ) : null}

            {tab === "stats" ? (
              <div className="space-y-3">
                <TableStats
                  sessionStats={sessionStats}
                  currentChips={currentHumanChips}
                  startingChips={startingChips}
                  connectedWalletAddress={connectedWalletAddress}
                  stakeSessionMeta={stakeSessionMeta}
                  serverSession={serverSession}
                />
                <TestnetLeaderboard
                  connectedWalletAddress={connectedWalletAddress}
                  stakeSessionMeta={stakeSessionMeta}
                  sessionStats={sessionStats}
                  currentChips={currentHumanChips}
                  startingChips={startingChips}
                  escrowSessionActive={Boolean(
                    isArenaUnlocked &&
                      stakeSessionMeta?.lockSettlement === "escrow-deposit",
                  )}
                  menuCompact
                />
                <Leaderboard
                  entries={leaderboardEntries}
                  highlightId={highlightId}
                  connectedWalletAddress={connectedWalletAddress}
                  embedded
                  menuCompact
                />
              </div>
            ) : null}

            {tab === "integration" && ENABLE_BANKR_MENU_TAB ? (
              <BankrStatusPanel embedded />
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
