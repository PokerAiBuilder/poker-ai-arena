import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LEADERBOARD_AVATARS } from "@/lib/analytics/leaderboard";
import type { LeaderboardEntry } from "@/lib/analytics/types";
import { getShortAddress } from "@/lib/onchain/baseSepolia";
import { cn } from "@/lib/utils";

const DEMO_LEADERBOARD_TITLE = "Local Agent Leaderboard";
const DEMO_LEADERBOARD_HELPER =
  "Device-local bot standings · not testnet wallet rankings";
const DEMO_LEADERBOARD_HELPER_COMPACT =
  "Stored locally on this device";

type LeaderboardProps = {
  entries: LeaderboardEntry[];
  highlightId?: string;
  /** Connected wallet — shown next to Human Player for context only */
  connectedWalletAddress?: string;
  className?: string;
  embedded?: boolean;
  /** Lighter layout for Arena Menu drawer */
  menuCompact?: boolean;
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

function formatEntryDisplayName(
  entry: LeaderboardEntry,
  connectedWalletAddress?: string,
): string {
  if (entry.agentId === "human" && connectedWalletAddress) {
    return `Human Player · ${getShortAddress(connectedWalletAddress)}`;
  }
  return entry.name;
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
  connectedWalletAddress,
  className,
  embedded = false,
  menuCompact = false,
}: LeaderboardProps) {
  return (
    <div
      className={cn(
        menuCompact
          ? "arena-menu-card min-w-0 max-w-full overflow-hidden"
          : "glass-panel min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        embedded && "shadow-none",
        className,
      )}
    >
      {!menuCompact ? (
        <div className="border-b border-white/5 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-casino-gold" />
            <h3 className="text-sm font-semibold text-casino-goldLight">
              {DEMO_LEADERBOARD_TITLE}
            </h3>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {DEMO_LEADERBOARD_HELPER}
          </p>
        </div>
      ) : (
        <div className="border-b border-[var(--arena-border)]/40 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
            {DEMO_LEADERBOARD_TITLE}
          </p>
          <p className="mt-0.5 text-[9px] leading-snug text-white/40">
            {DEMO_LEADERBOARD_HELPER_COMPACT}
          </p>
        </div>
      )}

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
                "flex min-w-0 items-center gap-2 transition-colors sm:gap-3",
                menuCompact ? "px-2.5 py-2" : "px-3 py-3 sm:px-4",
                highlighted && "bg-[var(--arena-blue)]/8",
                entry.lastResult === "win" && "bg-[var(--arena-blue)]/5",
                entry.lastResult === "loss" && "bg-red-500/[0.03]",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  menuCompact ? "h-6 w-6 text-[10px]" : "h-7 w-7",
                  rank === 1
                    ? "bg-[var(--arena-gold-accent)]/15 text-[var(--arena-gold-accent)]/90"
                    : "bg-white/5 text-muted-foreground",
                )}
              >
                {rank}
              </span>

              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40",
                  menuCompact ? "h-7 w-7 text-xs" : "h-8 w-8 text-sm",
                )}
              >
                {avatar}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p
                    className={cn(
                      "break-words font-semibold text-white",
                      menuCompact ? "text-[11px]" : "text-xs",
                    )}
                  >
                    {formatEntryDisplayName(entry, connectedWalletAddress)}
                  </p>
                  {entry.strategy && !menuCompact ? (
                    <Badge variant="secondary" className="text-[9px]">
                      {entry.strategy}
                    </Badge>
                  ) : null}
                  <LastResultBadge lastResult={entry.lastResult} />
                </div>
                <p
                  className={cn(
                    "break-words text-muted-foreground",
                    menuCompact ? "text-[9px]" : "text-[10px]",
                  )}
                >
                  {entry.gamesPlayed} games ·{" "}
                  {formatWinRate(entry.winRate, entry.gamesPlayed)} ·{" "}
                  {formatVolume(entry.volume)}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "font-semibold tabular-nums",
                    menuCompact ? "text-[10px]" : "text-xs",
                    entry.profit > 0 && "text-[var(--arena-cyan)]",
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
