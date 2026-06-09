"use client";

import {
  BarChart3,
  Coins,
  Trophy,
  TrendingUp,
  UserRound,
  Wallet,
} from "lucide-react";
import {
  buildPlayerSessionStatsView,
  formatChipDelta,
  formatWinRateLabel,
  type PlayerSessionStatsView,
} from "@/lib/analytics/playerSessionStats";
import { getDepositedEthLabel } from "@/lib/arena/arenaLeaderboard";
import type { SessionStats } from "@/lib/analytics/types";
import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { cn } from "@/lib/utils";

type TableStatsProps = {
  sessionStats: SessionStats;
  currentChips?: number;
  startingChips?: number;
  connectedWalletAddress?: string;
  stakeSessionMeta?: StakeSessionMeta | null;
  serverSession?: ArenaServerSession | null;
  className?: string;
};

function StatCard({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  highlight?: boolean;
}) {
  return (
    <div className="arena-menu-card min-w-0 p-2.5 transition-colors hover:border-[var(--arena-cyan)]/22">
      <Icon className="mb-1.5 h-3.5 w-3.5 text-[var(--arena-cyan)]/65" />
      <p
        className={cn(
          "break-words text-sm font-bold tabular-nums leading-tight",
          highlight ? "text-[var(--arena-gold-accent)]/90" : "text-white",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 break-words text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}

function buildStatsCards(
  view: PlayerSessionStatsView,
  depositedLabel: "Wallet deposited" | "Session stake",
) {
  return [
    {
      label: "Current chips",
      value: view.currentChips.toLocaleString(),
      icon: Coins,
    },
    {
      label: "Starting chips",
      value: view.startingChips.toLocaleString(),
      icon: Wallet,
    },
    {
      label: "Net chips",
      value: formatChipDelta(view.netChips),
      icon: TrendingUp,
      highlight: view.netChips !== 0,
    },
    {
      label: "Hands played",
      value: view.handsPlayed.toString(),
      icon: BarChart3,
    },
    {
      label: "Wins / losses",
      value: `${view.wins} / ${view.losses}`,
      icon: UserRound,
    },
    {
      label: "Win rate",
      value: formatWinRateLabel(view.winRate, view.handsPlayed),
      icon: Trophy,
      highlight: view.handsPlayed > 0 && view.winRate >= 50,
    },
    {
      label: "Biggest pot",
      value:
        view.biggestPot > 0 ? `${view.biggestPot.toLocaleString()} chips` : "—",
      icon: Trophy,
    },
    {
      label: depositedLabel,
      value: view.totalDepositedEth,
      icon: Wallet,
    },
    {
      label: "Total claimed",
      value: view.totalClaimedEth,
      icon: Coins,
    },
  ];
}

export function TableStats({
  sessionStats,
  currentChips = 0,
  startingChips = 0,
  connectedWalletAddress,
  stakeSessionMeta,
  serverSession,
  className,
}: TableStatsProps) {
  const walletShort = connectedWalletAddress
    ? `${connectedWalletAddress.slice(0, 6)}…${connectedWalletAddress.slice(-4)}`
    : undefined;

  const view = buildPlayerSessionStatsView({
    sessionStats,
    currentChips,
    startingChips,
    walletShort,
    stakeSessionMeta,
    serverSession,
  });

  const cards = buildStatsCards(view, getDepositedEthLabel(stakeSessionMeta));

  return (
    <div className={cn("min-w-0 max-w-full space-y-2", className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
          Session Stats
        </p>
        <p className="mt-0.5 text-[9px] leading-snug text-white/40">
          {view.sessionLabel}
          {view.walletShort ? ` · ${view.walletShort}` : ""}
          {view.chipSource === "server" ? " · server chips" : " · local chips"}
        </p>
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-2 gap-2">
        {cards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            highlight={stat.highlight}
          />
        ))}
      </div>
    </div>
  );
}
