import type { StepDemoState } from "@/lib/arena/stepDemo";
import { sanitizeHumanVsAiLogMessage } from "@/lib/arena/humanVsAiDecisionPrivacy";
import type { Card, GameAction, GameMode, SimulationResult } from "@/lib/poker/types";

export type HandHistoryCreateContext = {
  handNumber?: number;
  humanStackBeforeHand?: number;
  settlementLabel?: string;
  depositTxHash?: string;
  claimTxHash?: string;
  depositExplorerUrl?: string;
  claimExplorerUrl?: string;
};

export const HAND_HISTORY_STORAGE_KEY = "poker-ai-arena-hand-history-v1";
export const MAX_HAND_HISTORY = 10;

export type HandHistoryModeLabel = "Human vs AI" | "AI Agent Battle";

export type HandHistoryResultType = "Showdown" | "Win by fold" | "Stack depleted";

export type HandHistoryPlayerCards = {
  playerId: string;
  playerName: string;
  holeCards: Card[];
};

export type HandHistoryRecord = {
  id: string;
  timestamp: number;
  mode: HandHistoryModeLabel;
  gameMode: GameMode;
  handNumber?: number;
  winnerName: string;
  winnerId: string;
  resultType: HandHistoryResultType;
  winningHandName?: string;
  potWon: number;
  communityCards: Card[];
  playerCards: HandHistoryPlayerCards[];
  summary: string;
  actionCount: number;
  actionPreview: string;
  humanChipChange?: number;
  humanFinalChips?: number;
  humanStackBeforeHand?: number;
  settlementLabel?: string;
  depositTxHash?: string;
  claimTxHash?: string;
  depositExplorerUrl?: string;
  claimExplorerUrl?: string;
};

function modeLabel(gameMode: GameMode): HandHistoryModeLabel {
  return gameMode === "agent-vs-agent" ? "AI Agent Battle" : "Human vs AI";
}

function resultTypeFromWinningHandName(rankName: string): HandHistoryResultType {
  if (rankName === "Win by fold") return "Win by fold";
  return "Showdown";
}

function truncatePreviewText(text: string, maxLen = 72): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function buildActionPreview(actions: GameAction[], maxItems = 2): string {
  const interesting = actions.filter(
    (entry) =>
      entry.action !== "deal" &&
      entry.playerId !== "system" &&
      entry.message.trim().length > 0,
  );
  const tail = interesting.slice(-maxItems);
  if (tail.length === 0) return "";
  return tail
    .map((entry) =>
      truncatePreviewText(sanitizeHumanVsAiLogMessage(entry.message), 64),
    )
    .join(" · ");
}

function winnerVerbPhrase(winnerName: string): "won" | "wins" {
  return winnerName === "You" ? "won" : "wins";
}

/** Card headline: "You won 240 chips" or "PokerMaster wins 185 chips". */
export function formatHandHistoryWinnerPot(
  winnerName: string,
  potWon: number,
): string {
  const chips = potWon.toLocaleString();
  if (winnerName === "You") {
    return `You won ${chips} chips`;
  }
  return `${winnerName} wins ${chips} chips`;
}

function buildSummaryLine(
  mode: HandHistoryModeLabel,
  winnerName: string,
  potWon: number,
  winningHandName?: string,
  extras?: string,
): string {
  const handPart =
    winningHandName && winningHandName !== "Win by fold"
      ? winningHandName
      : "Win by fold";
  const extra = extras ? ` · ${extras}` : "";
  const verb = winnerVerbPhrase(winnerName);
  const winnerPart =
    winnerName === "You"
      ? `You ${verb} ${potWon.toLocaleString()} chips`
      : `${winnerName} ${verb} ${potWon.toLocaleString()} chips`;
  return `${mode} · ${winnerPart} · ${handPart}${extra}`;
}

function createId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `hand-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createHandHistoryFromSimulation(
  result: SimulationResult,
): HandHistoryRecord {
  const mode = modeLabel(result.gameMode);
  const resultType = resultTypeFromWinningHandName(result.winningHand.rankName);

  const playerCards: HandHistoryPlayerCards[] = result.players.map((player) => ({
    playerId: player.id,
    playerName: player.name,
    holeCards: player.holeCards,
  }));

  const actionPreview = buildActionPreview(result.actionLog);
  const allInMention = result.actionLog.some((entry) =>
    entry.message.toLowerCase().includes("all-in"),
  )
    ? "all-in pot"
    : undefined;

  return {
    id: `${result.gameMode}:${result.gameId}`,
    timestamp: Date.now(),
    mode,
    gameMode: result.gameMode,
    handNumber: result.handNumber,
    winnerName: result.winner.name,
    winnerId: result.winner.id,
    resultType,
    winningHandName:
      resultType === "Showdown" ? result.winningHand.rankName : undefined,
    potWon: result.pot,
    communityCards: [...result.communityCards],
    playerCards,
    summary: buildSummaryLine(
      mode,
      result.winner.name,
      result.pot,
      result.winningHand.rankName,
      allInMention,
    ),
    actionCount: result.actionLog.filter((entry) => entry.action !== "deal")
      .length,
    actionPreview,
  };
}

export function createHandHistoryFromStepDemo(
  state: StepDemoState,
  context: HandHistoryCreateContext = {},
): HandHistoryRecord {
  const winningHandName = state.winningHandName ?? "Showdown";
  const resultType = resultTypeFromWinningHandName(winningHandName);
  const mode: HandHistoryModeLabel = "Human vs AI";

  const playerCards: HandHistoryPlayerCards[] = [
    {
      playerId: state.players.human.id,
      playerName: state.players.human.name,
      holeCards: state.players.human.holeCards,
    },
  ];

  if (state.revealAiCards || resultType === "Showdown") {
    playerCards.push({
      playerId: state.players.pokerMaster.id,
      playerName: state.players.pokerMaster.name,
      holeCards: state.players.pokerMaster.holeCards,
    });
  }

  const extras =
    state.humanAllIn || state.allInShowdown ? "all-in showdown" : undefined;

  const actionPreview = buildActionPreview(state.actionLog);
  const humanFinalChips = Math.max(0, Math.floor(state.players.human.stack));
  const humanStackBeforeHand = context.humanStackBeforeHand;
  const humanChipChange =
    humanStackBeforeHand != null
      ? humanFinalChips - Math.max(0, Math.floor(humanStackBeforeHand))
      : undefined;

  return {
    id: `human-vs-ai:${state.lastPotWon}:${state.winner?.id ?? "unknown"}:${state.actionLog.length}:${winningHandName}`,
    timestamp: Date.now(),
    mode,
    gameMode: "human-vs-ai",
    handNumber: context.handNumber,
    winnerName: state.winner?.name ?? "Unknown",
    winnerId: state.winner?.id ?? "unknown",
    resultType,
    winningHandName:
      resultType === "Showdown" ? winningHandName : undefined,
    potWon: state.lastPotWon,
    communityCards: [...state.communityCards],
    playerCards,
    summary: buildSummaryLine(
      mode,
      state.winner?.name ?? "Unknown",
      state.lastPotWon,
      winningHandName,
      extras || undefined,
    ),
    actionCount: state.actionLog.filter((entry) => entry.action !== "deal")
      .length,
    actionPreview,
    humanFinalChips,
    humanChipChange,
    humanStackBeforeHand,
    settlementLabel: context.settlementLabel,
    depositTxHash: context.depositTxHash,
    claimTxHash: context.claimTxHash,
    depositExplorerUrl: context.depositExplorerUrl,
    claimExplorerUrl: context.claimExplorerUrl,
  };
}

export function prependHandHistory(
  history: HandHistoryRecord[],
  record: HandHistoryRecord,
): HandHistoryRecord[] {
  const withoutDup = history.filter((entry) => entry.id !== record.id);
  return [record, ...withoutDup].slice(0, MAX_HAND_HISTORY);
}

export function loadHandHistory(): HandHistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HAND_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is HandHistoryRecord =>
          entry != null &&
          typeof entry === "object" &&
          typeof (entry as HandHistoryRecord).id === "string" &&
          typeof (entry as HandHistoryRecord).winnerName === "string",
      )
      .slice(0, MAX_HAND_HISTORY);
  } catch {
    return [];
  }
}

export function saveHandHistory(history: HandHistoryRecord[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      HAND_HISTORY_STORAGE_KEY,
      JSON.stringify(history.slice(0, MAX_HAND_HISTORY)),
    );
  } catch (error) {
    console.warn("[arena/handHistory] save failed", error);
  }
}

export function clearHandHistoryStorage(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(HAND_HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatHandHistoryTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 45_000) return "just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `${minutes}m ago`;
  }
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function simulationHistoryFingerprint(result: SimulationResult): string {
  return `${result.gameMode}:${result.gameId}:${result.handNumber}`;
}

export function stepDemoHistoryFingerprint(state: StepDemoState): string | null {
  if (state.step !== "result" || !state.winner) return null;
  return `human-vs-ai:${state.lastPotWon}:${state.winner.id}:${state.winningHandName}:${state.actionLog.length}`;
}

/** Compact mode + hand line for history cards. */
export function formatHandHistoryHandLine(record: HandHistoryRecord): string {
  const hand =
    record.winningHandName && record.resultType === "Showdown"
      ? record.winningHandName
      : record.resultType;
  return `${record.mode} · ${hand}`;
}
