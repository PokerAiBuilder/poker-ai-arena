import type { StepDemoState } from "@/lib/arena/stepDemo";
import { STEP_DEMO_RAISE_MIN } from "@/lib/arena/stepDemoConstants";
import type { BetContext, HandProfile } from "@/lib/arena/stepDemoHandAnalysis";

/** Human vs AI PokerMaster raise increment tiers (chips above current bet). */
export const AI_RAISE_SMALL = 10;
export const AI_RAISE_STANDARD = 25;
export const AI_RAISE_VALUE = 50;
export const AI_RAISE_BIG = 75;

export type RaiseIntent =
  | "preflop_open"
  | "preflop_3bet"
  | "value_bet"
  | "value_reraise"
  | "semi_bluff"
  | "probe";

function roll(): number {
  return Math.random();
}

function clampIncrement(n: number): number {
  if (!Number.isFinite(n)) return AI_RAISE_SMALL;
  return Math.max(STEP_DEMO_RAISE_MIN, Math.floor(n));
}

export function potRaiseIncrement(state: StepDemoState): number {
  return clampIncrement(Math.max(STEP_DEMO_RAISE_MIN, state.pot));
}

function isDryBoard(profile: HandProfile): boolean {
  return (
    profile.board.summary === "dry board" ||
    (!profile.board.paired &&
      !profile.board.flushHeavy &&
      !profile.board.connected &&
      profile.board.summary !== "preflop")
  );
}

function isScaryBoard(profile: HandProfile): boolean {
  return (
    profile.board.paired ||
    profile.board.flushHeavy ||
    profile.board.connected
  );
}

function isMonsterMadeHand(profile: HandProfile): boolean {
  return (
    profile.madeHand === "straight" ||
    profile.madeHand === "flush" ||
    profile.madeHand === "full_house_plus"
  );
}

/**
 * Pick raise increment for PokerMaster (Step Demo only).
 * Returns chip increment above currentBet; caller caps by stack.
 */
export function pickPokerMasterRaiseIncrement(
  state: StepDemoState,
  profile: HandProfile,
  ctx: BetContext | null,
  intent: RaiseIntent,
): number {
  const dry = isDryBoard(profile);
  const scary = isScaryBoard(profile);
  const potInc = potRaiseIncrement(state);

  if (intent === "semi_bluff") {
    if (profile.draws.flushDraw && profile.draws.openEndedStraight) {
      return roll() < 0.55 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
    }
    if (profile.draws.flushDraw && profile.draws.overcards) {
      return roll() < 0.65 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
    }
    if (profile.draws.flushDraw || profile.draws.openEndedStraight) {
      return roll() < 0.7 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
    }
    return AI_RAISE_SMALL;
  }

  if (intent === "preflop_open" || intent === "preflop_3bet") {
    if (profile.tier === "premium") {
      if (intent === "preflop_3bet") {
        return roll() < 0.55 ? AI_RAISE_VALUE : AI_RAISE_STANDARD;
      }
      return roll() < 0.5 ? AI_RAISE_VALUE : AI_RAISE_STANDARD;
    }
    if (profile.tier === "strong") {
      return roll() < 0.45 ? AI_RAISE_STANDARD : AI_RAISE_SMALL;
    }
    return AI_RAISE_SMALL;
  }

  if (isMonsterMadeHand(profile)) {
    if (dry && roll() < 0.5) return potInc;
    if (!scary && roll() < 0.65) return AI_RAISE_BIG;
    return roll() < 0.55 ? AI_RAISE_VALUE : AI_RAISE_STANDARD;
  }

  if (profile.madeHand === "two_pair" || profile.madeHand === "trips") {
    if (dry && roll() < 0.6) {
      return roll() < 0.45 ? potInc : AI_RAISE_VALUE;
    }
    if (scary) return roll() < 0.55 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
    return roll() < 0.5 ? AI_RAISE_VALUE : AI_RAISE_STANDARD;
  }

  if (profile.isOverpair) {
    if (dry && roll() < 0.5) return AI_RAISE_VALUE;
    return roll() < 0.55 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
  }

  if (profile.madeHand === "top_pair" && profile.goodKicker) {
    if (dry && roll() < 0.45) return AI_RAISE_STANDARD;
    return roll() < 0.65 ? AI_RAISE_STANDARD : AI_RAISE_SMALL;
  }

  if (profile.madeHand === "top_pair") {
    return roll() < 0.55 ? AI_RAISE_STANDARD : AI_RAISE_SMALL;
  }

  if (profile.tier === "premium" || profile.tier === "strong") {
    if (intent === "value_reraise") {
      if (ctx && (ctx.pressure === "small" || ctx.pressure === "medium")) {
        return roll() < 0.55 ? AI_RAISE_VALUE : AI_RAISE_STANDARD;
      }
      return AI_RAISE_STANDARD;
    }
    if (dry && roll() < 0.45) return AI_RAISE_VALUE;
    return roll() < 0.55 ? AI_RAISE_STANDARD : AI_RAISE_VALUE;
  }

  if (intent === "probe") return AI_RAISE_SMALL;

  return AI_RAISE_SMALL;
}

export function formatRaiseReasoning(
  baseReason: string,
  increment: number,
  state: StepDemoState,
): string {
  const potInc = potRaiseIncrement(state);
  if (increment >= potInc * 0.85) {
    return baseReason.replace(/\.?$/, " — applying pot pressure.");
  }
  if (increment >= AI_RAISE_BIG) {
    return baseReason.replace(/\.?$/, " — raising larger for value.");
  }
  if (increment >= AI_RAISE_VALUE) {
    return baseReason.replace(/\.?$/, " — value-raising.");
  }
  if (increment >= AI_RAISE_STANDARD) {
    return baseReason.replace(/\.?$/, " — value-raising small.");
  }
  return baseReason;
}

export function maxAiRaiseIncrement(state: StepDemoState): number {
  const aiStack = Math.max(0, Math.floor(state.players.pokerMaster.stack));
  if (aiStack <= 0) return 0;
  const toCall = Math.max(0, state.currentBet - state.aiStreetBet);
  if (state.currentBet === 0) {
    return aiStack + state.aiStreetBet;
  }
  return Math.max(0, aiStack - toCall);
}

export function resolvePokerMasterRaiseIncrement(
  state: StepDemoState,
  requested: number,
): number {
  const safe = clampIncrement(requested);
  const maxInc = maxAiRaiseIncrement(state);
  if (maxInc <= 0) return 0;
  return Math.min(safe, maxInc);
}
