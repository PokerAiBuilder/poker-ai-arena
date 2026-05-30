import type { Card, EvaluatedHand, HandRank, Rank } from "@/lib/poker/types";
import {
  HAND_RANK_LABELS,
  RANK_VALUES,
  formatCards,
} from "@/lib/poker/types";

const CATEGORY_SCORE: Record<HandRank, number> = {
  high_card: 1,
  pair: 2,
  two_pair: 3,
  three_of_a_kind: 4,
  straight: 5,
  flush: 6,
  full_house: 7,
  four_of_a_kind: 8,
  straight_flush: 9,
};

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];

  const [first, ...rest] = items;
  const withFirst = combinations(rest, size - 1).map((combo) => [first, ...combo]);
  const withoutFirst = combinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

function cardValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

function isFlush(cards: Card[]): boolean {
  return new Set(cards.map((c) => c.suit)).size === 1;
}

function straightHighCard(values: number[]): number | null {
  const unique = [...new Set(values)].sort((a, b) => a - b);
  if (unique.length !== 5) return null;

  if (unique[4] - unique[0] === 4) {
    return unique[4];
  }

  // Wheel: A-2-3-4-5
  if (
    unique[0] === 2 &&
    unique[1] === 3 &&
    unique[2] === 4 &&
    unique[3] === 5 &&
    unique[4] === 14
  ) {
    return 5;
  }

  return null;
}

function rankCounts(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function evaluateFive(cards: Card[]): EvaluatedHand {
  const values = cards.map((c) => cardValue(c.rank)).sort((a, b) => b - a);
  const counts = rankCounts(values);
  const groups = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0] - a[0],
  );

  const flush = isFlush(cards);
  const straightHigh = straightHighCard(values);

  if (flush && straightHigh !== null) {
    return buildHand("straight_flush", cards, [straightHigh]);
  }

  if (groups[0][1] === 4) {
    const quad = groups[0][0];
    const kicker = groups[1][0];
    return buildHand("four_of_a_kind", cards, [quad, kicker]);
  }

  if (groups[0][1] === 3 && groups[1][1] === 2) {
    return buildHand("full_house", cards, [groups[0][0], groups[1][0]]);
  }

  if (flush) {
    return buildHand("flush", cards, values);
  }

  if (straightHigh !== null) {
    return buildHand("straight", cards, [straightHigh]);
  }

  if (groups[0][1] === 3) {
    const trips = groups[0][0];
    const kickers = groups.slice(1).map(([v]) => v);
    return buildHand("three_of_a_kind", cards, [trips, ...kickers]);
  }

  if (groups[0][1] === 2 && groups[1][1] === 2) {
    const highPair = Math.max(groups[0][0], groups[1][0]);
    const lowPair = Math.min(groups[0][0], groups[1][0]);
    const kicker = groups[2][0];
    return buildHand("two_pair", cards, [highPair, lowPair, kicker]);
  }

  if (groups[0][1] === 2) {
    const pair = groups[0][0];
    const kickers = groups.slice(1).map(([v]) => v);
    return buildHand("pair", cards, [pair, ...kickers]);
  }

  return buildHand("high_card", cards, values);
}

function buildHand(
  rank: HandRank,
  cards: Card[],
  tiebreakers: number[],
): EvaluatedHand {
  return {
    rank,
    rankName: HAND_RANK_LABELS[rank],
    scores: [CATEGORY_SCORE[rank], ...tiebreakers],
    bestFive: cards,
  };
}

export function evaluateBestHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error(`Need at least 5 cards to evaluate, got ${cards.length}`);
  }

  const combos = combinations(cards, 5);
  let best = evaluateFive(combos[0]);

  for (let i = 1; i < combos.length; i += 1) {
    const candidate = evaluateFive(combos[i]);
    if (compareEvaluatedHands(candidate, best) > 0) {
      best = candidate;
    }
  }

  return best;
}

export function compareEvaluatedHands(a: EvaluatedHand, b: EvaluatedHand): number {
  const maxLen = Math.max(a.scores.length, b.scores.length);
  for (let i = 0; i < maxLen; i += 1) {
    const diff = (a.scores[i] ?? 0) - (b.scores[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function describeHand(hand: EvaluatedHand): string {
  return `${hand.rankName} (${formatCards(hand.bestFive)})`;
}

/** Debug helper — logs evaluator sanity checks in development. */
export function runEvaluatorSelfCheck(): void {
  if (process.env.NODE_ENV === "production") return;

  const flushHand = evaluateBestHand([
    { rank: "A", suit: "spades" },
    { rank: "K", suit: "spades" },
    { rank: "Q", suit: "spades" },
    { rank: "J", suit: "spades" },
    { rank: "9", suit: "spades" },
    { rank: "2", suit: "hearts" },
    { rank: "3", suit: "diamonds" },
  ]);

  const pairHand = evaluateBestHand([
    { rank: "A", suit: "hearts" },
    { rank: "A", suit: "clubs" },
    { rank: "K", suit: "diamonds" },
    { rank: "Q", suit: "spades" },
    { rank: "J", suit: "hearts" },
  ]);

  console.debug("[poker/evaluator] self-check flush:", flushHand.rankName);
  console.debug("[poker/evaluator] self-check pair:", pairHand.rankName);
}
