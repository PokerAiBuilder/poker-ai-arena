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
};

export type ArenaAnalyticsState = {
  leaderboard: LeaderboardEntry[];
  sessionStats: SessionStats;
};
