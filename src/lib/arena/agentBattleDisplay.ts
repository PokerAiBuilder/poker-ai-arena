import type { HandResultDisplayType } from "@/lib/arena/simulationDisplay";
import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import { getAgentStyleBadge } from "@/lib/agents/agentProfiles";
import type { AgentBattleAccountingSnapshot } from "@/lib/poker/types";

export type AgentBattleSeatStatusInput = {
  status: "active" | "folded" | "winner" | "idle";
  activeHighlight?: "thinking" | "acting";
};

export type AgentBattleResultSummaryInput = {
  winnerName: string;
  winnerId?: string;
  resultType: HandResultDisplayType;
  winningHand?: string;
  pot: number | null;
  accounting?: AgentBattleAccountingSnapshot | null;
  summaryReason?: string;
};

export type AgentBattleResultSummary = {
  winnerName: string;
  resultLabel: string;
  potLabel: string | null;
  chipDeltaLabel: string | null;
  summaryLine: string;
  headline: string;
  detailLine: string;
};

const STYLE_BADGE_ALIASES: Record<string, string> = {
  Bluffy: "Bluff",
};

export function normalizeAgentStyleBadge(
  badge: string | undefined | null,
): string | undefined {
  if (!badge?.trim()) return undefined;
  const trimmed = badge.trim();
  return STYLE_BADGE_ALIASES[trimmed] ?? trimmed;
}

export function getAgentStyleBadgeLabel(agentId: string): string | undefined {
  return normalizeAgentStyleBadge(getAgentStyleBadge(agentId));
}

export function formatAgentBattleSeatStatusLabel(
  input: AgentBattleSeatStatusInput,
): string | null {
  if (input.activeHighlight === "thinking") return "Thinking";
  if (input.activeHighlight === "acting") return "Acting";
  if (input.status === "winner") return "Winner";
  if (input.status === "folded") return "Folded";
  if (input.status === "active") return null;
  return null;
}

export function computeWinnerChipDelta(
  accounting: AgentBattleAccountingSnapshot | null | undefined,
  winnerId?: string,
): number | null {
  if (!accounting || !winnerId) return null;
  const starting = accounting.startingStacks[winnerId];
  const final = accounting.finalStacks[winnerId];
  if (!Number.isFinite(starting) || !Number.isFinite(final)) return null;
  return Math.floor(final) - Math.floor(starting);
}

export function formatChipDeltaLabel(delta: number | null): string | null {
  if (delta == null || !Number.isFinite(delta) || delta === 0) return null;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString()} chips`;
}

export function formatAgentBattleResultLabel(
  resultType: HandResultDisplayType,
  winningHand?: string,
): string {
  if (resultType === "fold") return "Win by fold";
  const hand = winningHand?.trim();
  if (!hand || hand.toLowerCase() === "showdown") return "Showdown";
  return hand;
}

export function buildAgentBattleResultSummary(
  input: AgentBattleResultSummaryInput,
): AgentBattleResultSummary {
  const resultLabel = formatAgentBattleResultLabel(
    input.resultType,
    input.winningHand,
  );
  const potLabel =
    input.pot != null && Number.isFinite(input.pot)
      ? `Pot ${Math.max(0, Math.floor(input.pot)).toLocaleString()}`
      : null;
  const chipDelta = computeWinnerChipDelta(input.accounting, input.winnerId);
  const chipDeltaLabel = formatChipDeltaLabel(chipDelta);

  const parts = [resultLabel, potLabel, chipDeltaLabel].filter(
    (part): part is string => Boolean(part),
  );
  const summaryReason = input.summaryReason?.trim();
  const summaryLine = summaryReason
    ? `${parts.join(" · ")}${parts.length > 0 ? " · " : ""}${summaryReason}`
    : parts.join(" · ");

  const headline = `${input.winnerName} wins`;
  const detailLine = [resultLabel, potLabel].filter(Boolean).join(" · ");

  return {
    winnerName: input.winnerName,
    resultLabel,
    potLabel,
    chipDeltaLabel,
    summaryLine: summaryLine || resultLabel,
    headline,
    detailLine: detailLine || resultLabel,
  };
}

export function isValidAgentBattleResultLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === "unknown") return false;
  return true;
}

export type AgentBattleHistoryCard = {
  headline: string;
  detailLine: string;
  chipDeltaLabel: string | null;
};

export function formatAgentBattleHistoryCard(
  entry: HandHistoryRecord,
): AgentBattleHistoryCard {
  const resultLabel =
    entry.resultType === "Win by fold"
      ? "Win by fold"
      : entry.winningHandName?.trim() || entry.resultType;
  const potPart = `Pot ${entry.potWon.toLocaleString()}`;
  return {
    headline: `${entry.winnerName} wins`,
    detailLine: [resultLabel, potPart].filter(Boolean).join(" · "),
    chipDeltaLabel: null,
  };
}
