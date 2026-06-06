import {
  BarChart3,
  Coins,
  CreditCard,
  Lock,
  Percent,
  Swords,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import type { SessionStats } from "@/lib/analytics/types";
import type { X402PaymentMode } from "@/lib/bankr/x402Client";
import { getPaymentModeUserLabel } from "@/lib/bankr/x402Client";
import { getTestStakeTier } from "@/lib/stake/testnetStake";
import { cn } from "@/lib/utils";

type TableStatsProps = {
  sessionStats: SessionStats;
  sessionStatus?: "locked" | "unlocked";
  paymentMode?: X402PaymentMode | null;
  entryFee?: string;
  className?: string;
};

function formatGameMode(mode: SessionStats["lastGameMode"]): string {
  if (!mode) return "—";
  return mode === "agent-vs-agent" ? "AI Agent Battle" : "Human vs AI";
}

export function TableStats({
  sessionStats,
  sessionStatus = "locked",
  paymentMode = null,
  entryFee = "0.01",
  className,
}: TableStatsProps) {
  const stats = [
    {
      label: "Total Games",
      value: sessionStats.totalGames.toString(),
      icon: BarChart3,
      live: true,
    },
    {
      label: "Total Volume",
      value: `${sessionStats.totalVolume.toLocaleString()} chips`,
      icon: Wallet,
      live: sessionStats.totalVolume > 0,
    },
    {
      label: "Average Pot",
      value:
        sessionStats.totalGames > 0
          ? `${sessionStats.averagePot.toLocaleString()} chips`
          : "—",
      icon: Coins,
      live: sessionStats.totalGames > 0,
    },
    {
      label: "Biggest Pot",
      value:
        sessionStats.biggestPot > 0
          ? `${sessionStats.biggestPot.toLocaleString()} chips`
          : "—",
      icon: Trophy,
      live: sessionStats.biggestPot > 0,
    },
    {
      label: "Last Winner",
      value: sessionStats.lastWinner ?? "—",
      icon: UserRound,
      live: !!sessionStats.lastWinner,
    },
    {
      label: "Last Game Mode",
      value: formatGameMode(sessionStats.lastGameMode),
      icon: Swords,
      live: !!sessionStats.lastGameMode,
    },
    {
      label: "House Edge",
      value: "N/A for MVP",
      icon: Percent,
      live: false,
    },
    {
      label: "Stake Session",
      value: sessionStatus === "unlocked" ? "Active (mock)" : "Not locked",
      icon: Lock,
      live: true,
    },
    {
      label: "Test Stake",
      value: (() => {
        const tier = getTestStakeTier(entryFee);
        return `${tier.usdLabel} → ${tier.chipAmount.toLocaleString()} chips`;
      })(),
      icon: CreditCard,
      live: false,
    },
    {
      label: "Session Mode",
      value: paymentMode ? getPaymentModeUserLabel(paymentMode) : "—",
      icon: Coins,
      live: paymentMode === "mock",
    },
  ];

  return (
    <div className={cn("grid min-w-0 max-w-full grid-cols-2 gap-2", className)}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-panel min-w-0 rounded-xl border border-white/10 p-3 transition-colors hover:border-casino-gold/20"
        >
          <div className="mb-2 flex items-center justify-between">
            <stat.icon className="h-4 w-4 text-casino-gold/70" />
            {stat.live ? (
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-emerald-400">
                live
              </span>
            ) : (
              <span className="text-[8px] uppercase tracking-wider text-white/30">
                static
              </span>
            )}
          </div>
          <p className="break-words text-sm font-bold tabular-nums text-white sm:text-base">
            {stat.value}
          </p>
          <p className="break-words text-[10px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
