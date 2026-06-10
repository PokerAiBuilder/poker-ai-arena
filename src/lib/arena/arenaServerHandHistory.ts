import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import type { StepDemoState } from "@/lib/arena/stepDemo";
import type { ArenaServerHandRecord } from "@/lib/arena/arenaServerSessionTypes";

export const ARENA_SERVER_MAX_HAND_HISTORY = 50;

export const ARENA_SERVER_HAND_HISTORY_STORE_TODO =
  "TODO: persist server hand history in DB/Prisma/Supabase/Neon — current store is in-memory demo only.";

export type ArenaServerHandResultInput = {
  handId?: string;
  mode?: "human-vs-ai";
  winner: "human" | "ai";
  pot: number;
  chipDelta: number;
  finalChips: number;
  resultLabel?: string;
  completedAt?: string;
};

export type AggregatedHandStats = {
  handsPlayed: number;
  wins: number;
  losses: number;
  biggestPot: number;
};

function safeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(value);
}

function safeNonNegativeInt(value: number): number {
  return Math.max(0, safeInt(value));
}

function clampChipDelta(value: number): number {
  return safeInt(value);
}

export function parseHandWinner(value: unknown): "human" | "ai" | null {
  return value === "human" || value === "ai" ? value : null;
}

export function parseHandMode(value: unknown): "human-vs-ai" | null {
  if (value == null || value === "human-vs-ai") return "human-vs-ai";
  return null;
}

export function parseResultLabel(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, 120);
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseCompletedAt(value: unknown): string | null {
  if (value == null) return new Date().toISOString();
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

export function parseHandId(value: unknown): string | null {
  if (value == null || value === "") {
    return `hand_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 4 || trimmed.length > 128) return null;
  if (!/^[a-zA-Z0-9:_-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function parseLatestHandResult(
  value: unknown,
): ArenaServerHandResultInput | { error: string } {
  if (!value || typeof value !== "object") {
    return { error: "Invalid latestHandResult." };
  }

  const body = value as Record<string, unknown>;
  const winner = parseHandWinner(body.winner);
  if (!winner) return { error: "Invalid hand winner." };

  const mode = parseHandMode(body.mode);
  if (!mode) return { error: "Invalid hand mode." };

  const pot = safeNonNegativeInt(Number(body.pot));
  const finalChips = safeNonNegativeInt(Number(body.finalChips));
  const chipDelta = clampChipDelta(Number(body.chipDelta));

  if (!Number.isFinite(Number(body.pot)) || !Number.isFinite(Number(body.finalChips))) {
    return { error: "Invalid hand chip fields." };
  }

  const handId = parseHandId(body.handId);
  if (!handId) return { error: "Invalid handId." };

  const completedAt = parseCompletedAt(body.completedAt);
  if (!completedAt) return { error: "Invalid completedAt." };

  return {
    handId,
    mode,
    winner,
    pot,
    chipDelta,
    finalChips,
    resultLabel: parseResultLabel(body.resultLabel),
    completedAt,
  };
}

export function buildServerHandRecord(
  walletAddress: string,
  escrowSessionId: string,
  input: ArenaServerHandResultInput,
): ArenaServerHandRecord {
  return {
    handId: input.handId ?? parseHandId(null)!,
    walletAddress: walletAddress.toLowerCase(),
    escrowSessionId,
    mode: "human-vs-ai",
    winner: input.winner,
    pot: safeNonNegativeInt(input.pot),
    chipDelta: clampChipDelta(input.chipDelta),
    finalChips: safeNonNegativeInt(input.finalChips),
    resultLabel: input.resultLabel,
    completedAt: input.completedAt ?? new Date().toISOString(),
  };
}

export function appendRecentHands(
  existing: ArenaServerHandRecord[] | undefined,
  hand: ArenaServerHandRecord,
): ArenaServerHandRecord[] {
  const deduped = (existing ?? []).filter((entry) => entry.handId !== hand.handId);
  return [hand, ...deduped].slice(0, ARENA_SERVER_MAX_HAND_HISTORY);
}

export function aggregateHandStatsFromHistory(
  hands: ArenaServerHandRecord[] | undefined,
): AggregatedHandStats {
  if (!hands || hands.length === 0) {
    return { handsPlayed: 0, wins: 0, losses: 0, biggestPot: 0 };
  }

  let wins = 0;
  let losses = 0;
  let biggestPot = 0;

  for (const hand of hands) {
    if (hand.winner === "human") wins += 1;
    else losses += 1;
    biggestPot = Math.max(biggestPot, safeNonNegativeInt(hand.pot));
  }

  return {
    handsPlayed: hands.length,
    wins,
    losses,
    biggestPot,
  };
}

export function resolveSessionHandStats(
  session: {
    handsPlayed?: number;
    wins?: number;
    losses?: number;
    biggestPot?: number;
    recentHands?: ArenaServerHandRecord[];
  },
): AggregatedHandStats {
  const fromHistory = aggregateHandStatsFromHistory(session.recentHands);
  if (fromHistory.handsPlayed > 0) return fromHistory;

  return {
    handsPlayed: safeNonNegativeInt(session.handsPlayed ?? 0),
    wins: safeNonNegativeInt(session.wins ?? 0),
    losses: safeNonNegativeInt(session.losses ?? 0),
    biggestPot: safeNonNegativeInt(session.biggestPot ?? 0),
  };
}

export function serverHandToHandHistoryRecord(
  hand: ArenaServerHandRecord,
): HandHistoryRecord {
  const winnerName = hand.winner === "human" ? "You" : "PokerMaster";
  const resultType =
    hand.resultLabel === "Win by fold" ? "Win by fold" : "Showdown";

  return {
    id: `server:${hand.handId}`,
    timestamp: Date.parse(hand.completedAt) || Date.now(),
    mode: "Human vs AI",
    gameMode: "human-vs-ai",
    winnerName,
    winnerId: hand.winner === "human" ? "human" : "poker-master",
    resultType,
    winningHandName:
      resultType === "Showdown" ? hand.resultLabel : undefined,
    potWon: hand.pot,
    communityCards: [],
    playerCards: [],
    summary: `${winnerName} · Pot ${hand.pot.toLocaleString()} · Stack ${hand.finalChips.toLocaleString()}`,
    actionCount: 0,
    actionPreview: hand.resultLabel ?? "",
    humanChipChange: hand.chipDelta,
    humanFinalChips: hand.finalChips,
    settlementLabel: "Testnet session",
  };
}

export function buildServerHandResultFromStepDemo(
  stepDemo: StepDemoState,
  handNumber?: number,
  humanStackBeforeHand?: number,
): ArenaServerHandResultInput | null {
  if (!stepDemo.winner || stepDemo.step !== "result") return null;

  const humanFinal = safeNonNegativeInt(stepDemo.players.human.stack);
  const humanBefore =
    humanStackBeforeHand != null
      ? safeNonNegativeInt(humanStackBeforeHand)
      : null;
  const chipDelta =
    humanBefore != null
      ? humanFinal - safeNonNegativeInt(humanBefore)
      : stepDemo.winner.id === "human"
        ? safeNonNegativeInt(stepDemo.lastPotWon)
        : -safeNonNegativeInt(stepDemo.lastPotWon);

  const winner: "human" | "ai" =
    stepDemo.winner.id === "human" ? "human" : "ai";

  const resultLabel =
    stepDemo.winningHandName && stepDemo.winningHandName !== "Win by fold"
      ? stepDemo.winningHandName
      : stepDemo.winningHandName === "Win by fold"
        ? "Win by fold"
        : undefined;

  return {
    handId: handNumber != null ? `hvai_${handNumber}_${stepDemo.lastPotWon}` : undefined,
    mode: "human-vs-ai",
    winner,
    pot: safeNonNegativeInt(stepDemo.lastPotWon),
    chipDelta,
    finalChips: humanFinal,
    resultLabel,
    completedAt: new Date().toISOString(),
  };
}
