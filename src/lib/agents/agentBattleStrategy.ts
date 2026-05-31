import { BluffBot, ChipHunter, RiverMind } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import type { Card, GameState, Player } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";
import { amountToCall } from "@/lib/poker/betting";
import {
  type AgentBattleRaiseTier,
  computeAgentBattleRaiseTotal,
} from "@/lib/poker/agentBattleSizing";

const HIGH_RANK = 11; // J+
const TRASH_SCORE = 16;

function cardValue(rank: Card["rank"]): number {
  return RANK_VALUES[rank];
}

function preflopScore(holeCards: Card[]): number {
  if (holeCards.length !== 2) return 0;
  const [a, b] = holeCards.map((c) => cardValue(c.rank));
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const pair = a === b;
  const suited = holeCards[0].suit === holeCards[1].suit;

  if (pair) return high * 4 + 10;
  if (suited && high >= 10) return high + low + 8;
  if (high >= HIGH_RANK && low >= 9) return high + low + 6;
  if (high >= HIGH_RANK) return high + low * 0.75;
  if (suited && high >= 8) return high + low * 0.55;
  return high + low * 0.45;
}

function isSuited(holeCards: Card[]): boolean {
  return holeCards.length === 2 && holeCards[0].suit === holeCards[1].suit;
}

function isSuitedConnector(holeCards: Card[]): boolean {
  if (!isSuited(holeCards)) return false;
  const [a, b] = holeCards.map((c) => cardValue(c.rank)).sort((x, y) => x - y);
  return b - a <= 3 && b >= 7;
}

function isBroadway(holeCards: Card[]): boolean {
  return (
    holeCards.length === 2 &&
    cardValue(holeCards[0].rank) >= 10 &&
    cardValue(holeCards[1].rank) >= 10
  );
}

function isPaired(holeCards: Card[]): boolean {
  return holeCards.length === 2 && holeCards[0].rank === holeCards[1].rank;
}

function isPlayableShape(holeCards: Card[]): boolean {
  return (
    isBroadway(holeCards) ||
    isSuited(holeCards) ||
    isSuitedConnector(holeCards) ||
    isPaired(holeCards)
  );
}

function isTrash(score: number): boolean {
  return score < TRASH_SCORE;
}

function activeCount(state: GameState): number {
  return state.players.filter((p) => !p.hasFolded).length;
}

function bluffBotBluffSpot(holeCards: Card[]): boolean {
  const seed = holeCards.reduce((sum, c) => sum + cardValue(c.rank), 0);
  return seed % 3 !== 0;
}

function bluffBotHeavyBluff(holeCards: Card[]): boolean {
  const seed = holeCards.reduce((sum, c) => sum + cardValue(c.rank), 0);
  return seed % 4 === 0;
}

type PressureLevel = "small" | "medium" | "large";

function pressureLevel(toCall: number, bb: number): PressureLevel {
  if (toCall <= bb * 5) return "small";
  if (toCall <= bb * 15) return "medium";
  return "large";
}

function callDecision(amount: number, reasoning: string, confidence: number): AgentDecision {
  return { action: "call", amount, confidence, reasoning };
}

function foldDecision(reasoning: string, confidence = 0.82): AgentDecision {
  return { action: "fold", confidence, reasoning };
}

function checkDecision(reasoning: string, confidence = 0.62): AgentDecision {
  return { action: "check", confidence, reasoning };
}

function raiseWithTier(
  player: Player,
  state: GameState,
  tier: AgentBattleRaiseTier,
  reasoning: string,
  confidence: number,
): AgentDecision {
  return {
    action: "raise",
    amount: computeAgentBattleRaiseTotal(player, state, tier),
    confidence,
    reasoning,
  };
}

function applyShowdownGuard(
  decision: AgentDecision,
  player: Player,
  state: GameState,
  score: number,
  holeCards: Card[],
): AgentDecision {
  if (decision.action !== "fold") return decision;

  const active = activeCount(state);
  const toCall = amountToCall(player, state.currentBet);
  const playable = isPlayableShape(holeCards);
  const cheap = toCall <= state.bigBlind * 6;

  if (isTrash(score) && !(active === 2 && cheap)) {
    return decision;
  }

  if (active === 2 && toCall <= player.stack - 1) {
    return callDecision(
      toCall,
      "heads-up pot building — too much action to fold now",
      0.58,
    );
  }

  if (active === 3) {
    if (score >= 18 && toCall <= 220) {
      return callDecision(toCall, "keeping three-way action alive", 0.54);
    }
    if (playable && toCall <= 180) {
      return callDecision(toCall, "playable hand — keeping the table contested", 0.52);
    }
  }

  if (active >= 4 && playable && score >= 20 && toCall <= 130) {
    return callDecision(
      toCall,
      "early multi-way — staying in with a playable hand",
      0.5,
    );
  }

  return decision;
}

function defendVsPressure(
  player: Player,
  state: GameState,
  score: number,
  toCall: number,
  opts: {
    callMaxMedium: number;
    callMaxLarge: number;
    reraiseTier?: AgentBattleRaiseTier;
    reraiseMinScore?: number;
    callReason: string;
    foldReason: string;
    reraiseReason?: string;
    loose?: boolean;
  },
): AgentDecision {
  const pressure = pressureLevel(toCall, state.bigBlind);

  if (
    opts.reraiseTier &&
    opts.reraiseReason &&
    (opts.reraiseMinScore ?? 60) <= score &&
    pressure !== "large"
  ) {
    return raiseWithTier(
      player,
      state,
      opts.reraiseTier,
      opts.reraiseReason,
      0.82,
    );
  }

  if (pressure === "small" && toCall <= opts.callMaxMedium) {
    return callDecision(toCall, opts.callReason, 0.76);
  }

  if (pressure === "medium" && score >= (opts.loose ? 16 : 20) && toCall <= opts.callMaxMedium) {
    return callDecision(toCall, opts.callReason, 0.74);
  }

  if (pressure === "medium" && score >= (opts.loose ? 28 : 34) && toCall <= opts.callMaxLarge) {
    return callDecision(toCall, opts.callReason, 0.7);
  }

  if (pressure === "large" && score >= (opts.loose ? 38 : 46) && toCall <= opts.callMaxLarge) {
    return callDecision(toCall, opts.callReason, 0.72);
  }

  if (opts.loose && playableContinue(score, toCall, state.bigBlind)) {
    return callDecision(toCall, opts.callReason, 0.6);
  }

  if (toCall <= state.bigBlind * 6 && score >= 18) {
    return callDecision(toCall, opts.callReason, 0.62);
  }

  return foldDecision(opts.foldReason);
}

function playableContinue(score: number, toCall: number, bb: number): boolean {
  return toCall <= bb * 12 && score >= 16;
}

function pokerMasterPreflop(
  player: Player,
  score: number,
  canCheck: boolean,
  toCall: number,
  state: GameState,
  holeCards: Card[],
): AgentDecision {
  const playable = isPlayableShape(holeCards);

  if (score >= 72) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        score >= 78 ? "premium" : "pot",
        "premium hand — balanced pot-pressure raise",
        0.9,
      );
    }
    if (toCall <= 180) {
      return raiseWithTier(
        player,
        state,
        "big",
        "strong range — balanced +100 re-raise",
        0.86,
      );
    }
    return callDecision(toCall, "premium hand — balanced call", 0.82);
  }

  if (score >= 55) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        score >= 62 ? "pot" : "big",
        "strong hand — balanced +100 or pot raise",
        0.84,
      );
    }
    return defendVsPressure(player, state, score, toCall, {
      callMaxMedium: 180,
      callMaxLarge: 260,
      reraiseTier: "big",
      reraiseMinScore: 58,
      callReason: "balanced range continues",
      foldReason: "balanced pass under heavy pressure",
      reraiseReason: "balanced re-raise with a strong hand",
    });
  }

  if (score >= 38 || playable) {
    if (canCheck) {
      return score >= 42
        ? raiseWithTier(
            player,
            state,
            "standard",
            "medium hand — balanced +50 raise",
            0.72,
          )
        : checkDecision("medium hand — balanced pot control", 0.68);
    }
    return defendVsPressure(player, state, score, toCall, {
      callMaxMedium: 150,
      callMaxLarge: 220,
      callReason: "balanced range continues",
      foldReason: "balanced line passes on pressure",
    });
  }

  if (canCheck) return checkDecision("marginal hand — balanced check", 0.6);
  if (toCall <= 100 && playable) {
    return callDecision(toCall, "suited, pair, or broadway — cheap continue", 0.64);
  }
  if (toCall <= 75 && score >= 20) {
    return callDecision(toCall, "balanced range defends a small price", 0.58);
  }
  return foldDecision("balanced pass on a weak spot");
}

function bluffBotPreflop(
  player: Player,
  score: number,
  canCheck: boolean,
  toCall: number,
  state: GameState,
  holeCards: Card[],
): AgentDecision {
  const bluffTier: AgentBattleRaiseTier = bluffBotHeavyBluff(holeCards)
    ? "big"
    : "standard";

  if (bluffBotBluffSpot(holeCards)) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        bluffTier,
        bluffTier === "big"
          ? "pressure bluff — BluffBot fires +100"
          : "speculative bluff — BluffBot raises +50",
        0.52,
      );
    }
    if (toCall <= 200) {
      return raiseWithTier(
        player,
        state,
        bluffBotHeavyBluff(holeCards) ? "pressure" : "standard",
        "bluff profile re-raises to keep heat on",
        0.55,
      );
    }
  }

  if (score >= 45 || isSuitedConnector(holeCards) || isBroadway(holeCards) || isPaired(holeCards)) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        score >= 55 ? "pot" : "standard",
        score >= 55
          ? "playable hand — BluffBot pot-pressure raise"
          : "playable hand — BluffBot raises +50",
        0.74,
      );
    }
    if (toCall <= 220) {
      return score >= 50 && toCall <= 160
        ? raiseWithTier(
            player,
            state,
            "big",
            "BluffBot re-raises +100 — keeping heat on",
            0.68,
          )
        : callDecision(toCall, "BluffBot calls — staying in the action", 0.72);
    }
  }

  if (canCheck) {
    return raiseWithTier(
      player,
      state,
      bluffBotHeavyBluff(holeCards) ? "big" : "standard",
      "BluffBot steals with a wide raise",
      0.62,
    );
  }

  if (toCall <= 180) {
    return callDecision(toCall, "BluffBot calls wide — action over fold", 0.68);
  }

  if (toCall <= 240 && score >= 16) {
    return callDecision(toCall, "loose call — BluffBot wants a contested pot", 0.56);
  }

  if (toCall <= 120 && isPlayableShape(holeCards)) {
    return callDecision(toCall, "BluffBot peels with a playable hand", 0.54);
  }

  return foldDecision("BluffBot finally releases a dead hand");
}

function riverMindPreflop(
  player: Player,
  score: number,
  canCheck: boolean,
  toCall: number,
  state: GameState,
  holeCards: Card[],
): AgentDecision {
  const playable = isPlayableShape(holeCards);

  if (score >= 68) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        score >= 74 ? "big" : "pressure",
        "strong holding — tight +75/+100 value raise",
        0.9,
      );
    }
    return defendVsPressure(player, state, score, toCall, {
      callMaxMedium: 160,
      callMaxLarge: 240,
      reraiseTier: "pressure",
      reraiseMinScore: 72,
      callReason: "strong hand — tight call for value",
      foldReason: "RiverMind folds — tight profile avoids heavy pressure",
      reraiseReason: "tight value re-raise",
    });
  }

  if (score >= 44 || (playable && score >= 28)) {
    if (canCheck) return checkDecision("playable hand — tight pot control", 0.72);
    return defendVsPressure(player, state, score, toCall, {
      callMaxMedium: 120,
      callMaxLarge: 180,
      callReason: "suited, pair, or broadway — tight continue",
      foldReason: "RiverMind folds — tight profile avoids heavy pressure",
    });
  }

  if (canCheck) return checkDecision("marginal hand — tight check", 0.66);
  if (playable && toCall <= 100 && score >= 24) {
    return callDecision(toCall, "pair or suited — tight but playable continue", 0.62);
  }
  if (toCall <= 75 && score >= 26 && playable) {
    return callDecision(toCall, "suited or broadway — tight but in", 0.6);
  }
  return foldDecision("RiverMind folds — tight profile avoids weak holdings");
}

function chipHunterPreflop(
  player: Player,
  score: number,
  canCheck: boolean,
  toCall: number,
  state: GameState,
  holeCards: Card[],
): AgentDecision {
  const hasShape =
    isSuitedConnector(holeCards) || isBroadway(holeCards) || isSuited(holeCards);

  if (score >= 58 || (hasShape && score >= 28)) {
    if (canCheck) {
      return raiseWithTier(
        player,
        state,
        score >= 65 ? "premium" : "pot",
        "ChipHunter attacks the pot with strength or a draw",
        0.86,
      );
    }
    if (toCall <= 220) {
      return raiseWithTier(
        player,
        state,
        score >= 50 ? "premium" : "big",
        "ChipHunter re-raises — building the pot",
        0.84,
      );
    }
    return callDecision(toCall, "ChipHunter calls — keeping initiative", 0.78);
  }

  if (canCheck) {
    return raiseWithTier(
      player,
      state,
      hasShape || score >= 26 ? "big" : "pressure",
      hasShape
        ? "ChipHunter opens +100 — aggressive pressure"
        : "ChipHunter opens +75 — aggressive steal",
      0.72,
    );
  }

  if (toCall <= 200) {
    return callDecision(toCall, "ChipHunter calls — aggressive wide defense", 0.72);
  }

  if (toCall <= 260 && (hasShape || score >= 20)) {
    return callDecision(toCall, "draw or equity — ChipHunter stays in", 0.66);
  }

  if (toCall <= 120 && score >= 18) {
    return callDecision(toCall, "ChipHunter defends to keep action alive", 0.58);
  }

  return foldDecision("ChipHunter releases a hopeless hand");
}

export function getAgentBattlePreflopDecision(
  player: Player,
  state: GameState,
): AgentDecision {
  const toCall = amountToCall(player, state.currentBet);
  const canCheck = toCall === 0;
  const score = preflopScore(player.holeCards);
  const holeCards = player.holeCards;

  let decision: AgentDecision;

  switch (player.id) {
    case PokerMaster.id:
      decision = pokerMasterPreflop(player, score, canCheck, toCall, state, holeCards);
      break;
    case BluffBot.id:
      decision = bluffBotPreflop(player, score, canCheck, toCall, state, holeCards);
      break;
    case RiverMind.id:
      decision = riverMindPreflop(player, score, canCheck, toCall, state, holeCards);
      break;
    case ChipHunter.id:
      decision = chipHunterPreflop(player, score, canCheck, toCall, state, holeCards);
      break;
    default:
      decision = canCheck
        ? checkDecision("default check")
        : callDecision(toCall, "default call", 0.5);
      break;
  }

  return applyShowdownGuard(decision, player, state, score, holeCards);
}

export function formatAgentBattleLogMessage(
  agentName: string,
  agentId: string,
  decision: AgentDecision,
  toCall: number,
  displayAmount?: number,
  stage: GameState["stage"] = "preflop",
): string {
  const { action } = decision;
  const isPostflop = stage !== "preflop" && stage !== "showdown";
  const reasoning = decision.reasoning?.trim();

  if (reasoning && isPostflop) {
    if (action === "raise") {
      const inc = displayAmount ?? 0;
      if (toCall === 0) {
        return `${agentName} bets ${inc} — ${reasoning}`;
      }
      return `${agentName} raises +${inc} — ${reasoning}`;
    }
    if (action === "call") {
      const amt = displayAmount ?? decision.amount ?? toCall;
      return `${agentName} calls ${amt} — ${reasoning}`;
    }
    if (action === "check") {
      return `${agentName} checks — ${reasoning}`;
    }
    if (action === "fold") {
      return `${agentName} folds — ${reasoning}`;
    }
    if (action === "all-in") {
      return `${agentName} goes all-in — ${reasoning}`;
    }
  }

  const street =
    stage === "flop" ? "flop" : stage === "turn" ? "turn" : stage === "river" ? "river" : "street";

  if (action === "fold") {
    if (isPostflop) {
      if (agentId === RiverMind.id) {
        return `${agentName} folds — tight profile avoids pressure.`;
      }
      if (agentId === BluffBot.id) {
        return `${agentName} folds — rare give-up from BluffBot.`;
      }
      if (agentId === ChipHunter.id) {
        return `${agentName} folds — no equity left to press.`;
      }
      return `${agentName} folds — balanced pass on a bad spot.`;
    }
    if (agentId === RiverMind.id) {
      return `${agentName} folds — tight profile avoids heavy pressure.`;
    }
    if (agentId === BluffBot.id) {
      return `${agentName} folds — rare give-up from BluffBot.`;
    }
    if (agentId === ChipHunter.id) {
      return `${agentName} folds — no equity left to press.`;
    }
    return `${agentName} folds — balanced pass on a bad spot.`;
  }

  if (action === "check") {
    if (isPostflop) {
      if (agentId === RiverMind.id) {
        return `${agentName} checks — tight wait-and-see.`;
      }
      if (agentId === PokerMaster.id) {
        return `${agentName} checks — balanced pot control.`;
      }
      return `${agentName} checks.`;
    }
    if (agentId === PokerMaster.id) {
      return `${agentName} checks — balanced pot control.`;
    }
    if (agentId === RiverMind.id) {
      return `${agentName} checks — tight wait-and-see.`;
    }
    return `${agentName} checks preflop.`;
  }

  if (action === "call") {
    const amt = displayAmount ?? decision.amount ?? toCall;
    if (isPostflop) {
      if (agentId === PokerMaster.id) {
        return `${agentName} calls ${amt} — balanced range continues.`;
      }
      if (agentId === BluffBot.id) {
        return `${agentName} calls ${amt} — BluffBot keeps the pot contested.`;
      }
      if (agentId === RiverMind.id) {
        return `${agentName} calls ${amt} — tight but playable holding.`;
      }
      if (agentId === ChipHunter.id) {
        return `${agentName} calls ${amt} — ChipHunter stays in to build pressure.`;
      }
      return `${agentName} calls ${amt}.`;
    }
    if (agentId === PokerMaster.id) {
      return `${agentName} calls ${amt} — balanced range continues.`;
    }
    if (agentId === BluffBot.id) {
      return `${agentName} calls ${amt} — BluffBot keeps the pot contested.`;
    }
    if (agentId === RiverMind.id) {
      return `${agentName} calls ${amt} — tight but playable holding.`;
    }
    if (agentId === ChipHunter.id) {
      return `${agentName} calls ${amt} — ChipHunter stays in to build pressure.`;
    }
    return `${agentName} calls ${amt} chips.`;
  }

  if (action === "raise") {
    const inc = displayAmount ?? 0;
    if (isPostflop) {
      if (toCall === 0) {
        if (agentId === ChipHunter.id) {
          return `${agentName} bets ${inc} — aggressive profile attacks the ${street}.`;
        }
        if (agentId === BluffBot.id) {
          return `${agentName} bets ${inc} — pressure bluff on the ${street}.`;
        }
        if (agentId === RiverMind.id) {
          return `${agentName} bets ${inc} — tight value on the ${street}.`;
        }
        return `${agentName} bets ${inc} — balanced line on the ${street}.`;
      }
      if (agentId === BluffBot.id) {
        return `${agentName} raises +${inc} — pressure from BluffBot.`;
      }
      if (agentId === ChipHunter.id) {
        return `${agentName} raises +${inc} — aggressive profile attacks the pot.`;
      }
      if (agentId === RiverMind.id) {
        return `${agentName} raises +${inc} — tight value line.`;
      }
      return `${agentName} raises +${inc}.`;
    }
    if (agentId === BluffBot.id) {
      return `${agentName} raises +${inc} — pressure bluff from a wide range.`;
    }
    if (agentId === ChipHunter.id) {
      return `${agentName} raises +${inc} — aggressive profile attacks the pot.`;
    }
    if (agentId === RiverMind.id) {
      return `${agentName} raises +${inc} — tight value line with strength.`;
    }
    return `${agentName} raises +${inc} — balanced range puts chips in.`;
  }

  if (action === "all-in") {
    return `${agentName} goes all-in — ${displayAmount ?? decision.amount ?? 0} chips committed.`;
  }

  return `${agentName} acts preflop.`;
}

export { getAgentBattlePostflopDecision } from "@/lib/poker/agentBattlePostflop";

/** @deprecated Fake commentary — no longer logged as actions. */
export function getAgentBattleBoardReaction(
  agentId: string,
  stage: "flop" | "turn" | "river",
): string | null {
  switch (agentId) {
    case RiverMind.id:
      if (stage === "flop") return "RiverMind would slow down on this board texture.";
      if (stage === "turn") return "RiverMind reads a cautious line on the turn.";
      return "RiverMind would check back often on this river.";
    case ChipHunter.id:
      if (stage === "flop") return "ChipHunter keeps pressure in a street-by-street version.";
      if (stage === "turn") return "ChipHunter would barrel this turn for value or pressure.";
      return "ChipHunter would fire a river bet with initiative.";
    case BluffBot.id:
      if (stage === "flop") return "BluffBot would represent strength on this flop.";
      return "BluffBot would look for a bluff spot on later streets.";
    case PokerMaster.id:
      if (stage === "flop") return "PokerMaster takes a balanced read on the flop texture.";
      return "PokerMaster would mix calls and pot control here.";
    default:
      return null;
  }
}
