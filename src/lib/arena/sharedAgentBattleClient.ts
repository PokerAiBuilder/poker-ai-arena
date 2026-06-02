import type { AgentBattleReplayTimeline } from "@/lib/arena/agentBattleReplay";
import {
  formatCommunityCardsForDebug,
  mapSharedHandStartedAtToClient,
  type SharedAgentBattleCurrentResponse,
  type SharedAgentBattleApiResponse,
  type SharedAgentBattleCacheStatus,
} from "@/lib/arena/sharedAgentBattleTypes";
import type { SimulationResult } from "@/lib/poker/types";

export type SharedAgentBattleJoinPayload = {
  handId: string;
  finalResult: SimulationResult;
  timeline: AgentBattleReplayTimeline;
  clientStartedAt: number;
  isShared: true;
  cacheStatus: SharedAgentBattleCacheStatus;
  lifecyclePhase: SharedAgentBattleCurrentResponse["lifecyclePhase"];
  serverNow: number;
  startedAt: number;
  playingEndsAt: number;
  nextHandAt: number;
  resultPauseMs: number;
  msUntilNextHand: number;
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
    !isFiniteNumber(body.playingEndsAt) ||
    !isFiniteNumber(body.nextHandAt) ||
    !isFiniteNumber(body.resultPauseMs) ||
    !isFiniteNumber(body.msUntilNextHand) ||
    !isFiniteNumber(body.expiresAt) ||
    !isFiniteNumber(body.generatedAt) ||
    !isFiniteNumber(body.serverNow) ||
    (body.cacheStatus !== "hit" && body.cacheStatus !== "miss") ||
    (body.lifecyclePhase !== "playing" && body.lifecyclePhase !== "result_pause") ||
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

  if (body.expiresAt !== body.nextHandAt) {
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

/** Optional dev health snapshot — not used for gameplay. */
export async function logSharedArenaStatusForDebug(): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;
  try {
    const response = await fetch("/api/arena/agent-battle/status", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const data: unknown = await response.json();
    console.debug("[arena/shared-agent-battle/status]", data);
  } catch {
    // ignore debug-only failures
  }
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
      lifecyclePhase: parsed.lifecyclePhase,
      serverNow: parsed.serverNow,
      startedAt: parsed.startedAt,
      playingEndsAt: parsed.playingEndsAt,
      nextHandAt: parsed.nextHandAt,
      resultPauseMs: parsed.resultPauseMs,
      msUntilNextHand: parsed.msUntilNextHand,
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
    void logSharedArenaStatusForDebug();

    return { ok: true, payload };
  } catch (error) {
    return {
      ok: false,
      reason: "network",
      detail: error instanceof Error ? error.message : "fetch failed",
    };
  }
}
