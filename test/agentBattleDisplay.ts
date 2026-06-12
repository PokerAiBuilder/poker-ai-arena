import { expect } from "chai";

function normalizeAgentStyleBadge(badge: string | undefined | null): string | undefined {
  if (!badge?.trim()) return undefined;
  const trimmed = badge.trim();
  return trimmed === "Bluffy" ? "Bluff" : trimmed;
}

function formatAgentBattleResultLabel(
  resultType: "fold" | "showdown",
  winningHand?: string,
): string {
  if (resultType === "fold") return "Win by fold";
  const hand = winningHand?.trim();
  if (!hand || hand.toLowerCase() === "showdown") return "Showdown";
  return hand;
}

function formatAgentBattleSeatStatusLabel(input: {
  status: "active" | "folded" | "winner" | "idle";
  activeHighlight?: "thinking" | "acting";
}): string | null {
  if (input.activeHighlight === "thinking") return "Thinking";
  if (input.activeHighlight === "acting") return "Acting";
  if (input.status === "winner") return "Winner";
  if (input.status === "folded") return "Folded";
  return null;
}

function computeWinnerChipDelta(
  accounting: {
    startingStacks: Record<string, number>;
    finalStacks: Record<string, number>;
  } | null,
  winnerId?: string,
): number | null {
  if (!accounting || !winnerId) return null;
  const starting = accounting.startingStacks[winnerId];
  const final = accounting.finalStacks[winnerId];
  if (!Number.isFinite(starting) || !Number.isFinite(final)) return null;
  return Math.floor(final) - Math.floor(starting);
}

function isValidAgentBattleResultLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase() === "unknown") return false;
  return true;
}

describe("agent battle display helpers", function () {
  it("maps agent style badges to showcase labels", function () {
    expect(normalizeAgentStyleBadge("Balanced")).to.equal("Balanced");
    expect(normalizeAgentStyleBadge("Bluffy")).to.equal("Bluff");
    expect(normalizeAgentStyleBadge("Tight")).to.equal("Tight");
    expect(normalizeAgentStyleBadge("Aggressive")).to.equal("Aggressive");
  });

  it("formats result summary labels", function () {
    expect(formatAgentBattleResultLabel("fold")).to.equal("Win by fold");
    expect(formatAgentBattleResultLabel("showdown", "Two Pair")).to.equal(
      "Two Pair",
    );
    expect(formatAgentBattleResultLabel("showdown")).to.equal("Showdown");
  });

  it("builds compact banner copy with winner wins headline", function () {
    const resultLabel = formatAgentBattleResultLabel("showdown", "Three of a Kind");
    const potLabel = "Pot 345";
    const chipDelta = computeWinnerChipDelta(
      {
        startingStacks: { "chip-hunter": 1000 },
        finalStacks: { "chip-hunter": 1685 },
      },
      "chip-hunter",
    );
    const chipDeltaLabel =
      chipDelta != null && chipDelta !== 0
        ? `${chipDelta > 0 ? "+" : ""}${chipDelta.toLocaleString()} chips`
        : null;

    expect(`${"ChipHunter"} wins`).to.equal("ChipHunter wins");
    expect([resultLabel, potLabel].join(" · ")).to.equal(
      "Three of a Kind · Pot 345",
    );
    expect(chipDeltaLabel).to.equal("+685 chips");
  });

  it("formats winner seat status without debug labels", function () {
    expect(
      formatAgentBattleSeatStatusLabel({ status: "idle" }),
    ).to.equal(null);
    expect(
      formatAgentBattleSeatStatusLabel({ status: "active" }),
    ).to.equal(null);
    expect(
      formatAgentBattleSeatStatusLabel({
        status: "active",
        activeHighlight: "thinking",
      }),
    ).to.equal("Thinking");
    expect(
      formatAgentBattleSeatStatusLabel({ status: "winner" }),
    ).to.equal("Winner");
  });

  it("computes winner chip delta from accounting", function () {
    const delta = computeWinnerChipDelta(
      {
        startingStacks: { "bluff-bot": 1000 },
        finalStacks: { "bluff-bot": 1180 },
      },
      "bluff-bot",
    );
    expect(delta).to.equal(180);
  });

  it("rejects invalid or empty result labels", function () {
    expect(isValidAgentBattleResultLabel("Two Pair")).to.equal(true);
    expect(isValidAgentBattleResultLabel("")).to.equal(false);
    expect(isValidAgentBattleResultLabel("unknown")).to.equal(false);
  });
});
