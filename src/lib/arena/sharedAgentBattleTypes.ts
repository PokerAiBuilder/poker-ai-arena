import type { AgentBattleReplayTimeline } from "@/lib/arena/agentBattleReplay";
import type { SimulationResult } from "@/lib/poker/types";

export type SharedAgentBattleCacheStatus = "hit" | "miss";

export type SharedAgentBattleLifecyclePhase = "playing" | "result_pause";

export type CachedSharedAgentBattleHand = {
  handId: string;
  startedAt: number;
  playingEndsAt: number;
  nextHandAt: number;
  expiresAt: number;
  generatedAt: number;
  finalResult: SimulationResult;
  timeline: AgentBattleReplayTimeline;
};

export const SHARED_ARENA_MEMORY_CACHE_NOTE =
  "In-memory cache is for demo/dev; production shared arena should use persistent storage.";

export type SharedAgentBattleStatusResponse = {
  ok: true;
  mode: "memory-cache";
  hasCurrentHand: boolean;
  handId: string | null;
  handIdShort: string | null;
  lifecyclePhase: SharedAgentBattleLifecyclePhase | null;
  startedAt: number | null;
  playingEndsAt: number | null;
  nextHandAt: number | null;
  expiresAt: number | null;
  serverNow: number;
  msUntilNextHand: number | null;
  resultPauseMs: number | null;
  cacheStatus: SharedAgentBattleCacheStatus | "none";
  note: string;
};

export type SharedAgentBattleStatusErrorResponse = {
  ok: false;
  error: string;
};

export type SharedAgentBattleCurrentResponse = {
  ok: true;
  handId: string;
  startedAt: number;
  /** When the animated timeline finishes on the server clock. */
  playingEndsAt: number;
  /** When the next shared hand will be generated. */
  nextHandAt: number;
  /** Pause duration after result before the next hand. */
  resultPauseMs: number;
  /** Milliseconds until the next hand from the server's perspective. */
  msUntilNextHand: number;
  expiresAt: number;
  generatedAt: number;
  serverNow: number;
  cacheStatus: SharedAgentBattleCacheStatus;
  lifecyclePhase: SharedAgentBattleLifecyclePhase;
  timeline: AgentBattleReplayTimeline;
  finalResult: SimulationResult;
};

export type SharedAgentBattleErrorResponse = {
  ok: false;
  error: string;
};

export type SharedAgentBattleApiResponse =
  | SharedAgentBattleCurrentResponse
  | SharedAgentBattleErrorResponse;

/** Map server clock to local startedAt so mid-hand joins seek correctly. */
export function mapSharedHandStartedAtToClient(
  startedAt: number,
  serverNow: number,
  clientNow: number = Date.now(),
): number {
  const serverElapsed = Math.max(0, serverNow - startedAt);
  return clientNow - serverElapsed;
}

export function formatCommunityCardsForDebug(
  cards: SimulationResult["communityCards"],
): string[] {
  return cards.slice(0, 5).map((card) => `${card.rank}${card.suit[0]}`);
}

/** Compact hand label for status/debug (not a full game id). */
export function formatShortSharedHandId(handId: string): string {
  const compact = handId.replace(/-/g, "");
  if (compact.length <= 8) return compact;
  return compact.slice(0, 6);
}
