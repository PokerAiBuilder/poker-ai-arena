import { createInitialLeaderboard } from "@/lib/analytics/leaderboard";
import { createInitialSessionStats } from "@/lib/analytics/sessionStats";
import type { ArenaAnalyticsState } from "@/lib/analytics/types";

export const ARENA_ANALYTICS_STORAGE_KEY = "poker-ai-arena-analytics-v1";

function isLeaderboardEntry(value: unknown): value is ArenaAnalyticsState["leaderboard"][number] {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.agentId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.gamesPlayed === "number" &&
    typeof entry.wins === "number" &&
    typeof entry.losses === "number" &&
    typeof entry.winRate === "number" &&
    typeof entry.profit === "number" &&
    typeof entry.volume === "number"
  );
}

function isArenaAnalyticsState(value: unknown): value is ArenaAnalyticsState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  if (!Array.isArray(state.leaderboard) || !state.sessionStats) return false;
  if (!state.leaderboard.every(isLeaderboardEntry)) return false;

  const stats = state.sessionStats as Record<string, unknown>;
  return (
    typeof stats.totalGames === "number" &&
    typeof stats.totalVolume === "number" &&
    typeof stats.averagePot === "number" &&
    typeof stats.biggestPot === "number"
  );
}

export function createInitialArenaAnalytics(): ArenaAnalyticsState {
  return {
    leaderboard: createInitialLeaderboard(),
    sessionStats: createInitialSessionStats(),
  };
}

export function loadArenaAnalytics(): ArenaAnalyticsState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ARENA_ANALYTICS_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isArenaAnalyticsState(parsed)) {
      clearArenaAnalytics();
      return null;
    }

    return parsed;
  } catch {
    clearArenaAnalytics();
    return null;
  }
}

export function saveArenaAnalytics(state: ArenaAnalyticsState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      ARENA_ANALYTICS_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch (error) {
    console.warn("[analytics/storage] save failed", error);
  }
}

export function clearArenaAnalytics(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(ARENA_ANALYTICS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
