import type { Card, Rank } from "@/lib/poker/types";
import { RANK_VALUES } from "@/lib/poker/types";
import type { HandTier } from "@/lib/arena/stepDemoHandAnalysis";

export type PreflopCategory = "premium" | "strong" | "playable" | "speculative" | "weak";

export type PreflopClassification = {
  tier: HandTier;
  category: PreflopCategory;
  strength: number;
  label: string;
};

function cardValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

/**
 * Lightweight preflop buckets:
 * premium — AA, KK, QQ, JJ, AKs, AKo
 * strong — TT, 99, AQs, AQo, AJs, KQs
 * playable — small/medium pairs, suited broadways, strong suited aces
 */
export function classifyPreflopHand(hole: Card[]): PreflopClassification {
  if (hole.length !== 2) {
    return {
      tier: "weak",
      category: "weak",
      strength: 0,
      label: "weak starting hand",
    };
  }

  const [r0, r1] = hole.map((c) => cardValue(c.rank));
  const high = Math.max(r0, r1);
  const low = Math.min(r0, r1);
  const suited = hole[0].suit === hole[1].suit;
  const pair = r0 === r1;
  const labelPair = `pocket ${hole[0].rank}s`;

  if (pair && high >= 11) {
    return {
      tier: "premium",
      category: "premium",
      strength: 88 + high,
      label: labelPair,
    };
  }

  if (high === 14 && low === 13) {
    return {
      tier: "premium",
      category: "premium",
      strength: suited ? 90 : 88,
      label: suited ? "AK suited" : "AK offsuit",
    };
  }

  if (pair && high >= 9) {
    return {
      tier: "strong",
      category: "strong",
      strength: 70 + high,
      label: labelPair,
    };
  }

  if (high === 14 && low === 12) {
    return {
      tier: "strong",
      category: "strong",
      strength: suited ? 76 : 74,
      label: suited ? "AQ suited" : "AQ offsuit",
    };
  }

  if (high === 14 && low === 11 && suited) {
    return {
      tier: "strong",
      category: "strong",
      strength: 70,
      label: "AJ suited",
    };
  }

  if (high === 13 && low === 12 && suited) {
    return {
      tier: "strong",
      category: "strong",
      strength: 68,
      label: "KQ suited",
    };
  }

  if (pair && high >= 6) {
    return {
      tier: "playable",
      category: "playable",
      strength: 48 + high,
      label: labelPair,
    };
  }

  if (suited && high === 14 && low >= 10) {
    return {
      tier: "playable",
      category: "playable",
      strength: 56,
      label: `${hole[0].rank}${hole[1].rank} suited`,
    };
  }

  if (high >= 11 && low >= 10) {
    return {
      tier: "playable",
      category: "playable",
      strength: suited ? 54 : 48,
      label: `${hole[0].rank}${hole[1].rank}${suited ? " suited" : ""}`,
    };
  }

  if (suited && high === 14 && low >= 8) {
    return {
      tier: "playable",
      category: "playable",
      strength: 50,
      label: `${hole[0].rank}${hole[1].rank} suited`,
    };
  }

  if (suited && high >= 9 && low >= 7 && high - low <= 4) {
    return {
      tier: "speculative",
      category: "speculative",
      strength: 40,
      label: `${hole[0].rank}${hole[1].rank} suited`,
    };
  }

  if (high >= 10) {
    return {
      tier: "speculative",
      category: "speculative",
      strength: 34,
      label: `${hole[0].rank}${hole[1].rank}`,
    };
  }

  return {
    tier: "weak",
    category: "weak",
    strength: 14,
    label: "weak starting hand",
  };
}

export function shouldContinuePreflopAllIn(category: PreflopCategory): boolean {
  return category === "premium" || category === "strong";
}

export function shouldFoldPreflopTrashToPressure(
  category: PreflopCategory,
  pressure: "small" | "medium" | "large" | "pot" | "all-in",
): boolean {
  if (category === "premium" || category === "strong") return false;
  if (category === "weak") return pressure !== "small";
  if (category === "speculative") {
    return pressure === "pot" || pressure === "all-in" || pressure === "large";
  }
  return pressure === "pot" || pressure === "all-in" || pressure === "large";
}
