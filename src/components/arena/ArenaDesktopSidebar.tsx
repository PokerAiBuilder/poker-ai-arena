"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  Lock,
  Unlock,
} from "lucide-react";
import { ArenaMenuTrigger } from "@/components/arena/ArenaMenuDrawer";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "arena-sidebar-expanded";

export function useArenaSidebarExpanded() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true") {
        setExpanded(true);
      }
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const setPersisted = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setExpanded((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }, []);

  return [expanded, setPersisted] as const;
}

type ArenaDesktopSidebarProps = {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onOpenMenu: () => void;
  isArenaUnlocked: boolean;
  isStakeCashedOut: boolean;
  currentHumanChips: number;
  aiThinking: boolean;
  hasAiDecision: boolean;
  entryFeePanel: ReactNode;
  aiDecisionPanel: ReactNode | null;
};

function RailIconButton({
  label,
  active = false,
  pulse = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  pulse?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "arena-sidebar-rail-btn",
        active && "arena-sidebar-rail-btn--active",
        pulse && "arena-sidebar-rail-btn--pulse",
      )}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ArenaDesktopSidebar({
  expanded,
  onExpandedChange,
  onOpenMenu,
  isArenaUnlocked,
  isStakeCashedOut,
  currentHumanChips,
  aiThinking,
  hasAiDecision,
  entryFeePanel,
  aiDecisionPanel,
}: ArenaDesktopSidebarProps) {
  const stakeLabel = isStakeCashedOut
    ? "Stake session cashed out"
    : isArenaUnlocked
      ? "Stake session active"
      : "Lock stake to play";

  const aiLabel = aiThinking
    ? "AI thinking"
    : hasAiDecision
      ? "AI decision available"
      : "No AI decision yet";

  const chipsLabel =
    isArenaUnlocked && !isStakeCashedOut
      ? `${currentHumanChips.toLocaleString()} chips`
      : null;

  return (
    <aside
      className={cn(
        "arena-sidebar",
        expanded ? "arena-sidebar--expanded" : "arena-sidebar--collapsed",
      )}
      aria-label={expanded ? "Arena session panel" : "Arena quick actions"}
    >
      {expanded ? (
        <>
          <div className="arena-sidebar-expanded-header shrink-0">
            <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
              Session
            </p>
            <button
              type="button"
              className="arena-sidebar-toggle"
              aria-label="Collapse session panel"
              title="Collapse panel"
              onClick={() => onExpandedChange(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {entryFeePanel}

          <div className="arena-sidebar-scroll min-h-0 flex-1">{aiDecisionPanel}</div>

          <ArenaMenuTrigger
            onClick={onOpenMenu}
            className="mt-1.5 w-full shrink-0"
            compact
          />
        </>
      ) : (
        <div className="arena-sidebar-rail">
          <ArenaMenuTrigger
            onClick={onOpenMenu}
            iconOnly
            className="arena-sidebar-rail-menu h-10 w-10 shrink-0"
            aria-label="Open arena menu"
          />

          <RailIconButton
            label={stakeLabel}
            active={isArenaUnlocked && !isStakeCashedOut}
            onClick={() => onExpandedChange(true)}
          >
            {isStakeCashedOut ? (
              <CheckCircle2 className="h-4 w-4 text-[var(--arena-cyan)]" />
            ) : isArenaUnlocked ? (
              <Unlock className="h-4 w-4 text-[var(--arena-cyan)]" />
            ) : (
              <Lock className="h-4 w-4 text-[var(--arena-muted)]" />
            )}
          </RailIconButton>

          <RailIconButton
            label={aiLabel}
            active={hasAiDecision && !aiThinking}
            pulse={aiThinking}
            onClick={() => onExpandedChange(true)}
          >
            <Brain
              className={cn(
                "h-4 w-4",
                aiThinking
                  ? "text-cyan-300"
                  : hasAiDecision
                    ? "text-[var(--arena-cyan)]"
                    : "text-[var(--arena-muted)]",
              )}
            />
          </RailIconButton>

          {chipsLabel ? (
            <div
              className="arena-sidebar-rail-chips"
              title={chipsLabel}
              aria-label={chipsLabel}
            >
              <Coins className="mb-0.5 h-3 w-3 text-[var(--arena-cyan)]/70" />
              <span className="text-[9px] font-semibold tabular-nums leading-none text-[var(--arena-cyan)]">
                {currentHumanChips >= 1000
                  ? `${Math.round(currentHumanChips / 100) / 10}k`
                  : currentHumanChips}
              </span>
            </div>
          ) : null}

          <div className="mt-auto flex w-full flex-col items-center gap-2 pt-2">
            <button
              type="button"
              className="arena-sidebar-toggle arena-sidebar-toggle--expand"
              aria-label="Expand session panel"
              title="Expand panel"
              onClick={() => onExpandedChange(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
