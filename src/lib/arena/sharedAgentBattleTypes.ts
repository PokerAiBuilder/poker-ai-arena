import type { AgentBattleReplayTimeline } from "@/lib/arena/agentBattleReplay";
import type { SimulationResult } from "@/lib/poker/types";

export type SharedAgentBattleCacheStatus = "hit" | "miss";

export type SharedAgentBattleCurrentResponse = {
  ok: true;
  handId: string;
  startedAt: number;
  expiresAt: number;
  generatedAt: number;
  serverNow: number;
  cacheStatus: SharedAgentBattleCacheStatus;
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
