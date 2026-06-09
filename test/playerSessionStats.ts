import { expect } from "chai";

/** Mirrors playerSessionStats helpers for hardhat tests. */
function computeNetChips(currentChips: number, startingChips: number): number {
  const current = Number.isFinite(currentChips) ? Math.floor(currentChips) : 0;
  const starting = Number.isFinite(startingChips) ? Math.floor(startingChips) : 0;
  return current - starting;
}

function computeWinRate(wins: number, handsPlayed: number): number {
  if (!Number.isFinite(handsPlayed) || handsPlayed <= 0) return 0;
  const safeWins = Math.max(0, Math.floor(wins));
  return Math.round((safeWins / handsPlayed) * 1000) / 10;
}

function formatChipDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return "±0";
  return delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
}

function formatHandHistoryMetaLine(input: {
  potWon: number;
  humanChipChange?: number;
  humanFinalChips?: number;
  settlementLabel?: string;
}): string {
  const parts: string[] = [`Pot ${input.potWon.toLocaleString()}`];
  if (input.humanChipChange != null) {
    parts.push(`You ${formatChipDelta(input.humanChipChange)}`);
  }
  if (input.humanFinalChips != null) {
    parts.push(`Stack ${input.humanFinalChips.toLocaleString()}`);
  }
  if (input.settlementLabel) parts.push(input.settlementLabel);
  return parts.join(" · ");
}

describe("player session stats helpers", function () {
  it("computes net chips from current and starting stacks", function () {
    expect(computeNetChips(320, 250)).to.equal(70);
    expect(computeNetChips(180, 250)).to.equal(-70);
    expect(computeNetChips(250, 250)).to.equal(0);
  });

  it("computes win rate with zero-safe guard", function () {
    expect(computeWinRate(0, 0)).to.equal(0);
    expect(computeWinRate(3, 10)).to.equal(30);
    expect(computeWinRate(7, 10)).to.equal(70);
  });

  it("formats history meta line with pot, chip change, and stack", function () {
    const line = formatHandHistoryMetaLine({
      potWon: 180,
      humanChipChange: 90,
      humanFinalChips: 340,
      settlementLabel: "Testnet session",
    });
    expect(line).to.include("Pot 180");
    expect(line).to.include("You +90");
    expect(line).to.include("Stack 340");
    expect(line).to.include("Testnet session");
  });

  it("formats neutral chip delta", function () {
    expect(formatChipDelta(0)).to.equal("±0");
    expect(formatChipDelta(-45)).to.equal("-45");
  });

  it("rejects invalid win rate inputs", function () {
    expect(computeWinRate(2, -1)).to.equal(0);
    expect(computeNetChips(Number.NaN, 100)).to.equal(-100);
  });
});
