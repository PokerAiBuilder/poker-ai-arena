"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { formatEther } from "viem";
import type { SessionStats } from "@/lib/analytics/types";
import {
  buildLeaderboardPreviewFromLocal,
  formatLeaderboardLastActive,
  mergeLeaderboardWithLocalPreview,
  shouldShowLeaderboardEmptyState,
  type TestnetLeaderboardEntry,
} from "@/lib/arena/arenaLeaderboard";
import { isEscrowDepositSession } from "@/lib/stake/walletSessionAccess";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { isStakeSessionActive } from "@/lib/stake/stakeSessionStorage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TestnetLeaderboardResponse = {
  title: string;
  subtitle: string;
  entries: TestnetLeaderboardEntry[];
  limit: number;
  source: string;
  storeNote?: string;
};

type TestnetLeaderboardProps = {
  connectedWalletAddress?: string;
  stakeSessionMeta?: StakeSessionMeta | null;
  sessionStats?: SessionStats;
  currentChips?: number;
  startingChips?: number;
  escrowSessionActive?: boolean;
  className?: string;
  menuCompact?: boolean;
  limit?: number;
};

function formatNetChips(netChips: number): string {
  if (!Number.isFinite(netChips) || netChips === 0) return "±0";
  return netChips > 0 ? `+${netChips.toLocaleString()}` : netChips.toLocaleString();
}

function formatWinRate(winRate: number, handsPlayed: number): string {
  if (handsPlayed <= 0) return "—";
  return `${winRate.toFixed(1)}%`;
}

function formatClaimedEth(wei: string): string {
  try {
    const eth = formatEther(BigInt(wei || "0"));
    const trimmed = eth
      .replace(/(\.\d*?[1-9])0+$/, "$1")
      .replace(/\.0+$/, "");
    return `${trimmed} ETH`;
  } catch {
    return "0 ETH";
  }
}

export function TestnetLeaderboard({
  connectedWalletAddress,
  stakeSessionMeta,
  sessionStats,
  currentChips = 0,
  startingChips = 0,
  escrowSessionActive = false,
  className,
  menuCompact = false,
  limit = 10,
}: TestnetLeaderboardProps) {
  const [serverEntries, setServerEntries] = useState<TestnetLeaderboardEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const localPreview = useMemo(() => {
    if (
      !escrowSessionActive ||
      !stakeSessionMeta ||
      !sessionStats ||
      !isEscrowDepositSession(stakeSessionMeta) ||
      !isStakeSessionActive(stakeSessionMeta)
    ) {
      return null;
    }

    return buildLeaderboardPreviewFromLocal({
      stakeSessionMeta,
      sessionStats,
      currentChips,
      startingChips,
    });
  }, [
    escrowSessionActive,
    stakeSessionMeta,
    sessionStats,
    currentChips,
    startingChips,
  ]);

  const displayEntries = useMemo(
    () => mergeLeaderboardWithLocalPreview(serverEntries, localPreview),
    [serverEntries, localPreview],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ limit: String(limit) });
        const response = await fetch(`/api/arena/leaderboard?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Could not load testnet leaderboard.");
        }

        const data = (await response.json()) as TestnetLeaderboardResponse;
        if (!cancelled) {
          setServerEntries(Array.isArray(data.entries) ? data.entries : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load testnet leaderboard.",
          );
          setServerEntries([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [limit, currentChips, sessionStats?.humanHandsPlayed, sessionStats?.humanWins]);

  const connected = connectedWalletAddress?.toLowerCase();
  const showEmpty = shouldShowLeaderboardEmptyState(displayEntries, localPreview);

  return (
    <div
      className={cn(
        menuCompact
          ? "arena-menu-card min-w-0 max-w-full overflow-hidden"
          : "glass-panel min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/5",
          menuCompact ? "border-[var(--arena-border)]/40 px-3 py-2" : "px-3 py-3 sm:px-4",
        )}
      >
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-casino-gold" />
          <h3
            className={cn(
              "font-semibold text-casino-goldLight",
              menuCompact ? "text-[10px] uppercase tracking-[0.14em]" : "text-sm",
            )}
          >
            Testnet Wallet Leaderboard
          </h3>
        </div>
        <p
          className={cn(
            "text-muted-foreground",
            menuCompact ? "mt-0.5 text-[9px] leading-snug text-white/40" : "text-[10px]",
          )}
        >
          Demo rankings from active escrow sessions
        </p>
        <p
          className={cn(
            "text-white/35",
            menuCompact ? "mt-1 text-[8px] leading-snug" : "mt-1 text-[9px]",
          )}
        >
          Server session leaderboard · not permanent global rankings
        </p>
      </div>

      {loading && displayEntries.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--arena-cyan)]" />
          Loading testnet rankings…
        </div>
      ) : error && showEmpty ? (
        <p className="px-4 py-6 text-center text-xs text-red-300/90">{error}</p>
      ) : showEmpty ? (
        <p className="px-4 py-6 text-center text-xs leading-relaxed text-muted-foreground">
          Play escrow-backed hands to appear here.
        </p>
      ) : (
        <div className="divide-y divide-white/5">
          {displayEntries.map((entry, index) => {
            const rank = index + 1;
            const highlighted =
              connected != null && entry.walletAddress.toLowerCase() === connected;
            const isPreview = entry.source === "local-preview";

            return (
              <div
                key={`${entry.walletAddress}-${entry.source ?? "server"}`}
                className={cn(
                  "flex min-w-0 items-center gap-2 sm:gap-3",
                  menuCompact ? "px-2.5 py-2" : "px-3 py-3 sm:px-4",
                  highlighted && "bg-[var(--arena-blue)]/8",
                  isPreview && "bg-[var(--arena-blue)]/5",
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

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p
                      className={cn(
                        "truncate font-semibold text-white",
                        menuCompact ? "text-[11px]" : "text-xs",
                      )}
                    >
                      {entry.shortWalletAddress}
                    </p>
                    {entry.previewLabel ? (
                      <Badge
                        variant="secondary"
                        className="text-[8px] uppercase tracking-wide"
                      >
                        {entry.previewLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "text-muted-foreground",
                      menuCompact ? "text-[9px]" : "text-[10px]",
                    )}
                  >
                    {entry.sessionsCount} session{entry.sessionsCount === 1 ? "" : "s"} ·{" "}
                    {formatWinRate(entry.winRate, entry.handsPlayed)} ·{" "}
                    {entry.handsPlayed} hands
                  </p>
                  <p className="text-[9px] text-white/40">
                    Claimed {formatClaimedEth(entry.totalClaimedWei)} · Active{" "}
                    {formatLeaderboardLastActive(entry.lastUpdated)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "font-semibold tabular-nums",
                      menuCompact ? "text-[10px]" : "text-xs",
                      entry.netChips > 0 && "text-[var(--arena-cyan)]",
                      entry.netChips < 0 && "text-red-400",
                      entry.netChips === 0 && "text-muted-foreground",
                    )}
                  >
                    {formatNetChips(entry.netChips)}
                  </p>
                  <p className="text-[9px] text-white/40">net chips</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
