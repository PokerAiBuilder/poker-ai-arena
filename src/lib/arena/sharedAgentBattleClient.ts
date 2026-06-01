import type { AgentBattleReplayTimeline } from "@/lib/arena/agentBattleReplay";
import {
  formatCommunityCardsForDebug,
  mapSharedHandStartedAtToClient,
  type SharedAgentBattleApiResponse,
  type SharedAgentBattleCacheStatus,
  type SharedAgentBattleCurrentResponse,
} from "@/lib/arena/sharedAgentBattleTypes";
import type { SimulationResult } from "@/lib/poker/types";

export type SharedAgentBattleJoinPayload = {
  handId: string;
  finalResult: SimulationResult;
  timeline: AgentBattleReplayTimeline;
  clientStartedAt: number;
  isShared: true;
  cacheStatus: SharedAgentBattleCacheStatus;
  serverNow: number;
  startedAt: number;
  expiresAt: number;
  generatedAt: number;
};

export type SharedAgentBattleFetchFailureReason =
  | "network"
  | "http"
  | "invalid-response"
  | "expired";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidTimeline(value: unknown): value is AgentBattleReplayTimeline {
  if (!value || typeof value !== "object") return false;
  const timeline = value as AgentBattleReplayTimeline;
  return (
    typeof timeline.handId === "string" &&
    isFiniteNumber(timeline.totalDurationMs) &&
    timeline.totalDurationMs > 0 &&
    Array.isArray(timeline.steps)
  );
}

function isValidFinalResult(value: unknown): value is SimulationResult {
  if (!value || typeof value !== "object") return false;
  const result = value as SimulationResult;
  return (
    result.gameMode === "agent-vs-agent" &&
    typeof result.gameId === "string" &&
    Array.isArray(result.communityCards) &&
    Array.isArray(result.actionLog) &&
    Array.isArray(result.agentDecisions) &&
    result.winner != null &&
    typeof result.winner.id === "string" &&
    typeof result.winner.name === "string"
  );
}

export function parseSharedAgentBattleResponse(
  data: unknown,
): SharedAgentBattleCurrentResponse | null {
  if (!data || typeof data !== "object") return null;
  const body = data as SharedAgentBattleApiResponse;
  if (body.ok !== true) return null;

  if (
    typeof body.handId !== "string" ||
    !isFiniteNumber(body.startedAt) ||
    !isFiniteNumber(body.expiresAt) ||
    !isFiniteNumber(body.generatedAt) ||
    !isFiniteNumber(body.serverNow) ||
    (body.cacheStatus !== "hit" && body.cacheStatus !== "miss") ||
    !isValidTimeline(body.timeline) ||
    !isValidFinalResult(body.finalResult)
  ) {
    return null;
  }

  if (
    body.handId !== body.finalResult.gameId ||
    body.timeline.handId !== body.finalResult.gameId
  ) {
    return null;
  }

  return body;
}

export function logSharedAgentBattleDebug(
  source: "shared-api" | "local-fallback",
  info: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug(`[arena/shared-agent-battle] ${source}`, info);
}

export async function fetchSharedAgentBattleCurrent(): Promise<
  | { ok: true; payload: SharedAgentBattleJoinPayload }
  | { ok: false; reason: SharedAgentBattleFetchFailureReason; detail?: string }
> {
  try {
    const response = await fetch("/api/arena/agent-battle/current", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return { ok: false, reason: "http", detail: String(response.status) };
    }

    const data: unknown = await response.json();
    const parsed = parseSharedAgentBattleResponse(data);
    if (!parsed) {
      logSharedAgentBattleDebug("local-fallback", {
        reason: "invalid-response",
        raw: data,
      });
      return { ok: false, reason: "invalid-response" };
    }

    if (parsed.serverNow >= parsed.expiresAt) {
      return { ok: false, reason: "expired" };
    }

    const clientNow = Date.now();
    const payload: SharedAgentBattleJoinPayload = {
      handId: parsed.handId,
      finalResult: parsed.finalResult,
      timeline: parsed.timeline,
      clientStartedAt: mapSharedHandStartedAtToClient(
        parsed.startedAt,
        parsed.serverNow,
        clientNow,
      ),
      isShared: true,
      cacheStatus: parsed.cacheStatus,
      serverNow: parsed.serverNow,
      startedAt: parsed.startedAt,
      expiresAt: parsed.expiresAt,
      generatedAt: parsed.generatedAt,
    };

    logSharedAgentBattleDebug("shared-api", {
      cacheStatus: parsed.cacheStatus,
      handId: parsed.handId,
      startedAt: parsed.startedAt,
      serverNow: parsed.serverNow,
      expiresAt: parsed.expiresAt,
      generatedAt: parsed.generatedAt,
      timelineSteps: parsed.timeline.steps.length,
      communityCards: formatCommunityCardsForDebug(parsed.finalResult.communityCards),
      winner: parsed.finalResult.winner.name,
    });

    return { ok: true, payload };
  } catch (error) {
    return {
      ok: false,
      reason: "network",
      detail: error instanceof Error ? error.message : "fetch failed",
    };
  }
}
