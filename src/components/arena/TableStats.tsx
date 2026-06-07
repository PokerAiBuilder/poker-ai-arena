import {
  BarChart3,
  Coins,
  Swords,
  Trophy,
  UserRound,
  Wallet,
} from "lucide-react";
import type { SessionStats } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

type TableStatsProps = {
  sessionStats: SessionStats;
  sessionStatus?: "locked" | "unlocked";
  paymentMode?: import("@/lib/bankr/x402Client").X402PaymentMode | null;
  entryFee?: string;
  className?: string;
};

function formatGameMode(mode: SessionStats["lastGameMode"]): string {
  if (!mode) return "—";
  return mode === "agent-vs-agent" ? "Agent Battle" : "Human vs AI";
}

export function TableStats({
  sessionStats,
  className,
}: TableStatsProps) {
  const stats = [
    {
      label: "Total games",
      value: sessionStats.totalGames.toString(),
      icon: BarChart3,
    },
    {
      label: "Total volume",
      value: `${sessionStats.totalVolume.toLocaleString()} chips`,
      icon: Wallet,
    },
    {
      label: "Average pot",
      value:
        sessionStats.totalGames > 0
          ? `${sessionStats.averagePot.toLocaleString()} chips`
          : "—",
      icon: Coins,
    },
    {
      label: "Biggest pot",
      value:
        sessionStats.biggestPot > 0
          ? `${sessionStats.biggestPot.toLocaleString()} chips`
          : "—",
      icon: Trophy,
    },
    {
      label: "Last winner",
      value: sessionStats.lastWinner ?? "—",
      icon: UserRound,
      highlight: !!sessionStats.lastWinner,
    },
    {
      label: "Current mode",
      value: formatGameMode(sessionStats.lastGameMode),
      icon: Swords,
    },
  ];

  return (
    <div className={cn("min-w-0 max-w-full space-y-2", className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
          Local Session Stats
        </p>
        <p className="mt-0.5 text-[9px] leading-snug text-white/40">
          Stored locally on this device
        </p>
      </div>

      <div className="grid min-w-0 max-w-full grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="arena-menu-card min-w-0 p-2.5 transition-colors hover:border-[var(--arena-cyan)]/22"
          >
            <stat.icon className="mb-1.5 h-3.5 w-3.5 text-[var(--arena-cyan)]/65" />
            <p
              className={cn(
                "break-words text-sm font-bold tabular-nums leading-tight",
                stat.highlight
                  ? "text-[var(--arena-gold-accent)]/90"
                  : "text-white",
              )}
            >
              {stat.value}
            </p>
            <p className="mt-0.5 break-words text-[9px] text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
