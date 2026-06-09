"use client";

import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatHandHistoryCompactTitle,
  formatHandHistoryMetaLine,
  formatHandHistoryResultLine,
  shouldShowHistoryTxLink,
} from "@/lib/analytics/playerSessionStats";
import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import { cn } from "@/lib/utils";

type HandHistoryPanelProps = {
  entries: HandHistoryRecord[];
  onClear: () => void;
  className?: string;
  embedded?: boolean;
  sectionTitle?: string;
  /** When set, only these modes are listed (default: Human vs AI). */
  modeFilter?: HandHistoryRecord["mode"][];
};

function modeBadgeClass(mode: HandHistoryRecord["mode"]): string {
  return mode === "AI Agent Battle"
    ? "border-[var(--arena-blue-bright)]/30 bg-[var(--arena-blue)]/15 text-[var(--arena-cyan)]"
    : "border-[var(--arena-cyan)]/25 bg-[var(--arena-blue)]/10 text-[var(--arena-cyan)]";
}

function modeBadgeLabel(mode: HandHistoryRecord["mode"]): string {
  return mode === "AI Agent Battle" ? "Agent Battle" : "Human vs AI";
}

export function HandHistoryPanel({
  entries,
  onClear,
  className,
  embedded = false,
  sectionTitle = "Local History",
  modeFilter = ["Human vs AI"],
}: HandHistoryPanelProps) {
  const visibleEntries = entries.filter((entry) => modeFilter.includes(entry.mode));

  return (
    <div className={cn("min-w-0 max-w-full space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-[var(--arena-cyan)]/75" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
            {sectionTitle}
          </p>
        </div>
        {visibleEntries.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[9px] text-muted-foreground hover:text-white/80"
            onClick={onClear}
          >
            <RotateCcw className="mr-0.5 h-2.5 w-2.5" />
            Clear
          </Button>
        ) : null}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="arena-menu-card border-dashed px-3 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            Completed hands will appear here.
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "space-y-1.5 overflow-y-auto pr-0.5",
            embedded ? "max-h-none" : "max-h-[min(52vh,420px)]",
          )}
        >
          {visibleEntries.map((entry) => (
            <li
              key={entry.id}
              className="arena-menu-card min-w-0 max-w-full px-2.5 py-2"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide",
                    modeBadgeClass(entry.mode),
                  )}
                >
                  {modeBadgeLabel(entry.mode)}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {formatHandHistoryCompactTitle(entry)}
                </span>
              </div>
              <p className="mt-1 break-words text-[11px] font-semibold leading-snug text-[var(--arena-gold-accent)]/85">
                {entry.winnerName === "You" ? "You won" : `${entry.winnerName} won`}{" "}
                <span className="font-medium text-white/75">
                  {entry.potWon.toLocaleString()} chips
                </span>
              </p>
              <p className="text-[10px] text-[var(--arena-cyan)]/80">
                {entry.resultType}
                {formatHandHistoryResultLine(entry) !== entry.resultType
                  ? ` · ${formatHandHistoryResultLine(entry)}`
                  : ""}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[9px] text-white/45">
                {formatHandHistoryMetaLine(entry)}
              </p>
              {shouldShowHistoryTxLink(entry) ? (
                <div className="mt-1 flex flex-wrap gap-2 text-[9px]">
                  {entry.depositExplorerUrl ? (
                    <a
                      href={entry.depositExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--arena-cyan)]/80 underline-offset-2 hover:underline"
                    >
                      Deposit tx
                    </a>
                  ) : null}
                  {entry.claimExplorerUrl ? (
                    <a
                      href={entry.claimExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--arena-cyan)]/80 underline-offset-2 hover:underline"
                    >
                      Claim tx
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
