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

/** Latest preflop-style agent decision for Agent Battle AI panel. */
export function pickLatestAgentBattleDecision(
  decisions: SimulationAgentDecision[],
): SimulationAgentDecision | undefined {
  if (decisions.length === 0) return undefined;

  for (let i = decisions.length - 1; i >= 0; i -= 1) {
    const d = decisions[i];
    if (d.action !== "check") return d;
  }

  return decisions[decisions.length - 1];
}
