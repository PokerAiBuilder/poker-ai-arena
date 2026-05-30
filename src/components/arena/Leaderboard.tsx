import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEADERBOARD_AVATARS } from "@/lib/analytics/leaderboard";
import type { LeaderboardEntry } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightId?: string;
  className?: string;
};

function formatWinRate(winRate: number, gamesPlayed: number): string {
  if (gamesPlayed <= 0) return "0.0%";
  return `${winRate.toFixed(1)}%`;
}

function formatProfit(profit: number): string {
  const sign = profit > 0 ? "+" : profit < 0 ? "" : "";
  return `${sign}${profit}`;
}

function formatVolume(volume: number): string {
  return `${volume.toLocaleString()} chips`;
}

function LastResultBadge({
  lastResult,
}: {
  lastResult?: LeaderboardEntry["lastResult"];
}) {
  if (!lastResult || lastResult === "none") return null;

  if (lastResult === "win") {
    return (
      <Badge className="border-casino-gold/40 bg-casino-gold/15 text-[9px] text-casino-goldLight">
        W
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="border-red-500/20 bg-red-500/10 text-[9px] text-red-300"
    >
      L
    </Badge>
  );
}

export function Leaderboard({
  entries,
  highlightId,
  className,
}: LeaderboardProps) {
  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        className,
      )}
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-casino-gold" />
          <h3 className="text-sm font-semibold text-casino-goldLight">Leaderboard</h3>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Live session stats · saved locally
        </p>
      </div>

      <div className="divide-y divide-white/5">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const highlighted = entry.agentId === highlightId;
          const avatar =
            LEADERBOARD_AVATARS[entry.agentId] ?? entry.name.slice(0, 2);

          return (
            <div
              key={entry.agentId}
              className={cn(
                "flex items-center gap-2 px-4 py-3 transition-colors sm:gap-3",
                highlighted && "bg-casino-gold/5",
                entry.lastResult === "win" && "bg-emerald-500/[0.04]",
                entry.lastResult === "loss" && "bg-red-500/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  rank === 1
                    ? "bg-casino-gold/20 text-casino-goldLight"
                    : "bg-white/5 text-muted-foreground",
                )}
              >
                {rank}
              </span>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-sm">
                {avatar}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-white">
                    {entry.name}
                  </p>
                  {entry.strategy ? (
                    <Badge variant="secondary" className="text-[9px]">
                      {entry.strategy}
                    </Badge>
                  ) : null}
                  <LastResultBadge lastResult={entry.lastResult} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {entry.gamesPlayed} games ·{" "}
                  {formatWinRate(entry.winRate, entry.gamesPlayed)} ·{" "}
                  {formatVolume(entry.volume)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    entry.profit > 0 && "text-emerald-400",
                    entry.profit < 0 && "text-red-400",
                    entry.profit === 0 && "text-muted-foreground",
                  )}
                >
                  {formatProfit(entry.profit)}
                </p>
                <p className="text-[9px] text-white/40">
                  {entry.wins}W / {entry.losses}L
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
