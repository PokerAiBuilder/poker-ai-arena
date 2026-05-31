import type { GameState, Player } from "@/lib/poker/types";

/** Agent Battle-only raise ladder (Human vs AI uses separate sizing). */
export const AGENT_BATTLE_RAISE_SMALL = 25;
export const AGENT_BATTLE_RAISE_STANDARD = 50;
export const AGENT_BATTLE_RAISE_PRESSURE = 75;
export const AGENT_BATTLE_RAISE_BIG = 100;
export const AGENT_BATTLE_POT_MIN = 75;
export const AGENT_BATTLE_PREMIUM_MIN = 100;

export type AgentBattleRaiseTier =
  | "small"
  | "standard"
  | "pressure"
  | "big"
  | "pot"
  | "premium";

function tierIncrement(
  tier: AgentBattleRaiseTier,
  state: GameState,
  player: Player,
): number {
  const toCall = Math.max(0, state.currentBet - player.currentBet);
  let increment: number;

  switch (tier) {
    case "small":
      increment = AGENT_BATTLE_RAISE_SMALL;
      break;
    case "standard":
      increment = AGENT_BATTLE_RAISE_STANDARD;
      break;
    case "pressure":
      increment = AGENT_BATTLE_RAISE_PRESSURE;
      break;
    case "big":
      increment = AGENT_BATTLE_RAISE_BIG;
      break;
    case "pot": {
      const potRatio = Math.floor(state.pot * 0.75);
      increment = Math.max(AGENT_BATTLE_POT_MIN, Math.min(potRatio, state.pot));
      break;
    }
    case "premium": {
      const premiumRatio = Math.floor(state.pot * 1.25);
      increment = Math.max(AGENT_BATTLE_PREMIUM_MIN, premiumRatio);
      break;
    }
    default:
      increment = AGENT_BATTLE_RAISE_STANDARD;
  }

  const maxAffordable = Math.max(0, player.stack - 1 - toCall);
  const perActionCap = Math.max(
    AGENT_BATTLE_RAISE_BIG,
    Math.floor(player.stack * 0.35),
  );
  return Math.min(increment, maxAffordable, perActionCap);
}

/** Target street bet level after raise (not chip delta). Capped to avoid all-in. */
export function computeAgentBattleRaiseTotal(
  player: Player,
  state: GameState,
  tier: AgentBattleRaiseTier,
): number {
  const increment = tierIncrement(tier, state, player);
  const minTotal = state.currentBet + Math.max(increment, state.bigBlind);
  let targetTotal = state.currentBet + increment;

  if (targetTotal < minTotal) targetTotal = minTotal;

  const reserve = 1;
  const maxTotal = player.currentBet + Math.max(0, player.stack - reserve);

  if (maxTotal <= state.currentBet) {
    return state.currentBet;
  }

  return Math.min(Math.floor(targetTotal), Math.floor(maxTotal));
}

export function agentBattleRaiseIncrement(
  player: Player,
  state: GameState,
  tier: AgentBattleRaiseTier,
): number {
  const total = computeAgentBattleRaiseTotal(player, state, tier);
  return Math.max(0, total - state.currentBet);
}

export function formatRaiseIncrementLabel(increment: number): string {
  return `+${increment}`;
}

export type AgentBattleSizingIntent = "value" | "semi_bluff" | "bluff" | "thin";

/** Pick raise tier from hand strength, board, and agent style. */
export function pickAgentBattleRaiseTier(
  intent: AgentBattleSizingIntent,
  opts: {
    isMonster?: boolean;
    isStrongMade?: boolean;
    isTopPair?: boolean;
    isComboDraw?: boolean;
    dryBoard?: boolean;
    scaryBoard?: boolean;
    aggressive?: boolean;
    tight?: boolean;
    river?: boolean;
  },
): AgentBattleRaiseTier {
  const {
    isMonster,
    isStrongMade,
    isTopPair,
    isComboDraw,
    dryBoard,
    scaryBoard,
    aggressive,
    tight,
    river,
  } = opts;

  if (intent === "bluff") {
    if (aggressive) return isComboDraw ? "standard" : "small";
    return "small";
  }

  if (intent === "semi_bluff") {
    if (isComboDraw) return aggressive ? "big" : "standard";
    if (aggressive) return "standard";
    return "small";
  }

  if (isMonster) {
    if (dryBoard && !tight) return aggressive ? "premium" : "pot";
    if (scaryBoard) return aggressive ? "pot" : "big";
    return river ? "pot" : "premium";
  }

  if (isStrongMade) {
    if (dryBoard) return tight ? "big" : aggressive ? "pot" : "big";
    if (scaryBoard) return tight ? "standard" : "big";
    return "big";
  }

  if (isTopPair) {
    if (dryBoard) return tight ? "standard" : "standard";
    return intent === "thin" ? "small" : "standard";
  }

  if (intent === "thin") return "small";
  return "standard";
}
