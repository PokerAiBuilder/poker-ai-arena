"use client";

import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatHandHistoryHandLine,
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
};

function modeBadgeClass(mode: HandHistoryRecord["mode"]): string {
  return mode === "AI Agent Battle"
    ? "border-violet-400/35 bg-violet-950/50 text-violet-100"
    : "border-emerald-400/35 bg-emerald-950/50 text-emerald-100";
}

export function HandHistoryPanel({
  entries,
  onClear,
  className,
  embedded = false,
}: HandHistoryPanelProps) {
  return (
    <div className={cn("min-w-0 max-w-full space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-casino-goldLight/80" />
          <p className="text-xs font-semibold uppercase tracking-wide text-casino-goldLight/90">
            Recent Hands
          </p>
        </div>
        {entries.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-muted-foreground hover:text-white"
            onClick={onClear}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Clear History
          </Button>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-black/20 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No hands recorded yet.</p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Play vs PokerMaster or run Agent Battle to build history.
          </p>
        </div>
      ) : (
        <ul
          className={cn(
            "space-y-2 overflow-y-auto pr-1",
            embedded ? "max-h-none" : "max-h-[min(52vh,420px)]",
          )}
        >
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="min-w-0 max-w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    modeBadgeClass(entry.mode),
                  )}
                >
                  {entry.mode}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatHandHistoryTime(entry.timestamp)}
                </span>
                {entry.handNumber != null ? (
                  <span className="text-[10px] text-white/35">
                    Hand #{entry.handNumber}
                  </span>
                ) : null}
              </div>
              <p className="mt-1.5 break-words text-sm font-medium text-casino-goldLight">
                {formatHandHistoryWinnerPot(entry.winnerName, entry.potWon)}
              </p>
              <p className="break-words text-xs text-emerald-200/80">
                {formatHandHistoryHandLine(entry)}
                {entry.actionCount > 0 ? (
                  <span className="text-white/35">
                    {" "}
                    · {entry.actionCount} actions
                  </span>
                ) : null}
              </p>
              {entry.actionPreview ? (
                <p
                  className="mt-1 break-words text-[10px] leading-snug text-white/40"
                  title={entry.actionPreview}
                >
                  {entry.actionPreview}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
