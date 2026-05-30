import type { SessionStats } from "@/lib/analytics/types";
import type { SimulationResult } from "@/lib/poker/types";

export function createInitialSessionStats(): SessionStats {
  return {
    totalGames: 0,
    totalVolume: 0,
    averagePot: 0,
    biggestPot: 0,
    lastWinner: undefined,
    lastGameMode: undefined,
    houseEdge: null,
  };
}

export function updateSessionStatsAfterGame(
  stats: SessionStats,
  result: SimulationResult,
): SessionStats {
  const pot = result.pot ?? 0;
  const totalGames = stats.totalGames + 1;
  const totalVolume = stats.totalVolume + pot;

  return {
    totalGames,
    totalVolume,
    averagePot: totalGames > 0 ? Math.round(totalVolume / totalGames) : 0,
    biggestPot: Math.max(stats.biggestPot, pot),
    lastWinner: result.winner?.name ?? stats.lastWinner,
    lastGameMode: result.gameMode ?? stats.lastGameMode,
    houseEdge: null,
  };
}
