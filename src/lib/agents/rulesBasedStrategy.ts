import type { Card, Rank } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";
import { evaluateBestHand } from "@/lib/poker/evaluator";
import type { AgentDecision, AgentInput, AgentStrategy } from "@/lib/agents/agentTypes";
import {
  classifyPreflopHand,
  shouldContinuePreflopAllIn,
  shouldFoldPreflopTrashToPressure,
} from "@/lib/arena/preflopRanges";

const HIGH_RANK_THRESHOLD = 11; // J+

function cardValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

function isPocketPair(holeCards: Card[]): boolean {
  return holeCards.length === 2 && holeCards[0].rank === holeCards[1].rank;
}

function isSuited(holeCards: Card[]): boolean {
  return holeCards.length === 2 && holeCards[0].suit === holeCards[1].suit;
}

function hasHighCards(holeCards: Card[]): boolean {
  if (holeCards.length !== 2) return false;
  return (
    cardValue(holeCards[0].rank) >= HIGH_RANK_THRESHOLD &&
    cardValue(holeCards[1].rank) >= HIGH_RANK_THRESHOLD
  );
}

function preflopStrength(holeCards: Card[]): number {
  const [a, b] = holeCards.map((c) => cardValue(c.rank));
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  if (a === b) return high * 4;
  if (isSuited(holeCards) && high >= 10) return high + low + 2;
  if (hasHighCards(holeCards)) return high + low;
  return high + low * 0.3;
}

function madeHandStrength(input: AgentInput): number {
  const all = [...input.holeCards, ...input.communityCards];
  if (all.length < 5) return preflopStrength(input.holeCards);
  const evaluated = evaluateBestHand(all);
  return evaluated.scores[0] * 100 + (evaluated.scores[1] ?? 0);
}

function hasFlushDraw(holeCards: Card[], communityCards: Card[]): boolean {
  const all = [...holeCards, ...communityCards];
  const suits = new Map<string, number>();
  for (const card of all) {
    suits.set(card.suit, (suits.get(card.suit) ?? 0) + 1);
  }
  return [...suits.values()].some((count) => count >= 4);
}

function hasStraightDraw(holeCards: Card[], communityCards: Card[]): boolean {
  const values = [...holeCards, ...communityCards]
    .map((c) => cardValue(c.rank))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);

  if (values.includes(14)) values.unshift(1);

  for (let i = 0; i <= values.length - 4; i += 1) {
    const window = values.slice(i, i + 4);
    if (window[3] - window[0] <= 4) return true;
  }
  return false;
}

function isStrongHand(input: AgentInput): boolean {
  if (input.gameStage === "preflop") {
    return isPocketPair(input.holeCards) || preflopStrength(input.holeCards) >= 26;
  }
  return madeHandStrength(input) >= 200;
}

function isWeakHand(input: AgentInput): boolean {
  if (input.gameStage === "preflop") {
    return preflopStrength(input.holeCards) < 18;
  }
  const strength = madeHandStrength(input);
  return strength < 120 && !hasFlushDraw(input.holeCards, input.communityCards) &&
    !hasStraightDraw(input.holeCards, input.communityCards);
}

function bluffRoll(strategy: AgentStrategy): boolean {
  const chance =
    strategy === "bluff" ? 0.12 : strategy === "aggressive" ? 0.08 : 0.05;
  return Math.random() < chance;
}

function raiseAmount(input: AgentInput): number {
  return input.currentBet + input.minRaise;
}

function strategyAggression(strategy: AgentStrategy): number {
  switch (strategy) {
    case "aggressive":
      return 1.3;
    case "tight":
      return 0.7;
    case "bluff":
      return 1.1;
    default:
      return 1;
  }
}

export function decidePokerAction(input: AgentInput): AgentDecision {
  const {
    agentName,
    holeCards,
    communityCards,
    amountToCall,
    stack,
    gameStage,
    strategy,
  } = input;

  const canCheck = amountToCall === 0;
  const raiseTo = raiseAmount(input);
  const aggression = strategyAggression(strategy);

  const potOdds = amountToCall > 0 ? input.pot / amountToCall : 999;
  const facingLargeBet =
    amountToCall >= stack * 0.5 || (input.pot > 0 && amountToCall >= input.pot * 0.6);
  const facingSmallBet =
    amountToCall > 0 &&
    amountToCall < stack * 0.25 &&
    (input.pot <= 0 || amountToCall < input.pot * 0.35);

  if (facingLargeBet && isWeakHand(input) && !facingSmallBet) {
    return {
      action: "fold",
      confidence: 0.82,
      reasoning: "Folds weak hand to large pressure",
    };
  }

  if (stack <= input.minRaise * 3 && isStrongHand(input)) {
    return {
      action: "all-in",
      amount: stack,
      confidence: 0.91,
      reasoning: "short stack shove with strong hand",
    };
  }

  if (
    strategy === "bluff" &&
    bluffRoll(strategy) &&
    !isStrongHand(input) &&
    canCheck
  ) {
    return {
      action: "raise",
      amount: raiseTo,
      confidence: 0.42,
      reasoning: "bluffing to pressure the table",
    };
  }

  if (gameStage === "preflop") {
    const preflop = classifyPreflopHand(holeCards);
    const isAllIn = amountToCall >= stack * 0.85;

    if (isAllIn && shouldContinuePreflopAllIn(preflop.category)) {
      return {
        action: "call",
        amount: amountToCall,
        confidence: 0.88,
        reasoning:
          preflop.category === "premium"
            ? "Raises premium preflop range — calling all-in"
            : "Strong preflop hand — calling all-in",
      };
    }

    if (
      isAllIn &&
      shouldFoldPreflopTrashToPressure(preflop.category, "all-in")
    ) {
      return {
        action: "fold",
        confidence: 0.84,
        reasoning: "Folds trash to preflop all-in",
      };
    }

    if (preflop.category === "premium") {
      return {
        action: canCheck ? "raise" : "call",
        amount: canCheck ? raiseTo : amountToCall,
        confidence: 0.9,
        reasoning: canCheck ? "Raises premium preflop range" : "Premium preflop range — continuing",
      };
    }

    if (preflop.category === "strong") {
      if (canCheck) {
        return aggression >= 1
          ? {
              action: "raise",
              amount: raiseTo,
              confidence: 0.8,
              reasoning: "Strong preflop hand — raising for value",
            }
          : {
              action: "check",
              confidence: 0.68,
              reasoning: "Strong preflop hand — pot control",
            };
      }
      if (facingLargeBet) {
        return {
          action: "call",
          amount: amountToCall,
          confidence: 0.78,
          reasoning: "Strong preflop hand — calling large pressure",
        };
      }
      return {
        action: "call",
        amount: amountToCall,
        confidence: 0.74,
        reasoning: "Strong preflop hand — calling",
      };
    }

    if (preflop.category === "playable") {
      if (canCheck) {
        return strategy === "aggressive" || strategy === "bluff"
          ? {
              action: "raise",
              amount: raiseTo,
              confidence: 0.66,
              reasoning: "Playable hand — opening the pot",
            }
          : {
              action: "check",
              confidence: 0.62,
              reasoning: "Playable hand — checking",
            };
      }
      if (!canCheck && facingLargeBet && potOdds < 2.5) {
        return {
          action: "fold",
          confidence: 0.76,
          reasoning: "Folds weak hand to large pressure",
        };
      }
      if (amountToCall <= input.minRaise * 2 * aggression) {
        return {
          action: "call",
          amount: amountToCall,
          confidence: 0.66,
          reasoning: "Playable hand — calling",
        };
      }
    }

    if (canCheck) {
      return {
        action: "check",
        confidence: 0.58,
        reasoning: "Checks marginal showdown value",
      };
    }

    if (facingLargeBet || amountToCall > input.minRaise * 2) {
      return {
        action: "fold",
        confidence: 0.8,
        reasoning: "Folds trash to preflop all-in",
      };
    }

    return {
      action: strategy === "tight" ? "fold" : "call",
      amount: strategy === "tight" ? undefined : amountToCall,
      confidence: 0.55,
      reasoning: strategy === "tight" ? "tight fold preflop" : "loose call to see flop",
    };
  }

  // Flop (and future turn/river reuse same heuristics)
  const strength = madeHandStrength(input);
  const hasDraw =
    hasFlushDraw(holeCards, communityCards) ||
    hasStraightDraw(holeCards, communityCards);

  const isTurnOrRiver = gameStage === "turn" || gameStage === "river";
  const weakPair = strength >= 120 && strength < 200;

  if (facingSmallBet && weakPair && !hasDraw) {
    return {
      action: "call",
      amount: amountToCall,
      confidence: 0.62,
      reasoning: "Weak pair — calling small pressure",
    };
  }

  if (facingLargeBet && isTurnOrRiver && strength < 200 && !hasDraw) {
    return {
      action: "fold",
      confidence: 0.86,
      reasoning: weakPair
        ? "Folds weak pair to large pressure"
        : "Folds weak hand to large pressure",
    };
  }

  if (facingLargeBet && strength < 120 && !hasDraw && !facingSmallBet) {
    return {
      action: "fold",
      confidence: 0.84,
      reasoning: "Folds weak hand to large pressure",
    };
  }

  if (strength >= 200) {
    if (canCheck) {
      return {
        action: aggression >= 1 ? "raise" : "check",
        amount: aggression >= 1 ? raiseTo : undefined,
        confidence: 0.86,
        reasoning: strength >= 300 ? "strong made hand — value raise" : "pair or better — betting for value",
      };
    }
    return {
      action: amountToCall <= input.minRaise * 3 ? "call" : "fold",
      amount: amountToCall <= input.minRaise * 3 ? amountToCall : undefined,
      confidence: 0.8,
      reasoning: "pair or better — continuing with equity",
    };
  }

  if (hasDraw) {
    if (canCheck) {
      return {
        action: "check",
        confidence: 0.64,
        reasoning: "drawing hand — checking to see next card",
      };
    }
    if (amountToCall <= input.minRaise * 2 * aggression || potOdds >= 2) {
      return {
        action: "call",
        amount: amountToCall,
        confidence: 0.7,
        reasoning: "Calls with strong draw and pot odds",
      };
    }
    if (facingLargeBet) {
      return {
        action: "fold",
        confidence: 0.78,
        reasoning: "Draw — folding without enough odds",
      };
    }
  }

  if (canCheck) {
    return {
      action: "check",
      confidence: 0.6,
      reasoning: "Checks marginal showdown value",
    };
  }

  if (amountToCall > input.minRaise && isWeakHand(input)) {
    return {
      action: "fold",
      confidence: 0.84,
      reasoning: "weak hand facing large bet",
    };
  }

  return {
    action: "fold",
    confidence: 0.75,
    reasoning: `${agentName} folds — missed the board`,
  };
}
