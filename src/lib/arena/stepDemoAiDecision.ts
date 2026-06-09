import type { AgentDecision } from "@/lib/agents/agentTypes";
import type { StepDemoState } from "@/lib/arena/stepDemo";
import {
  downgradeAiBettingVsZeroHuman,
  getHumanInHandStack,
} from "@/lib/arena/stepDemoZeroStack";
import { STEP_DEMO_RAISE } from "@/lib/arena/stepDemoConstants";
import {
  formatRaiseReasoning,
  pickPokerMasterRaiseIncrement,
  resolvePokerMasterRaiseIncrement,
  type RaiseIntent,
} from "@/lib/arena/stepDemoAiRaiseSizing";
import {
  buildBetContext,
  buildHandProfile,
  classifyPostflopCategory,
  type BetContext,
  type BetPressure,
  type HandProfile,
  type HandTier,
  type PostflopCategory,
} from "@/lib/arena/stepDemoHandAnalysis";
import {
  shouldContinuePreflopAllIn,
  shouldFoldPreflopTrashToPressure,
  type PreflopCategory,
} from "@/lib/arena/preflopRanges";

/** Tunable aggression / fold thresholds for Human vs AI PokerMaster. */
const FOLD_REDUCTION_SMALL_PRESSURE = 0.58;
const FOLD_REDUCTION_MEDIUM_PRESSURE = 0.38;
const STRONG_HAND_RAISE_BONUS = 0.24;
const DRAW_SEMI_BLUFF_BONUS = 0.2;

const PREMIUM_OPEN_RAISE_FREQ = 0.94;
const STRONG_OPEN_RAISE_FREQ = 0.72;
const PREMIUM_3BET_FREQ = 0.84;
const STRONG_3BET_FREQ = 0.48;
const STRONG_VALUE_RAISE_FREQ = 0.78;
const PREMIUM_VALUE_RAISE_FREQ = 0.88;
const TOP_PAIR_RAISE_FREQ = 0.32;
const RIVER_VALUE_RAISE_FREQ = 0.62;
const COMBO_DRAW_SEMI_BLUFF_FREQ = 0.42;
const FLUSH_OESD_SEMI_BLUFF_FREQ = 0.3;
const FLUSH_OVERCARD_SEMI_BLUFF_FREQ = 0.22;
const GUTSHOT_SEMI_BLUFF_FREQ = 0.08;

export type StepDemoAiDecisionOptions = {
  /** Human re-raised after our raise — call/fold only. */
  afterHumanReRaise?: boolean;
  /** AI already raised this street — no second raise. */
  aiAlreadyRaised?: boolean;
  /** Human went all-in — call/fold only with pot-odds logic. */
  humanWentAllIn?: boolean;
};

function aiToCall(state: StepDemoState): number {
  return Math.max(0, state.currentBet - state.aiStreetBet);
}

function roll(): number {
  return Math.random();
}

function humanAppliedPressure(state: StepDemoState): boolean {
  return state.humanStreetBet > state.aiStreetBet;
}

function decision(
  action: AgentDecision["action"],
  reasoning: string,
  confidence: number,
  amount?: number,
): AgentDecision {
  return { action, reasoning, confidence, amount };
}

function tierFloor(tier: HandTier): number {
  switch (tier) {
    case "premium":
      return 0.92;
    case "strong":
      return 0.78;
    case "playable":
      return 0.55;
    case "speculative":
      return 0.38;
    default:
      return 0.2;
  }
}

function adjustFoldWeight(weight: number, pressure: BetPressure): number {
  if (pressure === "small") {
    return weight * (1 - FOLD_REDUCTION_SMALL_PRESSURE);
  }
  if (pressure === "medium") {
    return weight * (1 - FOLD_REDUCTION_MEDIUM_PRESSURE);
  }
  return weight;
}

/** Returns true when the hand should fold (bounded — strong hands resist bad folds). */
function shouldFold(
  foldWeight: number,
  profile: HandProfile,
  pressure: BetPressure,
): boolean {
  let w = adjustFoldWeight(foldWeight, pressure);
  w = Math.max(0, w - (profile.strength - 45) / 250);

  if (profile.tier === "premium") return w > 0.92 && roll() < w * 0.08;
  if (profile.tier === "strong") return w > 0.55 && roll() < w * 0.22;
  if (profile.madeHand === "top_pair" && (profile.goodKicker || profile.isOverpair)) {
    return w > 0.65 && roll() < w * 0.28;
  }
  return roll() < w;
}

function raiseBonus(profile: HandProfile): number {
  let bonus = 0;
  if (profile.tier === "premium" || profile.tier === "strong") {
    bonus += STRONG_HAND_RAISE_BONUS;
  }
  if (profile.madeHand === "top_pair" && (profile.goodKicker || profile.isOverpair)) {
    bonus += 0.1;
  }
  if (profile.isOverpair) bonus += 0.08;
  return bonus;
}

function shouldRaise(baseFreq: number, profile: HandProfile, extraBonus = 0): boolean {
  return roll() < Math.min(0.96, baseFreq + raiseBonus(profile) + extraBonus);
}

function semiBluffFreq(profile: HandProfile): number {
  const { draws } = profile;
  if (draws.flushDraw && draws.openEndedStraight) {
    return COMBO_DRAW_SEMI_BLUFF_FREQ + DRAW_SEMI_BLUFF_BONUS;
  }
  if (draws.flushDraw && draws.overcards) {
    return FLUSH_OVERCARD_SEMI_BLUFF_FREQ + DRAW_SEMI_BLUFF_BONUS;
  }
  if (draws.flushDraw || draws.openEndedStraight) {
    return FLUSH_OESD_SEMI_BLUFF_FREQ + DRAW_SEMI_BLUFF_BONUS;
  }
  if (draws.gutshot) return GUTSHOT_SEMI_BLUFF_FREQ;
  return 0;
}

function pressurePhrase(pressure: BetPressure): string {
  switch (pressure) {
    case "all-in":
      return "all-in pressure";
    case "pot":
      return "pot-sized pressure";
    case "large":
      return "heavy pressure";
    case "medium":
      return "medium pressure";
    default:
      return "small pressure";
  }
}

function drawReason(profile: HandProfile): string {
  if (profile.draws.flushDraw && profile.draws.openEndedStraight) {
    return "Combo draw";
  }
  if (profile.draws.flushDraw) return "Flush draw";
  if (profile.draws.openEndedStraight) return "Open-ended straight draw";
  if (profile.draws.gutshot) return "Gutshot";
  if (profile.draws.overcards) return "Overcards";
  return "Draw";
}

function boardPhrase(profile: HandProfile): string {
  if (profile.board.summary === "preflop") return "";
  if (profile.board.paired) return " on a paired board";
  if (profile.board.summary === "dry board") return " on a dry board";
  if (profile.board.flushHeavy || profile.board.connected) {
    return ` on a ${profile.board.summary}`;
  }
  return "";
}

function topPairLabel(profile: HandProfile): string {
  if (profile.isOverpair) return "Overpair";
  if (profile.goodKicker) return "Top pair with good kicker";
  return "Top pair";
}

function isMonster(profile: HandProfile): boolean {
  return (
    profile.madeHand === "straight" ||
    profile.madeHand === "flush" ||
    profile.madeHand === "full_house_plus"
  );
}

function postflopCat(profile: HandProfile): PostflopCategory {
  return profile.postflopCategory ?? classifyPostflopCategory(profile);
}

function foldWeakToPressure(
  profile: HandProfile,
  ctx: BetContext,
  reason: string,
): AgentDecision {
  return decision("fold", reason, 0.72 + ctx.callPotRatio * 0.15);
}

function callWith(
  profile: HandProfile,
  ctx: BetContext,
  reason: string,
  confidence: number,
): AgentDecision {
  return decision("call", reason, confidence, ctx.toCall);
}

function raiseForValue(
  state: StepDemoState,
  profile: HandProfile,
  ctx: BetContext | null,
  intent: RaiseIntent,
  baseReason: string,
  confidence: number,
): AgentDecision {
  const increment = resolvePokerMasterRaiseIncrement(
    state,
    pickPokerMasterRaiseIncrement(state, profile, ctx, intent),
  );
  if (increment <= 0) {
    if (ctx && ctx.toCall > 0) {
      return callWith(profile, ctx, `${profile.label} — calling (short stack)`, 0.55);
    }
    return decision("check", `${profile.label} — checking (short stack)`, 0.5);
  }
  const reasoning = formatRaiseReasoning(baseReason, increment, state);
  return decision("raise", reasoning, confidence, increment);
}

function decideFacingReRaise(
  profile: HandProfile,
  ctx: BetContext,
): AgentDecision {
  const p = ctx.pressure;

  if (profile.tier === "premium" || profile.tier === "strong") {
    if (
      profile.tier === "strong" &&
      (p === "pot" || p === "all-in") &&
      shouldFold(0.08, profile, p)
    ) {
      return decision(
        "fold",
        `${profile.label}${boardPhrase(profile)} — folding to ${pressurePhrase(p)}`,
        0.58,
      );
    }
    return callWith(
      profile,
      ctx,
      `${profile.label} — calling your ${pressurePhrase(p)}`,
      profile.tier === "premium" ? 0.9 : 0.84,
    );
  }

  if (profile.tier === "playable" || profile.madeHand === "top_pair") {
    if (p === "pot" || p === "all-in" || p === "large") {
      if (shouldFold(0.48, profile, p)) {
        return foldWeakToPressure(
          profile,
          ctx,
          `${profile.label} — folding to ${pressurePhrase(p)}`,
        );
      }
    } else if (p === "medium" && shouldFold(0.18, profile, p)) {
      return foldWeakToPressure(profile, ctx, `${profile.label} — folding to medium re-raise`);
    }
    if (profile.draws.hasEquityDraw && profile.street !== "river") {
      return callWith(
        profile,
        ctx,
        `${drawReason(profile)} — calling with pot odds`,
        0.66,
      );
    }
    const label = profile.madeHand === "top_pair" ? topPairLabel(profile) : profile.label;
    return callWith(
      profile,
      ctx,
      `${label} — continuing against ${pressurePhrase(p)}`,
      0.64,
    );
  }

  if (p === "small" && shouldFold(0.06, profile, p)) {
    return callWith(profile, ctx, `${profile.label} — peeling a small re-raise`, 0.44);
  }
  if (shouldFold(0.52, profile, p)) {
    return foldWeakToPressure(
      profile,
      ctx,
      `Weak hand (${profile.label}) — folding to ${pressurePhrase(p)}`,
    );
  }
  return callWith(profile, ctx, `${profile.label} — calling with long pot odds`, 0.42);
}

function decidePreflopNoBet(
  state: StepDemoState,
  profile: HandProfile,
  canRaise: boolean,
): AgentDecision {
  if (profile.tier === "premium" && canRaise && shouldRaise(PREMIUM_OPEN_RAISE_FREQ, profile)) {
    return raiseForValue(
      state,
      profile,
      null,
      "preflop_open",
      "Raises premium preflop range",
      0.92,
    );
  }
  if (profile.tier === "strong" && canRaise && shouldRaise(STRONG_OPEN_RAISE_FREQ, profile)) {
    return raiseForValue(
      state,
      profile,
      null,
      "preflop_open",
      "Strong preflop hand — raising for value",
      0.82,
    );
  }
  if (profile.tier === "playable" && canRaise && shouldRaise(0.28, profile)) {
    return raiseForValue(
      state,
      profile,
      null,
      "probe",
      `Playable hand (${profile.label}) — opening the pot`,
      0.64,
    );
  }
  return decision(
    "check",
    `${profile.label} — checking in the big blind`,
    0.58,
  );
}

function decidePreflopFacingBet(
  state: StepDemoState,
  profile: HandProfile,
  ctx: BetContext,
  humanRaised: boolean,
  canRaise: boolean,
): AgentDecision {
  const p = ctx.pressure;

  if (profile.tier === "premium") {
    if (canRaise && shouldRaise(PREMIUM_3BET_FREQ, profile)) {
      return raiseForValue(
        state,
        profile,
        ctx,
        "preflop_3bet",
        "Raises premium preflop range",
        0.92,
      );
    }
    if (p === "all-in" || p === "pot") {
      return callWith(profile, ctx, "Raises premium preflop range — calling all-in", 0.92);
    }
    return callWith(profile, ctx, "Premium preflop range — continuing", 0.88);
  }

  if (profile.tier === "strong") {
    if (p === "all-in" || p === "pot") {
      return callWith(profile, ctx, "Strong preflop hand — calling large pressure", 0.84);
    }
    if (canRaise && humanRaised && (p === "small" || p === "medium") && shouldRaise(STRONG_3BET_FREQ, profile)) {
      return raiseForValue(
        state,
        profile,
        ctx,
        "preflop_3bet",
        "Strong preflop hand — re-raising for value",
        0.8,
      );
    }
    if (canRaise && !humanRaised && shouldRaise(STRONG_OPEN_RAISE_FREQ, profile)) {
      return raiseForValue(
        state,
        profile,
        ctx,
        "preflop_open",
        "Strong preflop hand — raising for value",
        0.78,
      );
    }
    return callWith(
      profile,
      ctx,
      `Strong preflop hand (${profile.label}) — calling`,
      0.76,
    );
  }

  if (profile.tier === "playable") {
    if (humanRaised && (p === "pot" || p === "all-in") && shouldFold(0.55, profile, p)) {
      return foldWeakToPressure(
        profile,
        ctx,
        `${profile.label} — folding to ${pressurePhrase(p)}`,
      );
    }
    if (humanRaised && p === "large" && shouldFold(0.35, profile, p)) {
      return foldWeakToPressure(profile, ctx, `${profile.label} — folding to heavy raise`);
    }
    if (humanRaised && p === "medium" && shouldFold(0.14, profile, p)) {
      return foldWeakToPressure(profile, ctx, `${profile.label} — folding to medium raise`);
    }
    return callWith(
      profile,
      ctx,
      `${profile.label} — calling ${pressurePhrase(p)}`,
      0.62,
    );
  }

  if (profile.tier === "speculative") {
    if (p === "small" && ctx.toCall <= STEP_DEMO_RAISE) {
      return callWith(
        profile,
        ctx,
        `${profile.label} — calling to see a flop cheaply`,
        0.54,
      );
    }
    if ((p === "pot" || p === "all-in" || p === "large") && shouldFold(0.78, profile, p)) {
      return foldWeakToPressure(
        profile,
        ctx,
        `Speculative hand (${profile.label}) — folding to ${pressurePhrase(p)}`,
      );
    }
    if (shouldFold(0.42, profile, p)) {
      return foldWeakToPressure(profile, ctx, `Weak starting hand — folding preflop`);
    }
    return callWith(profile, ctx, `${profile.label} — peeling one bet`, 0.42);
  }

  if ((p === "pot" || p === "all-in" || p === "large") && shouldFold(0.9, profile, p)) {
    return foldWeakToPressure(profile, ctx, "Folds trash to preflop all-in");
  }
  if (p === "medium" && shouldFold(0.62, profile, p)) {
    return foldWeakToPressure(profile, ctx, `Weak hand (${profile.label}) — folding preflop`);
  }
  if (p === "small" && ctx.toCall <= STEP_DEMO_RAISE && roll() < 0.18) {
    return callWith(profile, ctx, `Weak hand but good pot odds — calling`, 0.38);
  }
  return foldWeakToPressure(profile, ctx, `Weak starting hand — folding preflop`);
}

function decidePostflopNoBet(
  state: StepDemoState,
  profile: HandProfile,
  canRaise: boolean,
): AgentDecision {
  const street = profile.street;
  const isRiver = street === "river";

  if (profile.tier === "premium" && canRaise) {
    const freq = isRiver ? RIVER_VALUE_RAISE_FREQ : PREMIUM_VALUE_RAISE_FREQ;
    if (shouldRaise(freq, profile)) {
      const reason =
        profile.madeHand === "straight" || profile.madeHand === "flush"
          ? `${profile.label} made — raising for value`
          : "Strong made hand — raising for value";
      return raiseForValue(state, profile, null, "value_bet", reason, 0.9);
    }
  }

  if (profile.tier === "strong" && canRaise) {
    const freq = isRiver ? RIVER_VALUE_RAISE_FREQ : STRONG_VALUE_RAISE_FREQ;
    if (shouldRaise(freq, profile)) {
      const reason =
        profile.madeHand === "two_pair"
          ? `Two pair${boardPhrase(profile)} — raising larger for value`
          : `${profile.label}${boardPhrase(profile)} — raising for value`;
      return raiseForValue(state, profile, null, "value_bet", reason, 0.86);
    }
  }

  if (profile.madeHand === "top_pair" && canRaise && !isRiver && shouldRaise(TOP_PAIR_RAISE_FREQ, profile)) {
    return raiseForValue(
      state,
      profile,
      null,
      "value_bet",
      `${topPairLabel(profile)}${boardPhrase(profile)} — betting for value`,
      0.74,
    );
  }

  if (isRiver && profile.tier === "premium" && canRaise && shouldRaise(RIVER_VALUE_RAISE_FREQ, profile)) {
    return raiseForValue(
      state,
      profile,
      null,
      "value_bet",
      "Strong made hand — value betting the river",
      0.88,
    );
  }

  if (profile.draws.hasEquityDraw && !isRiver && canRaise) {
    const freq = semiBluffFreq(profile);
    if (freq > 0 && shouldRaise(freq, profile)) {
      return raiseForValue(
        state,
        profile,
        null,
        "semi_bluff",
        `${drawReason(profile)} — semi-bluffing with fold equity`,
        0.58,
      );
    }
  }

  if (profile.tier === "weak" && canRaise && roll() < 0.05) {
    return raiseForValue(
      state,
      profile,
      null,
      "probe",
      `Bluff on the ${street}${boardPhrase(profile)}`,
      0.4,
    );
  }

  if (profile.tier === "weak" || profile.tier === "speculative") {
    return decision("check", "Checks marginal showdown value", 0.58);
  }
  return decision(
    "check",
    `${profile.label}${boardPhrase(profile)} — checking to control the pot`,
    0.62,
  );
}

function decidePostflopFacingBet(
  state: StepDemoState,
  profile: HandProfile,
  ctx: BetContext,
  humanRaised: boolean,
  canRaise: boolean,
): AgentDecision {
  const street = profile.street;
  const p = ctx.pressure;
  const isRiver = street === "river";
  const category = postflopCat(profile);

  if (category === "monster" || category === "two_pair_plus") {
    const raiseFreq = isRiver ? RIVER_VALUE_RAISE_FREQ : PREMIUM_VALUE_RAISE_FREQ;
    if (canRaise && (p === "small" || p === "medium" || !humanRaised) && shouldRaise(raiseFreq, profile)) {
      return raiseForValue(
        state,
        profile,
        ctx,
        "value_reraise",
        category === "monster" ? "Monster hand — raising for value" : "Two pair+ — raising for value",
        0.9,
      );
    }
    return callWith(profile, ctx, "Two pair+ — calling with value", 0.88);
  }

  if (category === "overpair" || category === "top_pair") {
    const tpLabel = topPairLabel(profile);
    if (p === "small" || p === "medium") {
      if (canRaise && shouldRaise(TOP_PAIR_RAISE_FREQ, profile)) {
        return raiseForValue(
          state,
          profile,
          ctx,
          "value_reraise",
          `${tpLabel} — raising for value`,
          0.76,
        );
      }
      return callWith(profile, ctx, `${tpLabel} — continuing against ${pressurePhrase(p)}`, 0.74);
    }
    if ((p === "large" || p === "pot" || p === "all-in") && profile.board.paired && shouldFold(0.38, profile, p)) {
      return foldWeakToPressure(profile, ctx, `${tpLabel} on paired board — folding to ${pressurePhrase(p)}`);
    }
    return callWith(profile, ctx, `${tpLabel} — calling with showdown value`, 0.72);
  }

  if (category === "weak_pair") {
    if (p === "small" || p === "medium") {
      return callWith(profile, ctx, "Weak pair — calling small pressure", 0.58);
    }
    if (p === "large" || p === "pot" || p === "all-in") {
      return foldWeakToPressure(profile, ctx, "Folds weak pair to large pressure");
    }
  }

  if (category === "strong_draw" || category === "draw") {
    const isCombo = category === "strong_draw";
    if (p === "small" || p === "medium" || ctx.potOdds >= 2.5) {
      if (canRaise && isCombo && shouldRaise(semiBluffFreq(profile), profile)) {
        return raiseForValue(
          state,
          profile,
          ctx,
          "semi_bluff",
          "Calls with strong draw and pot odds",
          0.62,
        );
      }
      return callWith(profile, ctx, "Calls with strong draw and pot odds", 0.68);
    }
    if ((p === "large" || p === "pot" || p === "all-in") && !isCombo) {
      return foldWeakToPressure(profile, ctx, `${drawReason(profile)} — folding without enough odds`);
    }
    if (isCombo && (p === "large" || p === "pot" || p === "all-in")) {
      return callWith(profile, ctx, "Calls with strong draw and pot odds", 0.66);
    }
  }

  if (category === "air") {
    if (p === "small" && canRaise && roll() < 0.12) {
      return raiseForValue(state, profile, ctx, "probe", "Air — bluffing with fold equity", 0.42);
    }
    if (p === "large" || p === "pot" || p === "all-in") {
      return foldWeakToPressure(profile, ctx, "Air — folding to large pressure");
    }
    if (p === "small" && roll() < 0.08) {
      return callWith(profile, ctx, "Air — floating a small bet", 0.36);
    }
    return foldWeakToPressure(profile, ctx, "Air — folding to pressure");
  }

  if (profile.tier === "playable") {
    if (p === "small" || p === "medium") {
      return callWith(
        profile,
        ctx,
        `${profile.label}${boardPhrase(profile)} — calling ${pressurePhrase(p)}`,
        0.62,
      );
    }
    if ((p === "large" || p === "pot" || p === "all-in") && shouldFold(0.48, profile, p)) {
      return foldWeakToPressure(
        profile,
        ctx,
        `${profile.label} — folding to ${pressurePhrase(p)} on the ${street}`,
      );
    }
    return callWith(profile, ctx, `${profile.label} — calling with showdown value`, 0.56);
  }

  if (isRiver) {
    if (shouldFold(0.88, profile, p)) {
      return foldWeakToPressure(
        profile,
        ctx,
        `Missed draw on river facing ${pressurePhrase(p)} — folding`,
      );
    }
    if (p === "small" && roll() < 0.12) {
      return callWith(profile, ctx, `Weak high card — calling a small river bet`, 0.38);
    }
    return foldWeakToPressure(
      profile,
      ctx,
      `Weak high-card hand facing ${pressurePhrase(p)} — folding`,
    );
  }

  if (p === "pot" || p === "all-in" || p === "large") {
    if (shouldFold(0.82, profile, p)) {
      return foldWeakToPressure(
        profile,
        ctx,
        `Weak high-card hand facing heavy pressure — folding`,
      );
    }
  } else if (p === "medium" && shouldFold(0.38, profile, p)) {
    return foldWeakToPressure(
      profile,
      ctx,
      `Missed board on ${street} — folding to medium pressure`,
    );
  } else if (shouldFold(0.28, profile, p)) {
    return foldWeakToPressure(
      profile,
      ctx,
      `Weak hand on ${street} — folding`,
    );
  }

  return callWith(profile, ctx, `Weak hand but pot odds — calling once`, 0.4);
}

export function isLargePressureSpot(ctx: BetContext, aiStack: number): boolean {
  if (ctx.pressure === "all-in" || ctx.pressure === "pot") return true;
  if (aiStack > 0 && ctx.toCall >= aiStack * 0.5) return true;
  if (ctx.pot > 0 && ctx.toCall >= ctx.pot * 0.6) return true;
  return ctx.pressure === "large";
}

function foldLargePressure(reason = "Folds weak hand to large pressure"): AgentDecision {
  return decision("fold", reason, 0.84);
}

function isSmallPressure(ctx: BetContext): boolean {
  return ctx.pressure === "small";
}

/** Blocks spewy calls vs all-ins and oversized bets (turn/river focused). */
export function applyLargeBetSanityGuard(
  profile: HandProfile,
  ctx: BetContext,
  aiStack: number,
  candidate: AgentDecision,
): AgentDecision {
  if (candidate.action !== "call" && candidate.action !== "all-in") {
    return candidate;
  }
  if (!isLargePressureSpot(ctx, aiStack)) {
    return candidate;
  }

  const street = profile.street;
  const isTurnOrRiver = street === "turn" || street === "river";
  const category = postflopCat(profile);

  if (isSmallPressure(ctx)) {
    return candidate;
  }

  if (profile.tier === "premium" || profile.tier === "strong" || isMonster(profile)) {
    return {
      ...candidate,
      reasoning: "Calls with strong made hand",
      confidence: Math.max(candidate.confidence, 0.86),
    };
  }

  if (category === "two_pair_plus" || category === "monster" || category === "overpair") {
    return {
      ...candidate,
      reasoning: "Calls with strong made hand",
      confidence: Math.max(candidate.confidence, 0.86),
    };
  }

  if (
    profile.madeHand === "two_pair" ||
    profile.madeHand === "trips" ||
    profile.madeHand === "straight" ||
    profile.madeHand === "flush" ||
    profile.madeHand === "full_house_plus"
  ) {
    return {
      ...candidate,
      reasoning: "Calls with strong made hand",
      confidence: Math.max(candidate.confidence, 0.84),
    };
  }

  if (
    !isTurnOrRiver &&
    profile.draws.hasEquityDraw &&
    (profile.draws.flushDraw || profile.draws.openEndedStraight)
  ) {
    return {
      ...candidate,
      reasoning: "Calls with strong draw and pot odds",
      confidence: Math.max(candidate.confidence, 0.68),
    };
  }

  if (
    (profile.madeHand === "top_pair" || profile.isOverpair) &&
    (profile.goodKicker || profile.isOverpair) &&
    ctx.pressure !== "all-in" &&
    ctx.toCall < aiStack * 0.75
  ) {
    return {
      ...candidate,
      reasoning: "Calls with strong made hand",
      confidence: Math.max(candidate.confidence, 0.72),
    };
  }

  if (category === "weak_pair" && isTurnOrRiver) {
    return foldLargePressure("Folds weak pair to large pressure");
  }

  if (profile.madeHand === "high_card" || profile.tier === "weak" || category === "air") {
    return foldLargePressure();
  }

  if (isTurnOrRiver) {
    if (profile.madeHand === "pair" || profile.tier === "speculative") {
      return roll() < 0.12 ? candidate : foldLargePressure("Folds weak pair to large pressure");
    }
    if (profile.madeHand === "top_pair" && !profile.goodKicker && !profile.isOverpair) {
      return roll() < 0.18 ? candidate : foldLargePressure();
    }
  }

  if (profile.madeHand === "pair" && profile.tier === "playable") {
    return roll() < 0.15 ? candidate : foldLargePressure();
  }

  if (profile.tier === "playable" && isTurnOrRiver && ctx.pressure === "all-in") {
    return foldLargePressure();
  }

  return candidate;
}

function decideFacingHumanAllIn(
  profile: HandProfile,
  ctx: BetContext,
  aiStack: number,
): AgentDecision {
  const callAmount = Math.min(ctx.toCall, aiStack);
  const potOdds = ctx.potOdds;
  const isRiver = profile.street === "river";
  const category = postflopCat(profile);

  if (profile.street === "preflop") {
    const preflopCategory: PreflopCategory =
      profile.tier === "premium"
        ? "premium"
        : profile.tier === "strong"
          ? "strong"
          : profile.tier === "playable"
            ? "playable"
            : profile.tier === "speculative"
              ? "speculative"
              : "weak";

    if (shouldContinuePreflopAllIn(preflopCategory)) {
      const reason =
        preflopCategory === "premium"
          ? "Raises premium preflop range — calling all-in"
          : "Strong preflop hand — calling all-in";
      return decision("call", reason, 0.9, callAmount);
    }
    if (shouldFoldPreflopTrashToPressure(preflopCategory, "all-in")) {
      return foldLargePressure("Folds trash to preflop all-in");
    }
    if (preflopCategory === "playable" && potOdds >= 2.2) {
      return decision("call", "Playable hand — calling all-in with pot odds", 0.58, callAmount);
    }
    return foldLargePressure("Folds weak hand to preflop all-in");
  }

  if (category === "weak_pair" || category === "air") {
    return foldLargePressure(
      category === "weak_pair"
        ? "Folds weak pair to large pressure"
        : "Folds weak hand to large pressure",
    );
  }

  if (profile.madeHand === "high_card" || profile.tier === "weak") {
    return foldLargePressure();
  }

  if (profile.tier === "premium") {
    return decision("call", "Calls with strong made hand", 0.93, callAmount);
  }

  if (profile.tier === "strong") {
    return decision("call", "Strong preflop hand — calling all-in", 0.86, callAmount);
  }

  if (profile.madeHand === "top_pair" || profile.isOverpair) {
    const tpLabel = topPairLabel(profile);
    if (profile.goodKicker || profile.isOverpair || potOdds >= 1.8) {
      return decision(
        "call",
        `${tpLabel} — calling your all-in`,
        0.76,
        callAmount,
      );
    }
    if (shouldFold(0.22, profile, "all-in")) {
      return decision("fold", `${tpLabel} — folding to all-in pressure`, 0.62);
    }
    return decision(
      "call",
      `${tpLabel} — calling all-in in a good spot`,
      0.68,
      callAmount,
    );
  }

  if (profile.draws.hasEquityDraw && !isRiver) {
    const strongDraw =
      profile.draws.flushDraw || profile.draws.openEndedStraight;
    if (potOdds >= 2 && strongDraw) {
      return decision(
        "call",
        `${drawReason(profile)} — calling all-in with draw equity`,
        0.68,
        callAmount,
      );
    }
    if (shouldFold(0.58, profile, "all-in")) {
      return decision(
        "fold",
        `${drawReason(profile)} — folding to all-in without enough odds`,
        0.66,
      );
    }
    return decision(
      "call",
      `${drawReason(profile)} — calling all-in for pot odds`,
      0.52,
      callAmount,
    );
  }

  if (profile.tier === "playable" && potOdds >= 2.8 && !shouldFold(0.45, profile, "all-in")) {
    return decision(
      "call",
      `${profile.label} — calling all-in with pot odds`,
      0.52,
      callAmount,
    );
  }

  return foldLargePressure();
}

/**
 * Step Demo only — tuned PokerMaster decisions (not used in Agent Battle).
 */
export function getStepDemoPokerMasterDecision(
  state: StepDemoState,
  options: StepDemoAiDecisionOptions = {},
): AgentDecision {
  const toCall = aiToCall(state);
  const facingBet = toCall > 0;
  const humanRaised = humanAppliedPressure(state);
  const canRaise = !options.aiAlreadyRaised && !options.afterHumanReRaise;
  const profile = buildHandProfile(state);
  const ctx = buildBetContext(state, toCall, {
    humanWentAllIn: options.humanWentAllIn,
    humanRaised,
  });

  let result: AgentDecision;

  if (options.humanWentAllIn) {
    result =
      toCall > 0
        ? decideFacingHumanAllIn(profile, ctx, state.players.pokerMaster.stack)
        : decision(
            "call",
            `${profile.label} — calling all-in (already matched)`,
            0.85,
            0,
          );
  } else if (options.afterHumanReRaise && facingBet) {
    result = decideFacingReRaise(profile, ctx);
  } else if (state.street === "preflop") {
    result = facingBet
      ? decidePreflopFacingBet(state, profile, ctx, humanRaised, canRaise)
      : decidePreflopNoBet(state, profile, canRaise);
  } else {
    result = facingBet
      ? decidePostflopFacingBet(state, profile, ctx, humanRaised, canRaise)
      : decidePostflopNoBet(state, profile, canRaise);
  }

  if (options.afterHumanReRaise && result.action === "raise") {
    result = decision(
      "call",
      `${profile.label} — calling after your re-raise`,
      Math.max(tierFloor(profile.tier) * 0.85, result.confidence * 0.9),
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

  result = applyLargeBetSanityGuard(
    profile,
    ctx,
    state.players.pokerMaster.stack,
    result,
  );

  const downgradedAction = downgradeAiBettingVsZeroHuman(
    getHumanInHandStack(state),
    state.humanAllIn,
    facingBet,
    result.action,
  );
  if (downgradedAction !== result.action) {
    result = decision(
      downgradedAction === "check" && facingBet ? "call" : downgradedAction,
      `${profile.label} — ${facingBet ? "calling" : "checking"} (opponent has no chips)`,
      result.confidence * 0.9,
      downgradedAction === "call" || downgradedAction === "all-in"
        ? toCall
        : undefined,
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[stepDemo/ai]", {
      street: state.street,
      action: result.action,
      tier: profile.tier,
      madeHand: profile.madeHand,
      pressure: ctx.pressure,
      toCall,
    });
  }

  return result;
}
