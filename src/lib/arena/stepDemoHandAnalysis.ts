import type { Card, HandRank, Rank } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";
import { evaluateBestHand } from "@/lib/poker/evaluator";
import type { StepDemoState, StepDemoStreet } from "@/lib/arena/stepDemo";
import { classifyPreflopHand } from "@/lib/arena/preflopRanges";

export type HandTier = "premium" | "strong" | "playable" | "speculative" | "weak";

export type MadeHandKind =
  | "high_card"
  | "pair"
  | "top_pair"
  | "two_pair"
  | "trips"
  | "straight"
  | "flush"
  | "full_house_plus";

export type BoardTexture = {
  paired: boolean;
  flushHeavy: boolean;
  connected: boolean;
  highCard: boolean;
  summary: string;
};

export type DrawInfo = {
  flushDraw: boolean;
  openEndedStraight: boolean;
  gutshot: boolean;
  overcards: boolean;
  hasEquityDraw: boolean;
  summary: string;
};

export type PostflopCategory =
  | "air"
  | "draw"
  | "weak_pair"
  | "top_pair"
  | "overpair"
  | "two_pair_plus"
  | "strong_draw"
  | "monster";

export type HandProfile = {
  tier: HandTier;
  strength: number;
  label: string;
  rank?: HandRank;
  madeHand?: MadeHandKind;
  postflopCategory?: PostflopCategory;
  /** Pocket pair above the board (postflop). */
  isOverpair?: boolean;
  /** Top pair with J+ kicker (postflop). */
  goodKicker?: boolean;
  draws: DrawInfo;
  board: BoardTexture;
  street: StepDemoStreet;
};

export type BetPressure = "small" | "medium" | "large" | "pot" | "all-in";

export type BetContext = {
  toCall: number;
  pot: number;
  callPotRatio: number;
  /** Pot size before call divided by call amount (higher = better odds). */
  potOdds: number;
  pressure: BetPressure;
};

export function classifyPostflopCategory(profile: HandProfile): PostflopCategory {
  if (
    profile.madeHand === "straight" ||
    profile.madeHand === "flush" ||
    profile.madeHand === "full_house_plus"
  ) {
    return "monster";
  }
  if (profile.madeHand === "two_pair" || profile.madeHand === "trips") {
    return "two_pair_plus";
  }
  if (profile.isOverpair) return "overpair";
  if (profile.madeHand === "top_pair") return "top_pair";
  if (profile.madeHand === "pair") return "weak_pair";
  if (profile.draws.flushDraw && profile.draws.openEndedStraight) {
    return "strong_draw";
  }
  if (profile.draws.hasEquityDraw) return "draw";
  return "air";
}

function cardValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

function boardRanks(board: Card[]): number[] {
  return board.map((c) => cardValue(c.rank));
}

export function analyzeBoardTexture(board: Card[]): BoardTexture {
  if (board.length === 0) {
    return {
      paired: false,
      flushHeavy: false,
      connected: false,
      highCard: false,
      summary: "preflop",
    };
  }

  const ranks = boardRanks(board).sort((a, b) => a - b);
  const suitCounts = new Map<string, number>();
  for (const c of board) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }

  const paired = new Set(ranks).size < ranks.length;
  const flushHeavy = [...suitCounts.values()].some((n) => n >= 3);
  const highCard = ranks.some((r) => r >= 12);
  const span = ranks[ranks.length - 1] - ranks[0];
  const connected = board.length >= 3 && span <= 4;

  let summary = "dry board";
  if (paired && flushHeavy) summary = "paired, flush-heavy board";
  else if (paired) summary = "paired board";
  else if (flushHeavy && connected) summary = "wet connected board";
  else if (flushHeavy) summary = "flush-heavy board";
  else if (connected) summary = "connected board";
  else if (highCard) summary = "high-card board";

  return { paired, flushHeavy, connected, highCard, summary };
}

function uniqueSortedValues(cards: Card[]): number[] {
  return [...new Set(cards.map((c) => cardValue(c.rank)))].sort((a, b) => a - b);
}

export function analyzeDraws(hole: Card[], board: Card[]): DrawInfo {
  if (board.length < 3) {
    return {
      flushDraw: false,
      openEndedStraight: false,
      gutshot: false,
      overcards: false,
      hasEquityDraw: false,
      summary: "",
    };
  }

  const all = [...hole, ...board];
  const suits = new Map<string, number>();
  for (const c of all) {
    suits.set(c.suit, (suits.get(c.suit) ?? 0) + 1);
  }
  const flushDraw = [...suits.values()].some((n) => n === 4);

  const values = uniqueSortedValues(all);
  const ranks = values.includes(14) ? [1, ...values] : values;

  let openEndedStraight = false;
  let gutshot = false;
  for (let i = 0; i <= ranks.length - 4; i += 1) {
    const w = ranks.slice(i, i + 4);
    const span = w[3] - w[0];
    if (span === 3) openEndedStraight = true;
    else if (span === 4) gutshot = true;
  }

  const boardHigh = Math.max(...boardRanks(board));
  const overcards =
    hole.length === 2 &&
    cardValue(hole[0].rank) > boardHigh &&
    cardValue(hole[1].rank) > boardHigh;

  const parts: string[] = [];
  if (flushDraw) parts.push("flush draw");
  if (openEndedStraight) parts.push("open-ended straight draw");
  else if (gutshot) parts.push("gutshot");
  if (overcards) parts.push("overcards");

  const hasEquityDraw = flushDraw || openEndedStraight || gutshot;

  return {
    flushDraw,
    openEndedStraight,
    gutshot,
    overcards,
    hasEquityDraw,
    summary: parts.join(", "),
  };
}

function holePairRank(hole: Card[]): number | null {
  if (hole.length !== 2 || hole[0].rank !== hole[1].rank) return null;
  return cardValue(hole[0].rank);
}

function classifyPairHand(hole: Card[], board: Card[]): MadeHandKind {
  const pairRank = holePairRank(hole);
  if (pairRank !== null) {
    const boardHigh = Math.max(...boardRanks(board));
    if (pairRank > boardHigh) return "top_pair";
    return "pair";
  }

  const boardSorted = boardRanks(board).sort((a, b) => b - a);
  const holeVals = hole.map((c) => cardValue(c.rank));
  const topBoard = boardSorted[0];

  if (holeVals.includes(topBoard)) return "top_pair";
  if (holeVals.some((v) => boardSorted.includes(v))) return "pair";
  return "high_card";
}

function rankToMadeHand(rank: HandRank, hole: Card[], board: Card[]): MadeHandKind {
  switch (rank) {
    case "high_card":
      return classifyPairHand(hole, board);
    case "pair":
      return classifyPairHand(hole, board);
    case "two_pair":
      return "two_pair";
    case "three_of_a_kind":
      return "trips";
    case "straight":
      return "straight";
    case "flush":
      return "flush";
    case "full_house":
    case "four_of_a_kind":
    case "straight_flush":
      return "full_house_plus";
    default:
      return "high_card";
  }
}

const RANK_LABELS: Record<HandRank, string> = {
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

function madeHandLabel(made: MadeHandKind, rank: HandRank): string {
  if (made === "top_pair") return "top pair";
  if (made === "full_house_plus") {
    return rank === "full_house"
      ? "full house"
      : rank === "four_of_a_kind"
        ? "quads"
        : "straight flush";
  }
  if (made === "high_card") return "high card";
  return RANK_LABELS[rank] ?? made;
}

export function analyzePreflopHand(hole: Card[]): HandProfile {
  const classified = classifyPreflopHand(hole);
  const emptyDraws: DrawInfo = {
    flushDraw: false,
    openEndedStraight: false,
    gutshot: false,
    overcards: false,
    hasEquityDraw: false,
    summary: "",
  };
  const emptyBoard: BoardTexture = {
    paired: false,
    flushHeavy: false,
    connected: false,
    highCard: false,
    summary: "preflop",
  };

  return {
    tier: classified.tier,
    strength: classified.strength,
    label: classified.label,
    draws: emptyDraws,
    board: emptyBoard,
    street: "preflop",
  };
}

export function analyzePostflopHand(
  hole: Card[],
  board: Card[],
  street: StepDemoStreet,
): HandProfile {
  const evaluated = evaluateBestHand([...hole, ...board]);
  const rank = evaluated.rank;
  const madeHand = rankToMadeHand(rank, hole, board);
  const draws = analyzeDraws(hole, board);
  const boardTexture = analyzeBoardTexture(board);
  const label = madeHandLabel(madeHand, rank);
  const isRiver = street === "river";

  let tier: HandTier;
  let strength: number;

  if (
    rank === "straight_flush" ||
    rank === "four_of_a_kind" ||
    rank === "full_house" ||
    rank === "flush" ||
    rank === "straight"
  ) {
    tier = "premium";
    strength = 95;
  } else if (rank === "three_of_a_kind" || rank === "two_pair") {
    tier = "strong";
    strength = 82;
  } else if (madeHand === "top_pair") {
    tier = boardTexture.flushHeavy || boardTexture.connected ? "playable" : "strong";
    strength = boardTexture.paired ? 58 : 70;
  } else if (rank === "pair") {
    tier = "playable";
    strength = 48;
  } else if (draws.hasEquityDraw && !isRiver) {
    tier = draws.openEndedStraight || draws.flushDraw ? "playable" : "speculative";
    strength = draws.flushDraw && draws.openEndedStraight ? 55 : 42;
  } else if (draws.overcards && !isRiver) {
    tier = "speculative";
    strength = 32;
  } else {
    tier = "weak";
    strength = 12;
  }

  if (isRiver && draws.hasEquityDraw && tier !== "premium" && tier !== "strong") {
    if (rank === "high_card" || rank === "pair") {
      tier = "weak";
      strength = Math.min(strength, 20);
    }
  }

  let isOverpair = false;
  let goodKicker = false;
  const pocketRank = holePairRank(hole);
  if (pocketRank !== null && board.length > 0) {
    isOverpair = pocketRank > Math.max(...boardRanks(board));
  } else if (madeHand === "top_pair" && hole.length === 2) {
    const topBoard = Math.max(...boardRanks(board));
    const kicker = hole.find((c) => cardValue(c.rank) !== topBoard);
    goodKicker = kicker !== undefined && cardValue(kicker.rank) >= 11;
  }

  if (isOverpair && tier !== "premium" && tier !== "strong") {
    tier = "strong";
    strength = Math.max(strength, 74);
  }
  if (goodKicker && madeHand === "top_pair") {
    strength = Math.max(strength, 72);
  }

  const profile: HandProfile = {
    tier,
    strength,
    label,
    rank,
    madeHand,
    isOverpair,
    goodKicker,
    draws,
    board: boardTexture,
    street,
  };
  profile.postflopCategory = classifyPostflopCategory(profile);
  return profile;
}

export function buildHandProfile(state: StepDemoState): HandProfile {
  const hole = state.players.pokerMaster.holeCards;
  if (state.street === "preflop" || state.communityCards.length < 3) {
    return analyzePreflopHand(hole);
  }
  return analyzePostflopHand(hole, state.communityCards, state.street);
}

export function buildBetContext(
  state: StepDemoState,
  toCall: number,
  options: { humanWentAllIn?: boolean; humanRaised?: boolean },
): BetContext {
  const pot = state.pot;
  const aiStack = state.players.pokerMaster.stack;
  const potAfterCall = pot + toCall;
  const callPotRatio = toCall > 0 ? toCall / Math.max(1, potAfterCall) : 0;
  const callVsStack = aiStack > 0 && toCall > 0 ? toCall / aiStack : 0;
  const callVsPot = pot > 0 && toCall > 0 ? toCall / pot : 0;

  let pressure: BetPressure = "small";
  if (
    options.humanWentAllIn ||
    (aiStack > 0 && toCall >= aiStack) ||
    callVsStack >= 0.5
  ) {
    pressure = "all-in";
  } else if (
    callVsPot >= 0.6 ||
    callPotRatio >= 0.55 ||
    state.lastHumanRaiseIncrement >= pot * 0.85
  ) {
    pressure = "pot";
  } else if (callPotRatio >= 0.38 || state.lastHumanRaiseIncrement >= 45) {
    pressure = "large";
  } else if (callPotRatio >= 0.22 || state.lastHumanRaiseIncrement >= 20) {
    pressure = "medium";
  }

  if (options.humanRaised && pressure === "small" && toCall > 0) {
    pressure = "medium";
  }

  const potOdds = toCall > 0 ? pot / toCall : 999;

  return { toCall, pot, callPotRatio, potOdds, pressure };
}
