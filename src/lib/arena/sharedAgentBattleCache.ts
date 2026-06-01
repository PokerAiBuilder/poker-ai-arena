import {
  buildAgentBattleReplayTimeline,
  type AgentBattleReplayTimeline,
} from "@/lib/arena/agentBattleReplay";
import { createInitialAgentBattleStacks } from "@/lib/analytics/agentBattleStacks";
import { simulateAgentBattle } from "@/lib/poker/engine";
import type { SimulationResult } from "@/lib/poker/types";

/** Pause after result before the next shared hand is generated. */
export const SHARED_AGENT_BATTLE_RESULT_PAUSE_MS = 7_000;

export type CachedSharedAgentBattleHand = {
  handId: string;
  startedAt: number;
  /** When the animated timeline finishes. */
  playingEndsAt: number;
  /** When the next shared hand will be generated. */
  nextHandAt: number;
  expiresAt: number;
  generatedAt: number;
  finalResult: SimulationResult;
  timeline: AgentBattleReplayTimeline;
};

export type SharedAgentBattleCacheResult = {
  hand: CachedSharedAgentBattleHand;
  cacheStatus: "hit" | "miss";
};

const GLOBAL_CACHE_KEY = "__POKER_AI_SHARED_AGENT_BATTLE_CACHE__";

type GlobalSharedAgentBattleCacheStore = {
  current: CachedSharedAgentBattleHand | null;
};

function getGlobalCacheStore(): GlobalSharedAgentBattleCacheStore {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_CACHE_KEY]?: GlobalSharedAgentBattleCacheStore;
  };
  if (!globalScope[GLOBAL_CACHE_KEY]) {
    globalScope[GLOBAL_CACHE_KEY] = { current: null };
  }
  return globalScope[GLOBAL_CACHE_KEY];
}

export function getCachedSharedAgentBattleHand(
  nowMs: number = Date.now(),
): CachedSharedAgentBattleHand | null {
  const store = getGlobalCacheStore();
  if (store.current != null && nowMs < store.current.expiresAt) {
    return store.current;
  }
  return null;
}

export function getOrCreateSharedAgentBattleHand(
  nowMs: number = Date.now(),
): SharedAgentBattleCacheResult {
  const store = getGlobalCacheStore();
  const cached = getCachedSharedAgentBattleHand(nowMs);
  if (cached) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[shared-agent-battle/cache] hit", {
        handId: cached.handId,
        expiresAt: cached.expiresAt,
      });
    }
    return { hand: cached, cacheStatus: "hit" };
  }

  const startingStacks = createInitialAgentBattleStacks();
  const finalResult = simulateAgentBattle(startingStacks);
  const timeline = buildAgentBattleReplayTimeline(finalResult);
  const startedAt = nowMs;
  const playingEndsAt = startedAt + timeline.totalDurationMs;
  const nextHandAt = playingEndsAt + SHARED_AGENT_BATTLE_RESULT_PAUSE_MS;
  const expiresAt = nextHandAt;

  const hand: CachedSharedAgentBattleHand = {
    handId: finalResult.gameId,
    startedAt,
    playingEndsAt,
    nextHandAt,
    expiresAt,
    generatedAt: nowMs,
    finalResult,
    timeline,
  };

  store.current = hand;

  if (process.env.NODE_ENV === "development") {
    console.debug("[shared-agent-battle/cache] miss — generated hand", {
      handId: hand.handId,
      expiresAt: hand.expiresAt,
      timelineSteps: hand.timeline.steps.length,
      communityCards: hand.finalResult.communityCards.slice(0, 5),
      winner: hand.finalResult.winner.name,
    });
  }

  return { hand, cacheStatus: "miss" };
}

/** Test helper — clears global cache. */
export function resetSharedAgentBattleCacheForTests(): void {
  getGlobalCacheStore().current = null;
}
