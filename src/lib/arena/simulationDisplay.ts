import type { Card, GameMode, GameStage, SimulationAgentDecision, SimulationResult } from "@/lib/poker/types";

export type HandResultDisplayType = "fold" | "showdown";

export type AgentBattleBoardRevealInput = {
  /** Number of community cards currently face-up (0–5). */
  visibleCount?: number;
  street?: GameStage | "preflop" | "flop" | "turn" | "river" | "showdown" | "complete";
  showResult?: boolean;
  status?: "loading" | "playing" | "result" | "complete" | "unknown";
};

/**
 * Agent Battle board reveal — how many of 5 community cards should be face-up.
 * Safe default: 0 (hidden) when state is unknown or loading.
 */
export function getVisibleBoardCount(input: AgentBattleBoardRevealInput): number {
  if (input.showResult || input.status === "result" || input.status === "complete") {
    return 5;
  }

  if (typeof input.visibleCount === "number") {
    return Math.max(0, Math.min(5, Math.floor(input.visibleCount)));
  }

  if (input.street) {
    switch (input.street) {
      case "preflop":
        return 0;
      case "flop":
        return 3;
      case "turn":
        return 4;
      case "river":
      case "showdown":
      case "complete":
        return 5;
      default:
        return 0;
    }
  }

  if (
    input.status === "loading" ||
    input.status === "playing" ||
    input.status === "unknown" ||
    input.status == null
  ) {
    return 0;
  }

  return 0;
}

/** Slice full board to the number of face-up cards for display pipelines. */
export function sliceVisibleCommunityCards(
  fullBoard: Card[],
  visibleCount: number,
): Card[] {
  return fullBoard.slice(0, getVisibleBoardCount({ visibleCount }));
}

export function isWinByFoldResult(result: SimulationResult): boolean {
  return result.winningHand.rankName === "Win by fold";
}

export function getHandResultDisplayType(
  result: SimulationResult,
): HandResultDisplayType {
  return isWinByFoldResult(result) ? "fold" : "showdown";
}

/** Prefer evaluated winner hand over stored summary when both exist. */
export function resolveSimulationWinningHandName(
  result: SimulationResult,
): string | undefined {
  if (isWinByFoldResult(result)) return undefined;

  const winnerPlayer = result.players.find((player) => player.id === result.winner.id);
  if (winnerPlayer?.finalHand?.rankName) {
    return winnerPlayer.finalHand.rankName;
  }

  return result.winningHand.rankName;
}

/**
 * UI-only hole-card visibility (engine still returns full simulation data).
 */
export function shouldRevealHoleCards(
  playerId: string,
  result: SimulationResult | null,
  gameMode: GameMode,
  options?: { forceIdle?: boolean },
): boolean {
  if (!result || options?.forceIdle) return false;

  const player = result.players.find((p) => p.id === playerId);
  if (!player) return false;

  if (gameMode === "agent-vs-agent") {
    return true;
  }

  if (playerId === "human") {
    return true;
  }

  if (isWinByFoldResult(result)) {
    return result.winner.id === playerId;
  }

  return true;
}

/** Latest meaningful Agent Battle decision — prefers postflop over preflop. */
export function pickLatestAgentBattleDecision(
  decisions: SimulationAgentDecision[],
): SimulationAgentDecision | undefined {
  if (decisions.length === 0) return undefined;

  for (let i = decisions.length - 1; i >= 0; i -= 1) {
    const decision = decisions[i];
    if (decision.stage !== "preflop") return decision;
  }

  return decisions[decisions.length - 1];
}
