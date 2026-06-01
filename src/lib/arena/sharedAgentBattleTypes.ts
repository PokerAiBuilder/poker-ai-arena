import type { AgentBattleReplayTimeline } from "@/lib/arena/agentBattleReplay";
import type { SimulationResult } from "@/lib/poker/types";

export type SharedAgentBattleCacheStatus = "hit" | "miss";

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
  lifecyclePhase: "playing" | "result_pause";
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
