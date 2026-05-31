import { BluffBot, ChipHunter, RiverMind } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import {
  type AgentBattleRaiseTier,
  computeAgentBattleRaiseTotal,
} from "@/lib/poker/agentBattleSizing";
import { amountToCall } from "@/lib/poker/betting";
import { evaluateBestHand } from "@/lib/poker/evaluator";
import type { Card, GameState, HandRank, Player } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";

export type PostflopHandProfile = {
  score: number;
  rank: HandRank;
  hasDraw: boolean;
  hasPairOrBetter: boolean;
  boardTexture: BoardTexture;
  isStrong: boolean;
  isMedium: boolean;
  isWeak: boolean;
};

export type BoardTexture = {
  isPaired: boolean;
  isFlushy: boolean;
  isConnected: boolean;
};

const RANK_SCORE: Record<HandRank, number> = {
  high_card: 14,
  pair: 42,
  two_pair: 58,
  three_of_a_kind: 68,
  straight: 78,
  flush: 80,
  full_house: 88,
  four_of_a_kind: 94,
  straight_flush: 98,
};

function rankValue(rank: Card["rank"]): number {
  return RANK_VALUES[rank];
}

function hasFlushDraw(hole: Card[], board: Card[]): boolean {
  const suits = [...hole, ...board].reduce<Record<string, number>>((acc, c) => {
    acc[c.suit] = (acc[c.suit] ?? 0) + 1;
    return acc;
  }, {});
  return Object.values(suits).some((n) => n === 4);
}

function hasStraightDraw(hole: Card[], board: Card[]): boolean {
  const ranks = [...new Set([...hole, ...board].map((c) => rankValue(c.rank)))].sort(
    (a, b) => a - b,
  );
  for (let i = 0; i <= ranks.length - 4; i += 1) {
    const window = ranks.slice(i, i + 4);
    if (window.length >= 4 && window[window.length - 1] - window[0] <= 4) {
      return true;
    }
  }
  return false;
}

function evaluateBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) {
    return { isPaired: false, isFlushy: false, isConnected: false };
  }

  const ranks = board.map((c) => rankValue(c.rank)).sort((a, b) => a - b);
  const isPaired = new Set(ranks).size < ranks.length;

  const suitCounts = board.reduce<Record<string, number>>((acc, card) => {
    acc[card.suit] = (acc[card.suit] ?? 0) + 1;
    return acc;
  }, {});
  const isFlushy = Object.values(suitCounts).some((count) => count >= 3);

  const span = ranks[ranks.length - 1] - ranks[0];
  const isConnected = span <= 4 && ranks.length >= 3;

  return { isPaired, isFlushy, isConnected };
}

export function evaluateAgentBattlePostflop(
  player: Player,
  state: GameState,
): PostflopHandProfile {
  const board = state.communityCards;
  const boardTexture = evaluateBoardTexture(board);
  const all = [...player.holeCards, ...board];
  const evaluated =
    all.length >= 5 ? evaluateBestHand(all) : evaluateBestHand(player.holeCards);
  const rankScore = RANK_SCORE[evaluated.rank] ?? 14;
  const topKicker = evaluated.scores[0] ?? 0;
  const draw =
    board.length >= 3 &&
    (hasFlushDraw(player.holeCards, board) || hasStraightDraw(player.holeCards, board));
  const drawBoost = draw ? 12 : 0;
  const scaryBoardBoost =
    boardTexture.isFlushy || boardTexture.isConnected ? 4 : 0;
  const score = Math.min(
    100,
    rankScore + drawBoost + scaryBoardBoost + topKicker * 0.02,
  );
  const hasPairOrBetter = evaluated.rank !== "high_card";

  return {
    score,
    rank: evaluated.rank,
    hasDraw: draw,
    hasPairOrBetter,
    boardTexture,
    isStrong: score >= 62,
    isMedium: score >= 38 && score < 62,
    isWeak: score < 38,
  };
}

function bluffSeed(player: Player, state: GameState): boolean {
  const seed =
    player.holeCards.reduce((s, c) => s + rankValue(c.rank), 0) +
    state.communityCards.length;
  return seed % 3 === 0;
}

function raiseTier(
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

function check(reasoning: string, confidence = 0.62): AgentDecision {
  return { action: "check", confidence, reasoning };
}

function call(amount: number, reasoning: string, confidence = 0.7): AgentDecision {
  return { action: "call", amount, confidence, reasoning };
}

function fold(reasoning: string, confidence = 0.8): AgentDecision {
  return { action: "fold", confidence, reasoning };
}

function pokerMasterPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  toCall: number,
): AgentDecision {
  if (profile.isStrong) {
    if (canCheck) {
      return raiseTier(
        player,
        state,
        profile.score >= 75 ? "big" : "standard",
        "balanced value bet with a strong made hand",
        0.84,
      );
    }
    if (toCall <= 180) {
      return raiseTier(player, state, "standard", "balanced re-raise for value", 0.8);
    }
    if (toCall <= 260) return call(toCall, "balanced call with a strong holding", 0.78);
    return fold("balanced pass under heavy postflop pressure");
  }

  if (profile.isMedium) {
    if (canCheck) {
      return profile.score >= 48
        ? raiseTier(player, state, "small", "balanced thin value bet", 0.68)
        : check("balanced pot control on a medium hand");
    }
    if (toCall <= 120) return call(toCall, "balanced continue with medium strength", 0.72);
    if (toCall <= 200 && profile.score >= 44) {
      return call(toCall, "balanced defends a reasonable price", 0.66);
    }
    return fold("balanced fold vs oversized postflop bet");
  }

  if (canCheck) return check("balanced check with a weak holding");
  if (toCall <= 75 && profile.hasDraw) {
    return call(toCall, "balanced peel with a live draw", 0.58);
  }
  if (toCall <= 50) return call(toCall, "cheap continue", 0.55);
  return fold("balanced release a weak hand to pressure");
}

function bluffBotPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  toCall: number,
): AgentDecision {
  const bluff =
    bluffSeed(player, state) ||
    profile.isWeak ||
    (profile.boardTexture.isFlushy && bluffSeed(player, state));

  if (bluff && canCheck) {
    return raiseTier(
      player,
      state,
      profile.isStrong ? "big" : "standard",
      "BluffBot fires a pressure bet",
      0.58,
    );
  }

  if (profile.isStrong || profile.isMedium) {
    if (canCheck) {
      return raiseTier(
        player,
        state,
        profile.isStrong ? "pot" : "standard",
        "BluffBot bets to keep heat on",
        0.74,
      );
    }
    if (toCall <= 220) {
      return profile.score >= 50 && toCall <= 160
        ? raiseTier(player, state, "big", "BluffBot re-raises to keep pressure", 0.66)
        : call(toCall, "BluffBot calls wide postflop", 0.72);
    }
  }

  if (canCheck) {
    return raiseTier(
      player,
      state,
      bluffSeed(player, state) ? "big" : "standard",
      "BluffBot steals the street",
      0.6,
    );
  }

  if (toCall <= 180) return call(toCall, "BluffBot calls — action over fold", 0.68);
  if (toCall <= 240 && (profile.hasDraw || profile.isMedium)) {
    return call(toCall, "BluffBot floats with equity", 0.56);
  }
  return fold("BluffBot gives up a dead spot");
}

function riverMindPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  toCall: number,
): AgentDecision {
  if (profile.isStrong) {
    if (canCheck) {
      return raiseTier(
        player,
        state,
        profile.score >= 78 ? "big" : "pressure",
        "tight value bet with real strength",
        0.88,
      );
    }
    if (toCall <= 160) return call(toCall, "tight call with a strong hand", 0.82);
    if (toCall <= 240 && profile.score >= 70) {
      return call(toCall, "tight but committed with strength", 0.76);
    }
    return fold("RiverMind folds — tight profile avoids heavy pressure");
  }

  if (profile.isMedium) {
    if (canCheck) return check("tight check with marginal strength");
    if (toCall <= 100) return call(toCall, "tight continue with a playable hand", 0.68);
    return fold("RiverMind folds — tight profile avoids pressure");
  }

  if (canCheck) return check("tight check with a weak hand");
  if (toCall <= 60 && profile.hasDraw) {
    return call(toCall, "tight draw peel", 0.55);
  }
  return fold("RiverMind folds — tight profile avoids weak spots");
}

function chipHunterPostflop(
  player: Player,
  state: GameState,
  profile: PostflopHandProfile,
  canCheck: boolean,
  toCall: number,
): AgentDecision {
  if (profile.isStrong || (profile.hasDraw && profile.score >= 40)) {
    if (canCheck) {
      return raiseTier(
        player,
        state,
        profile.isStrong ? "pot" : "big",
        "ChipHunter attacks with strength or a semi-bluff draw",
        0.86,
      );
    }
    if (toCall <= 220) {
      return raiseTier(player, state, "big", "ChipHunter re-raises to build the pot", 0.82);
    }
    return call(toCall, "ChipHunter calls to keep initiative", 0.78);
  }

  if (profile.isMedium) {
    if (canCheck) {
      return raiseTier(player, state, "standard", "ChipHunter bets medium strength", 0.72);
    }
    if (toCall <= 180) return call(toCall, "ChipHunter calls — aggressive wide defense", 0.7);
    return fold("ChipHunter releases a medium hand to big pressure");
  }

  if (canCheck) {
    return raiseTier(
      player,
      state,
      profile.hasDraw ? "standard" : "pressure",
      "ChipHunter opens with aggressive pressure",
      0.64,
    );
  }

  if (toCall <= 200) return call(toCall, "ChipHunter defends wide postflop", 0.66);
  if (toCall <= 260 && profile.hasDraw) {
    return call(toCall, "draw equity — ChipHunter stays in", 0.6);
  }
  return fold("ChipHunter releases a hopeless hand");
}

export function getAgentBattlePostflopDecision(
  player: Player,
  state: GameState,
): AgentDecision {
  const toCall = amountToCall(player, state.currentBet);
  const canCheck = toCall === 0;
  const profile = evaluateAgentBattlePostflop(player, state);

  switch (player.id) {
    case PokerMaster.id:
      return pokerMasterPostflop(player, state, profile, canCheck, toCall);
    case BluffBot.id:
      return bluffBotPostflop(player, state, profile, canCheck, toCall);
    case RiverMind.id:
      return riverMindPostflop(player, state, profile, canCheck, toCall);
    case ChipHunter.id:
      return chipHunterPostflop(player, state, profile, canCheck, toCall);
    default:
      return canCheck
        ? check("default postflop check")
        : toCall <= player.stack
          ? call(toCall, "default postflop call", 0.5)
          : fold("default postflop fold");
  }
}
