import type { AgentDecision } from "@/lib/agents/agentTypes";
import type { Card, HandRank, Rank } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";
import { evaluateBestHand } from "@/lib/poker/evaluator";
import type { StepDemoState } from "@/lib/arena/stepDemo";
import { STEP_DEMO_RAISE } from "@/lib/arena/stepDemoConstants";

type RaisePressure = "small" | "medium" | "large" | "pot";

function humanRaisePressure(state: StepDemoState): RaisePressure {
  const increment = state.lastHumanRaiseIncrement || STEP_DEMO_RAISE;
  const potTarget = Math.max(STEP_DEMO_RAISE, state.pot);
  if (increment >= potTarget * 0.85) return "pot";
  if (increment >= 45) return "large";
  if (increment >= 20) return "medium";
  return "small";
}

type HandTier = "premium" | "strong" | "medium" | "weak" | "trash";

type HandProfile = {
  tier: HandTier;
  strength: number;
  label: string;
  rank?: HandRank;
  hasDraw?: boolean;
};

export type StepDemoAiDecisionOptions = {
  /** Human re-raised after our raise — call/fold only. */
  afterHumanReRaise?: boolean;
  /** AI already raised this street — no second raise. */
  aiAlreadyRaised?: boolean;
  /** Human went all-in — call/fold only with pot-odds logic. */
  humanWentAllIn?: boolean;
};

function cardValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

function aiToCall(state: StepDemoState): number {
  return Math.max(0, state.currentBet - state.aiStreetBet);
}

function roll(): number {
  return Math.random();
}

function humanAppliedPressure(state: StepDemoState): boolean {
  return state.humanStreetBet > state.aiStreetBet;
}

function preflopProfile(hole: Card[]): HandProfile {
  const [a, b] = hole.map((c) => cardValue(c.rank));
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const suited = hole[0].suit === hole[1].suit;
  const pair = a === b;

  if (pair && high >= 12) {
    return {
      tier: "premium",
      strength: high * 5,
      label: `pocket ${hole[0].rank}s`,
    };
  }
  if ((high >= 14 && low >= 13) || (high >= 14 && low >= 12 && suited)) {
    return {
      tier: "premium",
      strength: high + low + 4,
      label: suited ? `${hole[0].rank}${hole[1].rank} suited` : `${hole[0].rank}${hole[1].rank}`,
    };
  }
  if (pair && high >= 9) {
    return {
      tier: "strong",
      strength: high * 3.5,
      label: `pocket ${hole[0].rank}s`,
    };
  }
  if (high >= 12 && low >= 10) {
    return {
      tier: "strong",
      strength: high + low,
      label: `${hole[0].rank}${hole[1].rank}${suited ? " suited" : ""}`,
    };
  }
  if (high >= 11 || (suited && high >= 10)) {
    return {
      tier: "medium",
      strength: high + low * 0.6,
      label: `${hole[0].rank}${hole[1].rank}${suited ? " suited" : ""}`,
    };
  }
  if (high >= 9) {
    return {
      tier: "weak",
      strength: high + low * 0.35,
      label: `${hole[0].rank}${hole[1].rank} offsuit`,
    };
  }
  return {
    tier: "trash",
    strength: high + low * 0.2,
    label: "weak starting hand",
  };
}

function hasFlushDraw(hole: Card[], board: Card[]): boolean {
  const suits = new Map<string, number>();
  for (const c of [...hole, ...board]) {
    suits.set(c.suit, (suits.get(c.suit) ?? 0) + 1);
  }
  return [...suits.values()].some((n) => n >= 4);
}

function hasStraightDraw(hole: Card[], board: Card[]): boolean {
  const values = [...hole, ...board]
    .map((c) => cardValue(c.rank))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);
  const ranks = values.includes(14) ? [1, ...values] : values;
  for (let i = 0; i <= ranks.length - 4; i += 1) {
    const w = ranks.slice(i, i + 4);
    if (w[3] - w[0] <= 4) return true;
  }
  return false;
}

function flopProfile(hole: Card[], board: Card[]): HandProfile {
  const evaluated = evaluateBestHand([...hole, ...board]);
  const rank = evaluated.rank;
  const draw = hasFlushDraw(hole, board) || hasStraightDraw(hole, board);

  const rankLabels: Record<HandRank, string> = {
    high_card: "high card",
    pair: "pair",
    two_pair: "two pair",
    three_of_a_kind: "trips",
    straight: "straight",
    flush: "flush",
    full_house: "full house",
    four_of_a_kind: "quads",
    straight_flush: "straight flush",
  };

  const label = rankLabels[rank];

  if (
    rank === "straight_flush" ||
    rank === "four_of_a_kind" ||
    rank === "full_house" ||
    rank === "flush" ||
    rank === "straight"
  ) {
    return { tier: "premium", strength: 90, label, rank, hasDraw: draw };
  }
  if (rank === "three_of_a_kind" || rank === "two_pair") {
    return { tier: "strong", strength: 75, label, rank, hasDraw: draw };
  }
  if (rank === "pair") {
    return { tier: "medium", strength: 48, label: `top ${label} on flop`, rank, hasDraw: draw };
  }
  if (draw) {
    return {
      tier: "medium",
      strength: 38,
      label: "draw on flop",
      rank,
      hasDraw: true,
    };
  }
  return {
    tier: "weak",
    strength: 15,
    label: "missed flop",
    rank,
    hasDraw: false,
  };
}

function profileForState(state: StepDemoState): HandProfile {
  const hole = state.players.pokerMaster.holeCards;
  if (state.street === "preflop" || state.communityCards.length < 3) {
    return preflopProfile(hole);
  }
  return boardProfile(hole, state.communityCards);
}

function boardProfile(hole: Card[], board: Card[]): HandProfile {
  return flopProfile(hole, board);
}

function decision(
  action: AgentDecision["action"],
  reasoning: string,
  confidence: number,
  amount?: number,
): AgentDecision {
  return { action, reasoning, confidence, amount };
}

function decideFacingReRaise(
  state: StepDemoState,
  profile: HandProfile,
  toCall: number,
): AgentDecision {
  const pressure = humanRaisePressure(state);

  if (profile.tier === "premium" || profile.tier === "strong") {
    if (pressure === "pot" && profile.tier === "strong" && roll() < 0.1) {
      return decision(
        "fold",
        `strong but not premium (${profile.label}) — folding to your pot-sized re-raise`,
        0.55,
      );
    }
    if (pressure === "large" && profile.tier === "strong" && roll() < 0.05) {
      return decision(
        "fold",
        `strong hand (${profile.label}) — folding to large re-raise pressure`,
        0.5,
      );
    }
    return decision(
      "call",
      `strong ${state.street} hand (${profile.label}) — calling your ${pressure} re-raise`,
      0.82,
      toCall,
    );
  }
  if (profile.tier === "medium") {
    if (pressure === "pot" || pressure === "large") {
      if (roll() < 0.62) {
        return decision(
          "fold",
          `medium ${profile.label} — folding to your ${pressure} re-raise`,
          0.62,
        );
      }
    } else if (pressure === "medium" && roll() < 0.28) {
      return decision(
        "fold",
        `medium ${profile.label} — folding to medium re-raise`,
        0.58,
      );
    }
    return decision(
      "call",
      `medium hand but decent pot odds — calling`,
      0.58,
      toCall,
    );
  }
  if (pressure === "small" && roll() < 0.22) {
    return decision(
      "call",
      `weak hand (${profile.label}) — calling small re-raise`,
      0.45,
      toCall,
    );
  }
  if (roll() < 0.55) {
    return decision(
      "fold",
      `weak hand (${profile.label}) facing ${pressure} re-raise — folding`,
      0.7,
    );
  }
  return decision(
    "call",
    `weak hand but pot odds look tempting — calling`,
    0.45,
    toCall,
  );
}

function decidePreflop(
  state: StepDemoState,
  profile: HandProfile,
  toCall: number,
  facingBet: boolean,
  humanRaised: boolean,
  canRaise: boolean,
): AgentDecision {
  const pot = state.pot;
  const pressure = humanRaised ? humanRaisePressure(state) : "small";

  if (!facingBet) {
    if (profile.tier === "premium" && canRaise && roll() < 0.72) {
      return decision(
        "raise",
        `strong preflop hand (${profile.label}) — raising for value`,
        0.88,
        STEP_DEMO_RAISE,
      );
    }
    if (profile.tier === "strong" && canRaise && roll() < 0.45) {
      return decision(
        "raise",
        `solid preflop hand (${profile.label}) — raising to build the pot`,
        0.75,
        STEP_DEMO_RAISE,
      );
    }
    return decision(
      "check",
      `medium preflop hand (${profile.label}) — checking in the big blind`,
      0.6,
    );
  }

  if (profile.tier === "premium") {
    if (canRaise && !humanRaised && roll() < 0.55) {
      return decision(
        "raise",
        `premium hand (${profile.label}) — re-raising for value`,
        0.9,
        STEP_DEMO_RAISE,
      );
    }
    return decision(
      "call",
      `premium hand (${profile.label}) — calling to keep the pot growing`,
      0.85,
      toCall,
    );
  }

  if (profile.tier === "strong") {
    if (
      humanRaised &&
      (pressure === "large" || pressure === "pot") &&
      roll() < 0.28
    ) {
      return decision(
        "fold",
        `strong but not premium (${profile.label}) — folding to ${pressure} raise`,
        0.55,
      );
    }
    if (humanRaised && pressure === "medium" && roll() < 0.12) {
      return decision(
        "fold",
        `strong but not premium (${profile.label}) — folding to medium raise`,
        0.5,
      );
    }
    if (
      canRaise &&
      humanRaised &&
      (pressure === "small" || pressure === "medium") &&
      roll() < 0.26
    ) {
      return decision(
        "raise",
        `strong preflop hand (${profile.label}) — re-raising your ${pressure} open`,
        0.78,
        STEP_DEMO_RAISE,
      );
    }
    if (canRaise && roll() < 0.32) {
      return decision(
        "raise",
        `strong preflop hand (${profile.label}) — raising for value`,
        0.78,
        STEP_DEMO_RAISE,
      );
    }
    return decision(
      "call",
      `playable preflop hand (${profile.label}) — calling`,
      0.68,
      toCall,
    );
  }

  if (profile.tier === "medium") {
    if (humanRaised && canRaise && pressure === "small" && roll() < 0.14) {
      return decision(
        "raise",
        `medium hand (${profile.label}) — fighting back with a small raise`,
        0.58,
        STEP_DEMO_RAISE,
      );
    }
    if (
      humanRaised &&
      (pressure === "large" || pressure === "pot") &&
      roll() < 0.55
    ) {
      return decision(
        "fold",
        `medium hand (${profile.label}) — folding to ${pressure} pressure`,
        0.6,
      );
    }
    if (humanRaised && pressure === "medium" && roll() < 0.32) {
      return decision(
        "fold",
        `medium hand (${profile.label}) — folding to medium raise`,
        0.58,
      );
    }
    if (
      (pressure === "small" || !humanRaised) &&
      toCall <= STEP_DEMO_RAISE &&
      roll() < 0.78
    ) {
      return decision(
        "call",
        `medium hand (${profile.label}) — calling with implied odds`,
        0.55,
        toCall,
      );
    }
    if (roll() < 0.35) {
      return decision("fold", `medium hand (${profile.label}) — folding preflop`, 0.52);
    }
    return decision("call", `marginal hand — calling a small bet`, 0.48, toCall);
  }

  if (humanRaised && toCall > 0) {
    if (pressure === "pot" || pressure === "large") {
      if (roll() < 0.72) {
        return decision(
          "fold",
          `trash hand (${profile.label}) facing ${pressure} raise — folding`,
          0.72,
        );
      }
    } else if (pressure === "medium" && roll() < 0.52) {
      return decision(
        "fold",
        `trash hand (${profile.label}) facing medium raise — folding`,
        0.65,
      );
    } else if (roll() < 0.35) {
      return decision(
        "fold",
        `trash hand (${profile.label}) facing raise — folding`,
        0.6,
      );
    }
  }
  if (toCall <= STEP_DEMO_RAISE && pot > toCall * 2 && roll() < 0.42) {
    return decision(
      "call",
      `weak hand but good pot odds — calling`,
      0.4,
      toCall,
    );
  }
  if (roll() < 0.55) {
    return decision("fold", `weak starting hand — folding preflop`, 0.65);
  }
  return decision("call", `marginal trash — peeling one bet`, 0.38, toCall);
}

function decidePostflop(
  state: StepDemoState,
  profile: HandProfile,
  toCall: number,
  facingBet: boolean,
  humanRaised: boolean,
  canRaise: boolean,
): AgentDecision {
  const streetLabel = state.street;
  const pressure = humanRaised ? humanRaisePressure(state) : "small";

  if (!facingBet) {
    if (
      (profile.tier === "premium" || profile.tier === "strong") &&
      canRaise &&
      roll() < 0.42
    ) {
      return decision(
        "raise",
        `${profile.label} — betting for value on the ${streetLabel}`,
        0.84,
        STEP_DEMO_RAISE,
      );
    }
    if (profile.tier === "weak" && canRaise && roll() < 0.09) {
      return decision(
        "raise",
        `small bluff attempt on the ${streetLabel}`,
        0.42,
        STEP_DEMO_RAISE,
      );
    }
    return decision(
      "check",
      profile.tier === "weak" || profile.tier === "trash"
        ? `weak hand on ${streetLabel} — checking back`
        : `${profile.label} — checking to control the pot`,
      0.58,
    );
  }

  if (profile.tier === "premium" || profile.tier === "strong") {
    if (
      canRaise &&
      humanRaised &&
      (pressure === "small" || pressure === "medium") &&
      roll() < 0.32
    ) {
      return decision(
        "raise",
        `${profile.label} — re-raising your ${pressure} bet on the ${streetLabel}`,
        0.86,
        STEP_DEMO_RAISE,
      );
    }
    if (canRaise && !humanRaised && roll() < 0.38) {
      return decision(
        "raise",
        `${profile.label} — raising for value on the ${streetLabel}`,
        0.86,
        STEP_DEMO_RAISE,
      );
    }
    return decision(
      "call",
      `${profile.label} — calling with showdown value`,
      0.8,
      toCall,
    );
  }

  if (profile.tier === "medium") {
    if (profile.hasDraw && roll() < 0.72) {
      return decision(
        "call",
        `${profile.label} — calling to chase equity on the ${streetLabel}`,
        0.62,
        toCall,
      );
    }
    if (humanRaised && canRaise && pressure === "small" && roll() < 0.12) {
      return decision(
        "raise",
        `${profile.label} — raising back on the ${streetLabel}`,
        0.6,
        STEP_DEMO_RAISE,
      );
    }
    if (
      humanRaised &&
      (pressure === "large" || pressure === "pot") &&
      roll() < 0.48
    ) {
      return decision(
        "fold",
        `${profile.label} — folding to ${pressure} pressure on the ${streetLabel}`,
        0.58,
      );
    }
    if (humanRaised && pressure === "medium" && roll() < 0.28) {
      return decision(
        "fold",
        `${profile.label} — folding to medium ${streetLabel} raise`,
        0.55,
      );
    }
    if (roll() < 0.68) {
      return decision(
        "call",
        `top pair on ${streetLabel} — calling with showdown value`,
        0.64,
        toCall,
      );
    }
    return decision(
      "fold",
      `medium hand (${profile.label}) — folding on the ${streetLabel}`,
      0.54,
    );
  }

  if (humanRaised) {
    if (pressure === "pot" || pressure === "large") {
      if (roll() < 0.62) {
        return decision(
          "fold",
          `missed board on ${streetLabel} — folding to ${pressure} pressure`,
          0.72,
        );
      }
    } else if (pressure === "medium" && roll() < 0.45) {
      return decision(
        "fold",
        `missed board on ${streetLabel} — folding to medium raise`,
        0.66,
      );
    } else if (roll() < 0.3) {
      return decision(
        "fold",
        `missed board on ${streetLabel} and facing pressure — folding`,
        0.62,
      );
    }
  }
  if (profile.hasDraw && roll() < 0.55) {
    return decision(
      "call",
      "draw or weak pair — calling once for pot odds",
      0.48,
      toCall,
    );
  }
  if (roll() < 0.48) {
    return decision(
      "fold",
      `weak hand on ${streetLabel} facing bet — folding`,
      0.66,
    );
  }
  return decision("call", "weak hand but pot odds — calling", 0.42, toCall);
}

function decideFacingHumanAllIn(
  state: StepDemoState,
  profile: HandProfile,
  toCall: number,
): AgentDecision {
  const aiStack = state.players.pokerMaster.stack;
  const callAmount = Math.min(toCall, aiStack);
  const potOdds = toCall > 0 ? state.pot / toCall : 999;

  if (profile.tier === "premium") {
    return decision(
      "call",
      `premium hand (${profile.label}) — calling your all-in`,
      0.88,
      callAmount,
    );
  }

  if (profile.tier === "strong") {
    if (potOdds >= 1.5 || roll() < 0.72) {
      return decision(
        "call",
        `strong hand (${profile.label}) — calling all-in with good pot odds`,
        0.78,
        callAmount,
      );
    }
    if (roll() < 0.38) {
      return decision(
        "fold",
        `strong but not premium (${profile.label}) — folding to all-in`,
        0.55,
      );
    }
    return decision(
      "call",
      `strong hand (${profile.label}) — calling all-in`,
      0.72,
      callAmount,
    );
  }

  if (profile.tier === "medium") {
    if (profile.hasDraw && potOdds >= 2 && roll() < 0.58) {
      return decision(
        "call",
        `${profile.label} with draws — calling all-in for pot odds`,
        0.6,
        callAmount,
      );
    }
    if (potOdds >= 3 && roll() < 0.42) {
      return decision(
        "call",
        `medium hand (${profile.label}) — calling with pot odds`,
        0.52,
        callAmount,
      );
    }
    if (roll() < 0.58) {
      return decision(
        "fold",
        `medium hand (${profile.label}) — folding to all-in`,
        0.65,
      );
    }
    return decision(
      "call",
      `medium hand (${profile.label}) — calling all-in`,
      0.48,
      callAmount,
    );
  }

  if (potOdds >= 4 && roll() < 0.28) {
    return decision(
      "call",
      `weak hand but long pot odds — calling all-in`,
      0.38,
      callAmount,
    );
  }
  if (roll() < 0.68) {
    return decision(
      "fold",
      `weak hand (${profile.label}) — folding to all-in`,
      0.72,
    );
  }
  return decision(
    "call",
    `weak hand (${profile.label}) — hero call all-in`,
    0.35,
    callAmount,
  );
}

/**
 * Step Demo only — tuned PokerMaster decisions (not used in full-hand sim).
 */
export function getStepDemoPokerMasterDecision(
  state: StepDemoState,
  options: StepDemoAiDecisionOptions = {},
): AgentDecision {
  const toCall = aiToCall(state);
  const facingBet = toCall > 0;
  const humanRaised = humanAppliedPressure(state);
  const canRaise = !options.aiAlreadyRaised && !options.afterHumanReRaise;

  const profile = profileForState(state);

  let result: AgentDecision;

  if (options.humanWentAllIn) {
    result =
      toCall > 0
        ? decideFacingHumanAllIn(state, profile, toCall)
        : decision(
            "call",
            `${profile.label} — calling all-in (already matched)`,
            0.85,
            0,
          );
  } else if (options.afterHumanReRaise && facingBet) {
    result = decideFacingReRaise(state, profile, toCall);
  } else if (state.street === "preflop") {
    result = decidePreflop(
      state,
      profile,
      toCall,
      facingBet,
      humanRaised,
      canRaise,
    );
  } else {
    result = decidePostflop(
      state,
      profile,
      toCall,
      facingBet,
      humanRaised,
      canRaise,
    );
  }

  if (options.afterHumanReRaise && result.action === "raise") {
    result = decision(
      "call",
      `${profile.label} — calling after your re-raise (demo cap)`,
      result.confidence * 0.9,
      toCall,
    );
  }

  if (options.humanWentAllIn && result.action !== "fold") {
    result = decision(
      "call",
      result.reasoning,
      result.confidence,
      Math.min(toCall, state.players.pokerMaster.stack),
    );
  }

  if (options.aiAlreadyRaised && (result.action === "raise" || result.action === "all-in")) {
    result = decision(
      facingBet ? "call" : "check",
      `${profile.label} — ${facingBet ? "calling" : "checking"} (one raise per street)`,
      result.confidence * 0.85,
      facingBet ? toCall : undefined,
    );
  }

  if (result.action === "check" && facingBet) {
    result = decision(
      "call",
      `${profile.label} — calling (cannot check facing a bet)`,
      result.confidence,
      toCall,
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[stepDemo/ai]", {
      street: state.street,
      action: result.action,
      tier: profile.tier,
      toCall,
      humanRaised,
    });
  }

  return result;
}
