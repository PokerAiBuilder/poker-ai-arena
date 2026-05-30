import {
  AGENT_REGISTRY,
  BluffBot,
  ChipHunter,
  RiverMind,
} from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type { LeaderboardEntry } from "@/lib/analytics/types";
import type { SimulationResult } from "@/lib/poker/types";

const HUMAN_ENTRY = {
  agentId: "human",
  name: "Human Player",
  strategy: "balanced" as const,
};

/** Display avatar for leaderboard rows (UI helper). */
export const LEADERBOARD_AVATARS: Record<string, string> = {
  [PokerMaster.id]: PokerMaster.avatar,
  [BluffBot.id]: BluffBot.avatar,
  [RiverMind.id]: RiverMind.avatar,
  [ChipHunter.id]: ChipHunter.avatar,
  human: "HP",
};

function emptyEntry(
  agentId: string,
  name: string,
  strategy?: string,
): LeaderboardEntry {
  return {
    agentId,
    name,
    strategy,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    profit: 0,
    volume: 0,
    lastResult: "none",
  };
}

export function createInitialLeaderboard(): LeaderboardEntry[] {
  const agentEntries = AGENT_REGISTRY.map((agent) =>
    emptyEntry(agent.id, agent.name, agent.strategy),
  );
  return sortLeaderboard([
    ...agentEntries,
    emptyEntry(HUMAN_ENTRY.agentId, HUMAN_ENTRY.name, HUMAN_ENTRY.strategy),
  ]);
}

export function sortLeaderboard(
  leaderboard: LeaderboardEntry[],
): LeaderboardEntry[] {
  return [...leaderboard].sort((a, b) => {
    if (b.profit !== a.profit) return b.profit - a.profit;
    if (b.winRate !== a.winRate) return b.winRate - a.winRate;
    return b.wins - a.wins;
  });
}

function computeWinRate(wins: number, gamesPlayed: number): number {
  if (gamesPlayed <= 0) return 0;
  return Math.round((wins / gamesPlayed) * 1000) / 10;
}

export function updateLeaderboardAfterGame(
  leaderboard: LeaderboardEntry[],
  result: SimulationResult,
): LeaderboardEntry[] {
  const winnerId = result.winner?.id;
  if (!winnerId || !result.players?.length) {
    return leaderboard;
  }

  const pot = result.pot ?? 0;
  const participantIds = new Set(result.players.map((p) => p.id));
  const lossShare =
    result.players.length > 0
      ? Math.round(pot / result.players.length)
      : 0;

  const updated = leaderboard.map((entry) => {
    if (!participantIds.has(entry.agentId)) {
      return entry;
    }

    const isWinner = entry.agentId === winnerId;
    const gamesPlayed = entry.gamesPlayed + 1;
    const wins = entry.wins + (isWinner ? 1 : 0);
    const losses = entry.losses + (isWinner ? 0 : 1);

    return {
      ...entry,
      gamesPlayed,
      wins,
      losses,
      winRate: computeWinRate(wins, gamesPlayed),
      profit: isWinner
        ? entry.profit + pot
        : entry.profit - lossShare,
      volume: entry.volume + pot,
      lastResult: isWinner ? ("win" as const) : ("loss" as const),
    };
  });

  return sortLeaderboard(updated);
}
