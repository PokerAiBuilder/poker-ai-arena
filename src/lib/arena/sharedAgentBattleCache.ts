import {
  buildAgentBattleReplayTimeline,
} from "@/lib/arena/agentBattleReplay";
import { createInitialAgentBattleStacks } from "@/lib/analytics/agentBattleStacks";
import { simulateAgentBattle } from "@/lib/poker/engine";
import {
  SHARED_ARENA_MEMORY_CACHE_NOTE,
  formatShortSharedHandId,
  type CachedSharedAgentBattleHand,
  type SharedAgentBattleCacheStatus,
  type SharedAgentBattleLifecyclePhase,
  type SharedAgentBattleStatusResponse,
} from "@/lib/arena/sharedAgentBattleTypes";
import { getSharedAgentBattleStore } from "@/lib/arena/sharedAgentBattleStore";

/** Pause after result before the next shared hand is generated. */
export const SHARED_AGENT_BATTLE_RESULT_PAUSE_MS = 7_000;

export type { CachedSharedAgentBattleHand };

export type SharedAgentBattleCacheResult = {
  hand: CachedSharedAgentBattleHand;
  cacheStatus: SharedAgentBattleCacheStatus;
};

function deriveLifecyclePhase(
  serverNow: number,
  playingEndsAt: number,
): SharedAgentBattleLifecyclePhase {
  return serverNow < playingEndsAt ? "playing" : "result_pause";
}

/** Read the active shared hand without creating a new one. */
export function getCurrentSharedHand(
  nowMs: number = Date.now(),
): CachedSharedAgentBattleHand | null {
  const hand = getSharedAgentBattleStore().getCurrent();
  if (hand != null && nowMs < hand.expiresAt) {
    return hand;
  }
  return null;
}

/** @deprecated Prefer `getCurrentSharedHand` */
export const getCachedSharedAgentBattleHand = getCurrentSharedHand;

export function getOrCreateSharedHand(
  nowMs: number = Date.now(),
): SharedAgentBattleCacheResult {
  const store = getSharedAgentBattleStore();
  const cached = getCurrentSharedHand(nowMs);
  if (cached) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[shared-agent-battle/cache] hit", {
        handId: cached.handId,
        expiresAt: cached.expiresAt,
        msUntilNextHand: Math.max(0, cached.nextHandAt - nowMs),
      });
    }
    return { hand: cached, cacheStatus: "hit" };
  }

  const previousHandId = store.getCurrent()?.handId ?? null;

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

  store.setCurrent(hand);

  if (process.env.NODE_ENV === "development") {
    console.debug("[shared-agent-battle/cache] miss — generated hand", {
      previousHandId,
      handId: hand.handId,
      expiresAt: hand.expiresAt,
      timelineSteps: hand.timeline.steps.length,
      communityCards: hand.finalResult.communityCards.slice(0, 5),
      winner: hand.finalResult.winner.name,
    });
  }

  return { hand, cacheStatus: "miss" };
}

/** @deprecated Prefer `getOrCreateSharedHand` */
export const getOrCreateSharedAgentBattleHand = getOrCreateSharedHand;

/** Health/debug snapshot — does not create or mutate hands. */
export function getSharedArenaStatus(
  nowMs: number = Date.now(),
): SharedAgentBattleStatusResponse {
  const hand = getCurrentSharedHand(nowMs);
  const serverNow = nowMs;

  if (!hand) {
    return {
      ok: true,
      mode: "memory-cache",
      hasCurrentHand: false,
      handId: null,
      handIdShort: null,
      lifecyclePhase: null,
      startedAt: null,
      playingEndsAt: null,
      nextHandAt: null,
      expiresAt: null,
      serverNow,
      msUntilNextHand: null,
      resultPauseMs: SHARED_AGENT_BATTLE_RESULT_PAUSE_MS,
      cacheStatus: "none",
      note: SHARED_ARENA_MEMORY_CACHE_NOTE,
    };
  }

  const msUntilNextHand = Math.max(0, hand.nextHandAt - serverNow);

  return {
    ok: true,
    mode: "memory-cache",
    hasCurrentHand: true,
    handId: hand.handId,
    handIdShort: formatShortSharedHandId(hand.handId),
    lifecyclePhase: deriveLifecyclePhase(serverNow, hand.playingEndsAt),
    startedAt: hand.startedAt,
    playingEndsAt: hand.playingEndsAt,
    nextHandAt: hand.nextHandAt,
    expiresAt: hand.expiresAt,
    serverNow,
    msUntilNextHand,
    resultPauseMs: SHARED_AGENT_BATTLE_RESULT_PAUSE_MS,
    cacheStatus: "hit",
    note: SHARED_ARENA_MEMORY_CACHE_NOTE,
  };
}

/** Test helper — clears the in-memory shared hand. */
export function clearSharedHandForDev(): void {
  getSharedAgentBattleStore().clear();
}

/** @deprecated Prefer `clearSharedHandForDev` */
export const resetSharedAgentBattleCacheForTests = clearSharedHandForDev;
