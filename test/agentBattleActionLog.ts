import { expect } from "chai";

/** Mirrors actionLogDisplay consolidation for hardhat tests. */
type LogActionType =
  | "RAISE"
  | "CALL"
  | "CHECK"
  | "FOLD"
  | "ALL_IN"
  | "DEAL"
  | "WINNER"
  | "RESET"
  | "INFO";

type ActionLogDisplayEntry = {
  displayText: string;
  isShowdownBlock: boolean;
  isBattleResultCard?: boolean;
  winnerName?: string;
  winningHand?: string;
  potWon?: number;
  chipDeltaLabel?: string;
  actionType: LogActionType;
};

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

function parsePotFromMessage(message: string): number | undefined {
  const settled = message.match(/Pot settled:.*?(\d[\d,]*)\s*chips/i);
  if (settled) return Number.parseInt(settled[1].replace(/,/g, ""), 10);
  const winsParen = message.match(/wins.*?(\d[\d,]*)\s*chips/i);
  if (winsParen) return Number.parseInt(winsParen[1].replace(/,/g, ""), 10);
  return undefined;
}

function parseWinningHand(message: string): string | undefined {
  const showdown = message.match(/Showdown:\s*([^(\d]+?)(?:\s*\(|$)/i);
  if (showdown) return showdown[1].trim();
  if (message.toLowerCase().includes("win by fold")) return "Win by fold";
  return undefined;
}

function parseWinnerName(message: string): string | undefined {
  const settled = message.match(/Pot settled:\s*([^—]+?)\s+wins/i);
  if (settled) return settled[1].trim();
  const wins = message.match(/^([^—]+?)\s+wins/i);
  if (wins) return wins[1].trim();
  return undefined;
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

function isAgentBattlePrimaryWinnerEntry(entry: ActionLogDisplayEntry): boolean {
  const messageLower = entry.displayText.toLowerCase();
  if (isAgentBattleLifecycleMessage(messageLower)) return false;
  return (
    /\bwins\s+—\s+/i.test(entry.displayText) ||
    (/\bwins\b/i.test(entry.displayText) && messageLower.includes("showdown:"))
  );
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

function consolidateAgentBattleActionLog(
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
        parseWinningHand(entry.displayText) ??
        (messageLower.includes("win by fold") ? "Win by fold" : undefined);
      const potWon = entry.potWon ?? potFromSettled ?? undefined;
      return {
        ...entry,
        isShowdownBlock: true,
        isBattleResultCard: true,
        actionType: "WINNER",
        winningHand,
        potWon,
        chipDeltaLabel,
      };
    }

    if (entry.isShowdownBlock) {
      return demoteToCompactLogRow(entry);
    }

    return entry;
  });
}

function countAgentBattleResultCards(entries: ActionLogDisplayEntry[]): number {
  return entries.filter((entry) => entry.isBattleResultCard).length;
}

function normalizeForTest(
  message: string,
  options: {
    isShowdownBlock?: boolean;
    winnerName?: string;
    winningHand?: string;
    potWon?: number;
    actionType?: LogActionType;
  } = {},
): ActionLogDisplayEntry {
  return {
    displayText: message,
    isShowdownBlock: options.isShowdownBlock ?? true,
    winnerName: options.winnerName ?? parseWinnerName(message),
    winningHand: options.winningHand ?? parseWinningHand(message),
    potWon: options.potWon ?? parsePotFromMessage(message),
    actionType: options.actionType ?? "WINNER",
  };
}

describe("agent battle action log consolidation", function () {
  it("keeps one Battle Result card for a completed showdown hand", function () {
    const entries: ActionLogDisplayEntry[] = [
      normalizeForTest("Showdown complete."),
      normalizeForTest(
        "ChipHunter wins — Showdown: Three of a Kind (345 chips).",
        { winnerName: "ChipHunter", winningHand: "Three of a Kind", potWon: 345 },
      ),
      normalizeForTest("Pot settled: ChipHunter wins 345 chips.", {
        winnerName: "ChipHunter",
        potWon: 345,
      }),
      normalizeForTest("Stacks updated: ChipHunter +685, BluffBot -685."),
    ];

    const consolidated = consolidateAgentBattleActionLog(entries);

    expect(countAgentBattleResultCards(consolidated)).to.equal(1);

    const battleResult = consolidated.find((entry) => entry.isBattleResultCard);
    expect(battleResult?.winnerName).to.equal("ChipHunter");
    expect(battleResult?.winningHand).to.equal("Three of a Kind");
    expect(battleResult?.potWon).to.equal(345);
    expect(battleResult?.chipDeltaLabel).to.equal("+685 chips");

    const lifecycle = consolidated.filter((entry) =>
      [
        "Showdown complete.",
        "Pot settled: ChipHunter wins 345 chips.",
        "Stacks updated: ChipHunter +685, BluffBot -685.",
      ].includes(entry.displayText),
    );
    expect(lifecycle.every((entry) => !entry.isShowdownBlock)).to.equal(true);
    expect(lifecycle.every((entry) => !entry.isBattleResultCard)).to.equal(
      true,
    );
  });

  it("demotes fold lifecycle lines and keeps one Battle Result card", function () {
    const entries: ActionLogDisplayEntry[] = [
      normalizeForTest("Hand won by fold."),
      normalizeForTest("BluffBot wins — Win by fold (120 chips).", {
        winnerName: "BluffBot",
        winningHand: "Win by fold",
        potWon: 120,
      }),
      normalizeForTest("Pot settled: BluffBot wins 120 chips.", {
        winnerName: "BluffBot",
        potWon: 120,
      }),
    ];

    const consolidated = consolidateAgentBattleActionLog(entries);

    expect(countAgentBattleResultCards(consolidated)).to.equal(1);
    const battleResult = consolidated.find((entry) => entry.isBattleResultCard);
    expect(battleResult?.winnerName).to.equal("BluffBot");
    expect(battleResult?.winningHand).to.equal("Win by fold");
    expect(battleResult?.potWon).to.equal(120);
  });
});
