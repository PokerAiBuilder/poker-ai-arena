import type { SessionStats } from "@/lib/analytics/types";
import type { StepDemoState } from "@/lib/arena/stepDemo";
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
    humanHandsPlayed: 0,
    humanWins: 0,
    humanLosses: 0,
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
    humanHandsPlayed: stats.humanHandsPlayed,
    humanWins: stats.humanWins,
    humanLosses: stats.humanLosses,
  };
}

export function updateSessionStatsAfterStepDemoHand(
  stats: SessionStats,
  state: StepDemoState,
): SessionStats {
  if (state.step !== "result" || !state.winner) return stats;

  const pot = state.lastPotWon ?? 0;
  const humanWon = state.winner.id === state.players.human.id;
  const handsPlayed = (stats.humanHandsPlayed ?? 0) + 1;
  const wins = (stats.humanWins ?? 0) + (humanWon ? 1 : 0);
  const losses = (stats.humanLosses ?? 0) + (humanWon ? 0 : 1);
  const totalGames = stats.totalGames + 1;
  const totalVolume = stats.totalVolume + pot;

  return {
    ...stats,
    totalGames,
    totalVolume,
    averagePot: totalGames > 0 ? Math.round(totalVolume / totalGames) : 0,
    biggestPot: Math.max(stats.biggestPot, pot),
    lastWinner: state.winner.name,
    lastGameMode: "human-vs-ai",
    humanHandsPlayed: handsPlayed,
    humanWins: wins,
    humanLosses: losses,
  };
}
