import type { GameAction, GameStage } from "@/lib/poker/types";

export type LogPhase =
  | "PREFLOP"
  | "FLOP"
  | "TURN"
  | "RIVER"
  | "SHOWDOWN"
  | "RESULT"
  | "SYSTEM";

export type LogActionType =
  | "RAISE"
  | "CALL"
  | "CHECK"
  | "FOLD"
  | "ALL_IN"
  | "DEAL"
  | "WINNER"
  | "RESET"
  | "INFO";

export type StreetFilter =
  | "ALL"
  | "PREFLOP"
  | "FLOP"
  | "TURN"
  | "RIVER"
  | "SHOWDOWN";

export type ActionLogDisplayEntry = {
  key: string;
  phase: LogPhase;
  actionType: LogActionType;
  actorName?: string;
  amount?: number;
  pot?: number;
  displayText: string;
  isShowdownBlock: boolean;
  /** Agent Battle — single consolidated final result card per hand */
  isBattleResultCard?: boolean;
  isError: boolean;
  winnerName?: string;
  winningHand?: string;
  potWon?: number;
  chipDeltaLabel?: string;
  resultType?: string;
  raw: GameAction;
};

const STREET_FROM_STAGE: Record<GameStage, LogPhase> = {
  preflop: "PREFLOP",
  flop: "FLOP",
  turn: "TURN",
  river: "RIVER",
  showdown: "SHOWDOWN",
};

function isArenaSystemEntry(entry: GameAction): boolean {
  return entry.playerId === "system" || entry.playerName === "Arena";
}

/** Session / menu lines — not hand replay. */
function isSessionOnlyMessage(messageLower: string): boolean {
  if (messageLower.startsWith("error:")) return true;
  if (messageLower.includes("simulation failed")) return true;
  if (messageLower.includes("demo session")) return true;
  if (messageLower.includes("arena stats")) return true;
  if (messageLower.includes("stacks reset") || messageLower.includes("demo stacks reset")) {
    return true;
  }
  if (messageLower.includes("agent battle stacks reset")) return true;
  if (/^new hand started\.?$/i.test(messageLower.trim())) return true;
  if (messageLower.includes("human vs ai") && messageLower.includes("new hand")) {
    return true;
  }
  return false;
}

function phaseFromStage(stage: GameStage): LogPhase {
  return STREET_FROM_STAGE[stage] ?? "PREFLOP";
}

function parseRaiseIncrement(message: string): number | undefined {
  const plus = message.match(/raises?\s*\+(\d+)/i);
  if (plus) return Number.parseInt(plus[1], 10);
  const youRaise = message.match(/you raise\s*\+(\d+)/i);
  if (youRaise) return Number.parseInt(youRaise[1], 10);
  const to = message.match(/raises?\s+to\s+(\d+)/i);
  if (to) return Number.parseInt(to[1], 10);
  const potParen = message.match(/raise\s+pot\s*\((\d+)/i);
  if (potParen) return Number.parseInt(potParen[1], 10);
  const raiseChips = message.match(/raise\s*\+(\d+)\s*chips/i);
  if (raiseChips) return Number.parseInt(raiseChips[1], 10);
  return undefined;
}

function parseCallAmount(message: string): number | undefined {
  const match = message.match(/calls?\s+(\d+)/i);
  if (match) return Number.parseInt(match[1], 10);
  return undefined;
}

function parseAllInAmount(message: string): number | undefined {
  const match = message.match(/all-in\s+for\s+(\d+)/i);
  if (match) return Number.parseInt(match[1], 10);
  return undefined;
}

function parsePotFromMessage(message: string): number | undefined {
  const settled = message.match(/Pot settled:.*?(\d[\d,]*)\s*chips/i);
  if (settled) return Number.parseInt(settled[1].replace(/,/g, ""), 10);
  const potLabel = message.match(/Pot[:\s]+(\d[\d,]*)/i);
  if (potLabel) return Number.parseInt(potLabel[1].replace(/,/g, ""), 10);
  const winsParen = message.match(/wins.*?(\d[\d,]*)\s*chips/i);
  if (winsParen) return Number.parseInt(winsParen[1].replace(/,/g, ""), 10);
  const potWon = message.match(/pot won\s+(\d[\d,]*)/i);
  if (potWon) return Number.parseInt(potWon[1].replace(/,/g, ""), 10);
  return undefined;
}

function parseWinnerName(message: string): string | undefined {
  const settled = message.match(/Pot settled:\s*([^—]+?)\s+wins/i);
  if (settled) return settled[1].trim();
  const wins = message.match(/^([^—]+?)\s+wins/i);
  if (wins) return wins[1].trim();
  const split = message.match(/Split pot —\s*([^&]+)/i);
  if (split) return split[1].trim();
  if (/\byou win\b/i.test(message)) return "You";
  if (/pokermaster wins/i.test(message)) return "PokerMaster";
  return undefined;
}

function parseWinningHand(message: string): string | undefined {
  const showdown = message.match(/Showdown:\s*([^(\d]+?)(?:\s*\(|$)/i);
  if (showdown) return showdown[1].trim();
  const withHand = message.match(/with\s+([A-Za-z0-9 ]+?)(?:\.|$)/i);
  if (withHand && !withHand[1].toLowerCase().includes("chips")) {
    return withHand[1].trim();
  }
  const tie = message.match(/tie with\s+([^.]+)/i);
  if (tie) return tie[1].trim();
  if (message.toLowerCase().includes("win by fold")) return "Win by fold";
  return undefined;
}

function isResultMessage(messageLower: string): boolean {
  if (messageLower.includes("pot settled") || messageLower.includes("pot won")) {
    return true;
  }
  if (messageLower.includes("win by fold") || messageLower.includes("you win")) {
    return true;
  }
  if (/\bwins\b/.test(messageLower) && messageLower.includes("—")) {
    return true;
  }
  if (messageLower.includes("hand complete")) return true;
  return false;
}

function isShowdownMessage(messageLower: string): boolean {
  return (
    messageLower.includes("showdown complete") ||
    messageLower.includes("all-in showdown") ||
    messageLower.includes("board runout complete")
  );
}

function isBoardDealMessage(messageLower: string): boolean {
  return (
    messageLower.includes("flop revealed") ||
    messageLower.includes("turn revealed") ||
    messageLower.includes("river revealed") ||
    messageLower.includes("flop dealt") ||
    messageLower.includes("turn dealt") ||
    messageLower.includes("river dealt") ||
    messageLower.startsWith("flop:") ||
    messageLower.startsWith("turn:") ||
    messageLower.startsWith("river:")
  );
}

function inferPhaseFromMessage(messageLower: string): LogPhase | null {
  if (messageLower.includes("pot settled") || messageLower.includes("pot won")) {
    return "RESULT";
  }
  if (isResultMessage(messageLower) && !isShowdownMessage(messageLower)) {
    return "RESULT";
  }
  if (isShowdownMessage(messageLower)) {
    return messageLower.includes("board runout") ? "RIVER" : "SHOWDOWN";
  }
  if (messageLower.includes("flop revealed") || messageLower.includes("flop dealt")) {
    return "FLOP";
  }
  if (messageLower.startsWith("flop:")) return "FLOP";
  if (messageLower.includes("turn revealed") || messageLower.includes("turn dealt")) {
    return "TURN";
  }
  if (messageLower.startsWith("turn:")) return "TURN";
  if (messageLower.includes("river revealed") || messageLower.includes("river dealt")) {
    return "RIVER";
  }
  if (messageLower.startsWith("river:")) return "RIVER";
  if (messageLower.includes("new hand dealt") || messageLower.includes("blinds posted")) {
    return "PREFLOP";
  }
  return null;
}

function inferPhase(entry: GameAction, messageLower: string): LogPhase {
  if (!isArenaSystemEntry(entry)) {
    if (entry.stage === "showdown" || isResultMessage(messageLower)) {
      return isResultMessage(messageLower) ? "RESULT" : "SHOWDOWN";
    }
    return phaseFromStage(entry.stage);
  }

  const fromMessage = inferPhaseFromMessage(messageLower);
  if (fromMessage) return fromMessage;

  if (isSessionOnlyMessage(messageLower)) return "SYSTEM";

  if (messageLower.includes(" stacks updated")) return "RESULT";

  if (entry.stage === "showdown") {
    return isResultMessage(messageLower) ? "RESULT" : "SHOWDOWN";
  }

  if (entry.action === "deal" && entry.stage !== "preflop") {
    return phaseFromStage(entry.stage);
  }

  if (entry.stage !== "preflop" || messageLower.includes("pokerMaster")) {
    return phaseFromStage(entry.stage);
  }

  return "SYSTEM";
}

function inferActionTypeFromMessage(
  messageLower: string,
  entry: GameAction,
): LogActionType | null {
  if (messageLower.includes("reset") && isSessionOnlyMessage(messageLower)) {
    return "RESET";
  }
  if (isBoardDealMessage(messageLower) || messageLower.includes("new hand dealt")) {
    return "DEAL";
  }
  if (messageLower.includes("blinds posted")) return "INFO";
  if (messageLower.includes("choose call")) return "INFO";
  if (
    isResultMessage(messageLower) ||
    messageLower.includes("showdown complete") ||
    messageLower.includes("you win")
  ) {
    return "WINNER";
  }
  if (/\bfold(s|ed)?\b/.test(messageLower)) return "FOLD";
  if (/\bcheck(s|ed)?\b/.test(messageLower)) return "CHECK";
  if (/\ball-in\b/.test(messageLower)) return "ALL_IN";
  if (/\braise(s|d)?\b/.test(messageLower)) return "RAISE";
  if (/\bcall(s|ed)?\b/.test(messageLower)) return "CALL";
  if (entry.action === "showdown") return "WINNER";
  return null;
}

function inferActionType(
  entry: GameAction,
  messageLower: string,
  phase: LogPhase,
): LogActionType {
  if (messageLower.startsWith("error:")) return "INFO";
  if (messageLower.includes("reset") && phase === "SYSTEM") return "RESET";

  const fromMessage = inferActionTypeFromMessage(messageLower, entry);
  if (fromMessage) return fromMessage;

  if (
    phase === "RESULT" ||
    (messageLower.includes("pot settled") && messageLower.includes("wins"))
  ) {
    return "WINNER";
  }

  if (
    entry.stage === "showdown" &&
    (/\bwins?\b/.test(messageLower) || messageLower.includes("split pot"))
  ) {
    return "WINNER";
  }

  if (entry.action === "showdown") return "WINNER";

  switch (entry.action) {
    case "raise":
      return "RAISE";
    case "call":
      return "CALL";
    case "check":
      return "CHECK";
    case "fold":
      return "FOLD";
    case "all-in":
      return "ALL_IN";
    case "blind":
      return "INFO";
    case "deal":
      return isBoardDealMessage(messageLower) || messageLower.includes("new hand dealt")
        ? "DEAL"
        : "INFO";
    default:
      return "INFO";
  }
}

function inferActorName(entry: GameAction, message: string): string | undefined {
  if (isArenaSystemEntry(entry)) {
    const winner = parseWinnerName(message);
    if (winner) return winner;
    return undefined;
  }
  if (entry.playerName && entry.playerName !== "Arena") {
    return entry.playerName;
  }
  return undefined;
}

function inferAmount(entry: GameAction, message: string): number | undefined {
  if (entry.amount != null && entry.amount > 0) return entry.amount;
  return (
    parseRaiseIncrement(message) ??
    parseCallAmount(message) ??
    parseAllInAmount(message) ??
    undefined
  );
}

function updatesStreetCursor(messageLower: string): LogPhase | null {
  if (
    messageLower.includes("flop revealed") ||
    messageLower.includes("flop dealt") ||
    messageLower.startsWith("flop:")
  ) {
    return "FLOP";
  }
  if (
    messageLower.includes("turn revealed") ||
    messageLower.includes("turn dealt") ||
    messageLower.startsWith("turn:")
  ) {
    return "TURN";
  }
  if (
    messageLower.includes("river revealed") ||
    messageLower.includes("river dealt") ||
    messageLower.startsWith("river:")
  ) {
    return "RIVER";
  }
  if (messageLower.includes("new hand dealt")) return "PREFLOP";
  return null;
}

function shouldInheritStreetPhase(
  entry: ActionLogDisplayEntry,
  messageLower: string,
): boolean {
  if (entry.phase !== "SYSTEM") return false;
  if (isSessionOnlyMessage(messageLower)) return false;
  return isArenaSystemEntry(entry.raw);
}

export function normalizeActionLogEntry(
  entry: GameAction,
  index: number,
): ActionLogDisplayEntry {
  const message = entry.message;
  const messageLower = message.toLowerCase();
  const phase = inferPhase(entry, messageLower);
  const actionType = inferActionType(entry, messageLower, phase);
  const pot = parsePotFromMessage(message);
  const amount = inferAmount(entry, message);
  const isError = messageLower.startsWith("error:");
  const isShowdownBlock =
    actionType === "WINNER" ||
    phase === "RESULT" ||
    (phase === "SHOWDOWN" &&
      (/\bwins?\b/.test(messageLower) ||
        messageLower.includes("showdown") ||
        messageLower.includes("pot settled")));

  const winnerName = parseWinnerName(message) ?? inferActorName(entry, message);
  const winningHand = parseWinningHand(message);
  const potWon = pot;

  let resultType: string | undefined;
  if (isShowdownBlock) {
    if (messageLower.includes("win by fold")) resultType = "Win by fold";
    else if (messageLower.includes("split pot")) resultType = "Split pot";
    else if (messageLower.includes("showdown")) resultType = "Showdown";
    else if (messageLower.includes("pot settled")) resultType = "Pot settled";
    else if (/\byou win\b/.test(messageLower)) resultType = "Pot won";
  }

  return {
    key: `${entry.timestamp}-${index}`,
    phase,
    actionType,
    actorName: inferActorName(entry, message),
    amount,
    pot,
    displayText: message,
    isShowdownBlock,
    isError,
    winnerName,
    winningHand,
    potWon,
    resultType,
    raw: entry,
  };
}

export function normalizeActionLogEntries(
  entries: GameAction[],
): ActionLogDisplayEntry[] {
  let streetCursor: LogPhase = "PREFLOP";

  return entries.map((entry, index) => {
    const messageLower = entry.message.toLowerCase();
    const cursorUpdate = updatesStreetCursor(messageLower);
    if (cursorUpdate) streetCursor = cursorUpdate;

    const normalized = normalizeActionLogEntry(entry, index);

    if (normalized.phase === "RESULT") {
      return normalized;
    }

    if (normalized.phase !== "SYSTEM") {
      if (
        normalized.phase === "PREFLOP" ||
        normalized.phase === "FLOP" ||
        normalized.phase === "TURN" ||
        normalized.phase === "RIVER"
      ) {
        streetCursor = normalized.phase;
      }
      return normalized;
    }

    if (shouldInheritStreetPhase(normalized, messageLower)) {
      return { ...normalized, phase: streetCursor };
    }

    return normalized;
  });
}

function isAgentBattleLifecycleMessage(messageLower: string): boolean {
  const trimmed = messageLower.trim();
  return (
    trimmed === "showdown complete." ||
    trimmed === "showdown complete" ||
    trimmed === "hand won by fold." ||
    trimmed === "hand won by fold" ||
    messageLower.includes("pot settled:") ||
    messageLower.includes("stacks updated:")
  );
}

function isAgentBattlePrimaryWinnerEntry(entry: ActionLogDisplayEntry): boolean {
  const messageLower = entry.displayText.toLowerCase();
  if (isAgentBattleLifecycleMessage(messageLower)) return false;
  return (
    /\bwins\s+—\s+/i.test(entry.displayText) ||
    (/\bwins\b/i.test(entry.displayText) && messageLower.includes("showdown:"))
  );
}

function parseWinnerChipDeltaFromStacksMessage(
  message: string,
  winnerName: string,
): string | undefined {
  const escaped = winnerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = message.match(
    new RegExp(`${escaped}\\s*([+-]\\d[\\d,]*)`, "i"),
  );
  if (!match) return undefined;
  const delta = Number.parseInt(match[1].replace(/,/g, ""), 10);
  if (!Number.isFinite(delta) || delta === 0) return undefined;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toLocaleString()} chips`;
}

function demoteToCompactLogRow(
  entry: ActionLogDisplayEntry,
): ActionLogDisplayEntry {
  return {
    ...entry,
    isShowdownBlock: false,
    isBattleResultCard: false,
    actionType: entry.actionType === "WINNER" ? "INFO" : entry.actionType,
  };
}

/**
 * Agent Battle spectator logs emit several winner-shaped system lines per hand.
 * Keep one premium Battle Result card and demote lifecycle lines to compact rows.
 */
export function consolidateAgentBattleActionLog(
  entries: ActionLogDisplayEntry[],
): ActionLogDisplayEntry[] {
  if (entries.length === 0) return entries;

  let primaryIndex = -1;
  let potFromSettled: number | undefined;
  let chipDeltaLabel: string | undefined;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const messageLower = entry.displayText.toLowerCase();

    if (messageLower.includes("pot settled:")) {
      potFromSettled = entry.potWon ?? parsePotFromMessage(entry.displayText);
    }

    if (messageLower.includes("stacks updated:") && entry.winnerName) {
      chipDeltaLabel = parseWinnerChipDeltaFromStacksMessage(
        entry.displayText,
        entry.winnerName,
      );
    }

    if (primaryIndex < 0 && isAgentBattlePrimaryWinnerEntry(entry)) {
      primaryIndex = i;
    }
  }

  if (primaryIndex < 0) {
    for (let i = 0; i < entries.length; i += 1) {
      if (entries[i].displayText.toLowerCase().includes("pot settled:")) {
        primaryIndex = i;
        break;
      }
    }
  }

  const winnerName =
    primaryIndex >= 0 ? entries[primaryIndex].winnerName : undefined;

  if (primaryIndex >= 0 && winnerName && !chipDeltaLabel) {
    for (const entry of entries) {
      if (entry.displayText.toLowerCase().includes("stacks updated:")) {
        chipDeltaLabel = parseWinnerChipDeltaFromStacksMessage(
          entry.displayText,
          winnerName,
        );
        if (chipDeltaLabel) break;
      }
    }
  }

  return entries.map((entry, index) => {
    const messageLower = entry.displayText.toLowerCase();

    if (isAgentBattleLifecycleMessage(messageLower)) {
      return demoteToCompactLogRow(entry);
    }

    if (index === primaryIndex) {
      const winningHand =
        entry.winningHand ??
        (messageLower.includes("win by fold") ? "Win by fold" : undefined);
      const potWon = entry.potWon ?? potFromSettled ?? entry.pot;
      return {
        ...entry,
        isShowdownBlock: true,
        isBattleResultCard: true,
        actionType: "WINNER",
        phase: "RESULT",
        winningHand,
        potWon,
        chipDeltaLabel,
        resultType: winningHand ?? entry.resultType ?? "Showdown",
      };
    }

    if (entry.isShowdownBlock) {
      return demoteToCompactLogRow(entry);
    }

    return entry;
  });
}

export function countAgentBattleResultCards(
  entries: ActionLogDisplayEntry[],
): number {
  return entries.filter((entry) => entry.isBattleResultCard).length;
}

export function filterActionLogByStreet(
  entries: ActionLogDisplayEntry[],
  filter: StreetFilter,
): ActionLogDisplayEntry[] {
  if (filter === "ALL") return entries;
  if (filter === "SHOWDOWN") {
    return entries.filter(
      (entry) => entry.phase === "SHOWDOWN" || entry.phase === "RESULT",
    );
  }
  return entries.filter((entry) => entry.phase === filter);
}

export function actionTypeBadgeClass(actionType: LogActionType): string {
  switch (actionType) {
    case "RAISE":
      return "border-amber-400/45 bg-amber-950/60 text-amber-200";
    case "CALL":
      return "border-cyan-400/40 bg-cyan-950/50 text-cyan-200";
    case "CHECK":
      return "border-white/20 bg-white/5 text-white/70";
    case "FOLD":
      return "border-red-400/40 bg-red-950/50 text-red-200";
    case "ALL_IN":
      return "border-rose-400/45 bg-rose-950/55 text-rose-200";
    case "DEAL":
      return "border-emerald-400/40 bg-emerald-950/50 text-emerald-200";
    case "WINNER":
      return "border-casino-gold/50 bg-casino-gold/15 text-casino-goldLight";
    case "RESET":
      return "border-white/15 bg-white/5 text-white/45";
    case "INFO":
    default:
      return "border-white/10 bg-black/30 text-white/40";
  }
}

export const STREET_FILTER_OPTIONS: { id: StreetFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "PREFLOP", label: "Preflop" },
  { id: "FLOP", label: "Flop" },
  { id: "TURN", label: "Turn" },
  { id: "RIVER", label: "River" },
  { id: "SHOWDOWN", label: "Showdown" },
];
