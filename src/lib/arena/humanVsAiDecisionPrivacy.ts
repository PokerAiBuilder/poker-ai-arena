import type { SimulationAgentDecision } from "@/lib/poker/types";
import type { StepDemoState } from "@/lib/arena/stepDemo";

/** Public board/pressure tags safe before showdown. */
const PUBLIC_TAG_PATTERNS = [
  /^dry board$/i,
  /^paired board$/i,
  /^flush-heavy board$/i,
  /^wet connected board$/i,
  /^connected board$/i,
  /^high-card board$/i,
  /^paired, flush-heavy board$/i,
  /^no pressure$/i,
  /^small pressure$/i,
  /^medium pressure$/i,
  /^large pressure$/i,
  /^all-in pressure$/i,
];

const PRIVATE_HAND_PATTERNS = [
  /\btop pair\b/i,
  /\btwo pair\b/i,
  /\btrips\b/i,
  /\bset\b/i,
  /\boverpair\b/i,
  /\bpair\b/i,
  /\bflush draw\b/i,
  /\bstraight draw\b/i,
  /\bcombo draw\b/i,
  /\bgutshot\b/i,
  /\bovercards\b/i,
  /\bweak high card\b/i,
  /\bpremium preflop\b/i,
  /\bpocket\b/i,
  /\bstraight\b/i,
  /\bflush\b/i,
  /\bfull house\b/i,
  /\bquads\b/i,
  /\bhigh card\b/i,
  /\bmissed draw\b/i,
  /\bsuited\b/i,
  /\boffsuit\b/i,
  /\bequity draw\b/i,
];

function isPublicTag(tag: string): boolean {
  return PUBLIC_TAG_PATTERNS.some((pattern) => pattern.test(tag.trim()));
}

function revealsPrivateHand(text: string): boolean {
  return PRIVATE_HAND_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * PokerMaster hole cards / hand strength may be shown only after showdown
 * with cards revealed — never on fold wins.
 */
export function shouldRevealPokerMasterHandContext(
  state: StepDemoState,
): boolean {
  if (!state.revealAiCards) return false;
  if (state.winningHandName === "Win by fold") return false;
  if (state.step === "result") return true;
  if (state.allInShowdown) return true;
  return false;
}

function publicReasoning(decision: SimulationAgentDecision): string {
  const pressure = (decision.pressureLabel ?? "").toLowerCase();
  const heavy =
    pressure.includes("all-in") || pressure.includes("large");
  const medium = pressure.includes("medium");
  const light = pressure.includes("small") || pressure === "no pressure";

  switch (decision.action) {
    case "fold":
      if (decision.reasoning.startsWith("FOLD to all-in")) {
        return "PokerMaster folds to all-in pressure.";
      }
      if (heavy) return "PokerMaster folds to heavy pressure.";
      if (medium || light) {
        return "PokerMaster avoids overcommitting to this price.";
      }
      return "PokerMaster releases this spot.";
    case "check":
      return "PokerMaster checks.";
    case "call":
      if (decision.reasoning.startsWith("CALL all-in")) {
        return "PokerMaster calls the all-in.";
      }
      if (heavy || medium) {
        return "PokerMaster calls with enough equity to continue.";
      }
      return "PokerMaster continues in the pot.";
    case "raise":
    case "all-in":
      if (heavy || medium) {
        return "PokerMaster continues against medium pressure.";
      }
      return "PokerMaster applies pressure with its current range.";
    default:
      return "PokerMaster acted.";
  }
}

function filterPublicReasonTags(
  decision: SimulationAgentDecision,
): string[] | undefined {
  const tags = decision.reasonTags ?? [];
  const filtered = tags.filter((tag) => isPublicTag(tag));
  if (filtered.length > 0) return filtered.slice(0, 4);

  const fallback: string[] = [];
  if (decision.pressureLabel && decision.pressureLabel !== "No pressure") {
    fallback.push(decision.pressureLabel);
  }
  if (decision.boardLabel) fallback.push(decision.boardLabel);
  return fallback.length > 0 ? fallback : undefined;
}

/** Strip private hand metadata for active Human vs AI hands. */
export function sanitizeHumanVsAiDecisionDisplay(
  decision: SimulationAgentDecision,
  revealPrivate: boolean,
): SimulationAgentDecision {
  if (revealPrivate) return decision;

  let reasoning = publicReasoning(decision);
  if (
    (decision.action === "raise" || decision.action === "all-in") &&
    decision.reasoning.includes("You need to call")
  ) {
    const callMatch = decision.reasoning.match(/You need to call (\d+) to continue\./);
    if (callMatch) {
      reasoning = `${reasoning} You need to call ${callMatch[1]} to continue.`;
    }
  }

  return {
    ...decision,
    handLabel: undefined,
    reasonTags: filterPublicReasonTags(decision),
    reasoning: revealsPrivateHand(reasoning)
      ? "PokerMaster acted based on range and pot odds."
      : reasoning,
  };
}

/** Sanitize action-log preview lines that may embed private reasoning (defensive). */
export function sanitizeHumanVsAiLogMessage(message: string): string {
  if (!revealsPrivateHand(message)) return message;
  if (/\bfold(s|ed)?\b/i.test(message)) {
    return message.replace(/\s*—.*$/i, "").trim() || message;
  }
  return message.split("—")[0]?.trim() || message;
}
