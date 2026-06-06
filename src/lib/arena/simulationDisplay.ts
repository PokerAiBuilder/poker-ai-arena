import type { GameMode, SimulationAgentDecision, SimulationResult } from "@/lib/poker/types";

export type HandResultDisplayType = "fold" | "showdown";

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
