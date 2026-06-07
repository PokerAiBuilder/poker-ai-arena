"use client";

import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatHandHistoryTime,
  formatHandHistoryWinnerPot,
  type HandHistoryRecord,
} from "@/lib/arena/handHistory";
import { cn } from "@/lib/utils";

type HandHistoryPanelProps = {
  entries: HandHistoryRecord[];
  onClear: () => void;
  className?: string;
  embedded?: boolean;
  sectionTitle?: string;
};

function modeBadgeClass(mode: HandHistoryRecord["mode"]): string {
  return mode === "AI Agent Battle"
    ? "border-[var(--arena-blue-bright)]/30 bg-[var(--arena-blue)]/15 text-[var(--arena-cyan)]"
    : "border-[var(--arena-cyan)]/25 bg-[var(--arena-blue)]/10 text-[var(--arena-cyan)]";
}

function modeBadgeLabel(mode: HandHistoryRecord["mode"]): string {
  return mode === "AI Agent Battle" ? "Agent Battle" : "Human vs AI";
}

function historyDetailLine(entry: HandHistoryRecord): string {
  if (entry.resultType === "Win by fold") return "Win by fold";
  if (entry.winningHandName && entry.winningHandName !== "Win by fold") {
    return entry.winningHandName;
  }
  return entry.resultType;
}

export function HandHistoryPanel({
  entries,
  onClear,
  className,
  embedded = false,
  sectionTitle = "Recent hands",
}: HandHistoryPanelProps) {
  return (
    <div className={cn("min-w-0 max-w-full space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-[var(--arena-cyan)]/75" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
            {sectionTitle}
          </p>
        </div>
        {entries.length > 0 ? (
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

      {entries.length === 0 ? (
        <div className="arena-menu-card border-dashed px-3 py-5 text-center">
          <p className="text-xs text-muted-foreground">No hands recorded yet.</p>
        </div>
      ) : (
        <ul
          className={cn(
            "space-y-1.5 overflow-y-auto pr-0.5",
            embedded ? "max-h-none" : "max-h-[min(52vh,420px)]",
          )}
        >
          {entries.map((entry) => (
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
                  {formatHandHistoryTime(entry.timestamp)}
                </span>
              </div>
              <p className="mt-1 break-words text-[11px] font-semibold leading-snug text-[var(--arena-gold-accent)]/85">
                {formatHandHistoryWinnerPot(entry.winnerName, entry.potWon)}
              </p>
              <p className="text-[10px] text-[var(--arena-cyan)]/80">
                {entry.resultType}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[9px] text-white/45">
                {historyDetailLine(entry)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
