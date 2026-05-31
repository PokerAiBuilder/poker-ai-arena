import { getAgentProfile } from "@/lib/agents/agentProfiles";
import {
  analyzePostflopHand,
  analyzePreflopHand,
  type HandProfile,
  type PokerStreet,
} from "@/lib/poker/handAnalysis";
import type { AiDecisionDisplayMeta } from "@/lib/poker/types";
import type { Card, GameStage } from "@/lib/poker/types";

export type BetPressureKind = "small" | "medium" | "large" | "pot" | "all-in";

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const BOARD_LABELS: Record<string, string> = {
  preflop: "Preflop",
  "dry board": "Dry board",
  "paired board": "Paired board",
  "flush-heavy board": "Flush-heavy board",
  "wet connected board": "Wet connected board",
  "connected board": "Connected board",
  "high-card board": "High-card board",
  "paired, flush-heavy board": "Paired, flush-heavy board",
};

export function formatBoardLabel(
  boardSummary: string,
  street: GameStage | PokerStreet,
): string | undefined {
  if (street === "preflop" || boardSummary === "preflop") return undefined;
  return BOARD_LABELS[boardSummary] ?? titleCase(boardSummary);
}

export function formatPressureLabel(
  pressure: BetPressureKind,
  toCall: number,
): string {
  if (toCall <= 0) return "No pressure";
  switch (pressure) {
    case "all-in":
      return "All-in pressure";
    case "pot":
    case "large":
      return "Large pressure";
    case "medium":
      return "Medium pressure";
    case "small":
    default:
      return "Small pressure";
  }
}

export function formatHandLabel(
  profile: HandProfile,
  street: GameStage | PokerStreet,
): string {
  if (street === "preflop" || profile.street === "preflop") {
    if (profile.tier === "premium") return "Premium Preflop";
    if (profile.tier === "weak") return "Weak High Card";
    return titleCase(profile.label);
  }

  if (
    profile.draws.hasEquityDraw &&
    profile.tier !== "premium" &&
    profile.tier !== "strong"
  ) {
    if (profile.draws.flushDraw && profile.draws.openEndedStraight) {
      return "Combo Draw";
    }
    if (profile.draws.flushDraw) return "Flush Draw";
    if (profile.draws.openEndedStraight) return "Straight Draw";
    if (profile.draws.gutshot) return "Gutshot Draw";
  }

  if (profile.madeHand === "top_pair") return "Top Pair";
  if (profile.madeHand === "two_pair") return "Two Pair";
  if (profile.madeHand === "trips") return "Trips";
  if (profile.isOverpair) return "Overpair";
  if (profile.madeHand === "high_card" && profile.tier === "weak") {
    return "Weak High Card";
  }

  return titleCase(profile.label);
}

export function buildReasonTags(
  meta: Pick<AiDecisionDisplayMeta, "handLabel" | "boardLabel" | "pressureLabel">,
): string[] {
  const tags: string[] = [];
  if (meta.handLabel) tags.push(meta.handLabel);
  if (meta.pressureLabel && meta.pressureLabel !== "No pressure") {
    tags.push(meta.pressureLabel);
  }
  if (meta.boardLabel) tags.push(meta.boardLabel);
  return tags.slice(0, 4);
}

export function buildDecisionDisplayMeta(input: {
  agentId: string;
  holeCards: Card[];
  communityCards: Card[];
  stage: GameStage;
  toCall: number;
  pressure: BetPressureKind;
}): AiDecisionDisplayMeta {
  const profile =
    input.stage === "preflop" || input.communityCards.length < 3
      ? analyzePreflopHand(input.holeCards)
      : analyzePostflopHand(
          input.holeCards,
          input.communityCards,
          input.stage === "turn"
            ? "turn"
            : input.stage === "river"
              ? "river"
              : "flop",
        );

  const handLabel = formatHandLabel(profile, input.stage);
  const boardLabel = formatBoardLabel(profile.board.summary, input.stage);
  const pressureLabel = formatPressureLabel(input.pressure, input.toCall);
  const styleLabel = getAgentProfile(input.agentId)?.title;

  const partial = { handLabel, boardLabel, pressureLabel, styleLabel };
  return {
    ...partial,
    reasonTags: buildReasonTags(partial),
  };
}

export function agentBattlePressure(
  state: { pot: number; bigBlind: number },
  toCall: number,
): BetPressureKind {
  const pot = state.pot;
  const potAfter = pot + toCall;
  const callPotRatio = toCall > 0 ? toCall / Math.max(1, potAfter) : 0;
  const bb = state.bigBlind;

  if (callPotRatio >= 0.5 || toCall >= pot * 0.85) return "pot";
  if (callPotRatio >= 0.35 || toCall >= bb * 15) return "large";
  if (callPotRatio >= 0.2 || toCall >= bb * 6) return "medium";
  return "small";
}
