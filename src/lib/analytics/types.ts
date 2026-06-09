import type { GameMode } from "@/lib/poker/types";

export type LeaderboardEntry = {
  agentId: string;
  name: string;
  strategy?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  profit: number;
  volume: number;
  lastResult?: "win" | "loss" | "none";
};

export type SessionStats = {
  totalGames: number;
  totalVolume: number;
  averagePot: number;
  biggestPot: number;
  lastWinner?: string;
  lastGameMode?: GameMode;
  houseEdge: number | null;
  /** Human vs AI hands in the current local session. */
  humanHandsPlayed?: number;
  humanWins?: number;
  humanLosses?: number;
};

export type ArenaAnalyticsState = {
  leaderboard: LeaderboardEntry[];
  sessionStats: SessionStats;
};
