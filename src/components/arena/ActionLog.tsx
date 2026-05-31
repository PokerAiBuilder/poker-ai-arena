"use client";

import { useMemo, useState } from "react";
import type { GameAction } from "@/lib/poker/types";
import {
  actionTypeBadgeClass,
  filterActionLogByStreet,
  normalizeActionLogEntries,
  STREET_FILTER_OPTIONS,
  type ActionLogDisplayEntry,
  type StreetFilter,
} from "@/lib/arena/actionLogDisplay";
import { cn } from "@/lib/utils";

type ActionLogProps = {
  entries: GameAction[];
  /** Uppercase street labels + violet accents for Agent Battle spectator logs */
  agentBattleMode?: boolean;
  className?: string;
};

function ActionTypeBadge({ actionType }: { actionType: ActionLogDisplayEntry["actionType"] }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
        actionTypeBadgeClass(actionType),
      )}
    >
      {actionType === "ALL_IN" ? "ALL-IN" : actionType}
    </span>
  );
}

function ShowdownResultRow({
  entry,
  agentBattleMode,
}: {
  entry: ActionLogDisplayEntry;
  agentBattleMode: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2",
        agentBattleMode
          ? "border-violet-400/30 bg-violet-950/35"
          : "border-casino-gold/35 bg-casino-gold/10",
      )}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <ActionTypeBadge actionType="WINNER" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-casino-goldLight/80">
          {entry.phase === "RESULT" ? "Result" : "Showdown"}
        </span>
      </div>
      {entry.winnerName ? (
        <p className="text-xs text-white/90">
          <span className="text-white/50">Winner: </span>
          {entry.winnerName}
        </p>
      ) : null}
      {entry.winningHand ? (
        <p className="text-xs text-white/80">
          <span className="text-white/50">Hand: </span>
          {entry.winningHand}
        </p>
      ) : null}
      {entry.resultType && !entry.winningHand ? (
        <p className="text-xs text-white/80">
          <span className="text-white/50">Result: </span>
          {entry.resultType}
        </p>
      ) : null}
      {entry.potWon != null ? (
        <p className="text-xs font-medium text-casino-goldLight">
          Pot won: {entry.potWon.toLocaleString()} chips
        </p>
      ) : null}
      <p className="mt-1 text-[11px] leading-snug text-white/45">{entry.displayText}</p>
    </div>
  );
}

function ActionLogRow({
  entry,
  agentBattleMode,
}: {
  entry: ActionLogDisplayEntry;
  agentBattleMode: boolean;
}) {
  if (entry.isShowdownBlock) {
    return <ShowdownResultRow entry={entry} agentBattleMode={agentBattleMode} />;
  }

  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5",
        entry.isError && "bg-red-500/10",
      )}
    >
      <ActionTypeBadge actionType={entry.actionType} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {entry.actorName ? (
            <span className="text-[10px] font-medium text-white/70">{entry.actorName}</span>
          ) : null}
          <span
            className={cn(
              "text-[9px] font-semibold uppercase tracking-wider",
              agentBattleMode ? "text-violet-300/55" : "text-white/30",
            )}
          >
            {entry.phase}
          </span>
        </div>
        <p
          className={cn(
            "mt-0.5 text-xs leading-snug",
            entry.isError ? "text-red-300" : "text-muted-foreground",
          )}
        >
          {entry.displayText}
        </p>
        {(entry.amount != null || entry.pot != null) && (
          <p className="mt-0.5 text-[10px] text-white/35">
            {entry.amount != null ? (
              <span>
                {entry.actionType === "RAISE" ? "Raise: " : "Amount: "}
                {entry.actionType === "RAISE" && entry.amount > 0
                  ? `+${entry.amount}`
                  : entry.amount.toLocaleString()}
              </span>
            ) : null}
            {entry.amount != null && entry.pot != null ? " · " : null}
            {entry.pot != null ? (
              <span>Pot: {entry.pot.toLocaleString()}</span>
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

export function ActionLog({ entries, agentBattleMode = false, className }: ActionLogProps) {
  const [streetFilter, setStreetFilter] = useState<StreetFilter>("ALL");

  const normalized = useMemo(() => normalizeActionLogEntries(entries), [entries]);
  const filtered = useMemo(
    () => filterActionLogByStreet(normalized, streetFilter),
    [normalized, streetFilter],
  );

  return (
    <div
      className={cn(
        "glass-panel flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        className,
      )}
    >
      <div className="shrink-0 border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-casino-goldLight">Action Log</h3>
        <p className="text-[10px] text-muted-foreground">
          {agentBattleMode ? "Hand replay — Agent Battle" : "Hand replay — street by street"}
        </p>
      </div>

      <div className="shrink-0 border-b border-white/5 px-3 py-2">
        <div className="scrollbar-hide flex flex-wrap gap-1">
          {STREET_FILTER_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setStreetFilter(id)}
              className={cn(
                "shrink-0 rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors",
                streetFilter === id
                  ? agentBattleMode
                    ? "bg-violet-700/50 text-violet-100 ring-1 ring-violet-400/40"
                    : "bg-emerald-950/60 text-emerald-100 ring-1 ring-emerald-500/30"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white/80",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 max-h-[min(52vh,320px)] flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No activity yet. Unlock the arena and run a simulation.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No log entries for this street.
          </p>
        ) : (
          <div className="space-y-1">
            {filtered.map((entry) => (
              <ActionLogRow
                key={entry.key}
                entry={entry}
                agentBattleMode={agentBattleMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
