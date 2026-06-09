import { expect } from "chai";

/** Mirrors preflopRanges helpers for hardhat tests. */
type PreflopCategory = "premium" | "strong" | "playable" | "speculative" | "weak";
type Pressure = "small" | "medium" | "large" | "pot" | "all-in";

function cardValue(rank: string): number {
  const map: Record<string, number> = {
    "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
    T: 10, J: 11, Q: 12, K: 13, A: 14,
  };
  return map[rank] ?? 0;
}

function classifyHole(high: string, low: string, suited: boolean): PreflopCategory {
  const h = cardValue(high);
  const l = cardValue(low);
  const hi = Math.max(h, l);
  const lo = Math.min(h, l);
  const pair = h === l;

  if (pair && hi >= 11) return "premium";
  if (hi === 14 && lo === 13) return "premium";
  if (pair && hi >= 9) return "strong";
  if (hi === 14 && lo === 12) return "strong";
  if (hi === 14 && lo === 11 && suited) return "strong";
  if (hi === 13 && lo === 12 && suited) return "strong";
  if (pair && hi >= 6) return "playable";
  if (suited && hi === 14 && lo >= 10) return "playable";
  if (hi >= 11 && lo >= 10) return "playable";
  if (suited && hi === 14 && lo >= 8) return "playable";
  if (suited && hi >= 9 && lo >= 7 && hi - lo <= 4) return "speculative";
  if (hi >= 10) return "speculative";
  return "weak";
}

function shouldContinuePreflopAllIn(category: PreflopCategory): boolean {
  return category === "premium" || category === "strong";
}

function shouldFoldPreflopTrashToPressure(
  category: PreflopCategory,
  pressure: Pressure,
): boolean {
  if (category === "premium" || category === "strong") return false;
  if (category === "weak") return pressure !== "small";
  if (category === "speculative") {
    return pressure === "pot" || pressure === "all-in" || pressure === "large";
  }
  return pressure === "pot" || pressure === "all-in" || pressure === "large";
}

function isLargePressureSpot(
  ctx: { toCall: number; pot: number; pressure: Pressure },
  aiStack: number,
): boolean {
  if (ctx.pressure === "all-in" || ctx.pressure === "pot") return true;
  if (aiStack > 0 && ctx.toCall >= aiStack * 0.5) return true;
  if (ctx.pot > 0 && ctx.toCall >= ctx.pot * 0.6) return true;
  return ctx.pressure === "large";
}

function guardCall(
  tier: string,
  postflopCategory: string,
  street: string,
  ctx: { toCall: number; pot: number; pressure: Pressure },
  aiStack: number,
  action: string,
): string {
  if (action !== "call") return action;
  if (ctx.pressure === "small") return action;
  if (!isLargePressureSpot(ctx, aiStack)) return action;
  if (tier === "premium" || tier === "strong") return action;
  if (postflopCategory === "two_pair_plus" || postflopCategory === "monster") return action;
  if (postflopCategory === "weak_pair" && (street === "turn" || street === "river")) {
    return "fold";
  }
  if (postflopCategory === "air" || tier === "weak") return "fold";
  return action;
}

function personalityAllInAction(
  agentId: string,
  category: PreflopCategory,
): "call" | "fold" {
  if (shouldContinuePreflopAllIn(category)) return "call";
  if (agentId === "bluff-bot" && category === "playable") return "call";
  if (agentId === "chip-hunter" && category === "playable") return "call";
  if (shouldFoldPreflopTrashToPressure(category, "all-in")) return "fold";
  return "fold";
}

describe("AI decision quality helpers", function () {
  it("classifies premium hands (AA, AKs, AKo)", function () {
    expect(classifyHole("A", "A", false)).to.equal("premium");
    expect(classifyHole("A", "K", true)).to.equal("premium");
    expect(classifyHole("A", "K", false)).to.equal("premium");
    expect(classifyHole("J", "J", false)).to.equal("premium");
  });

  it("classifies strong hands (TT, AQs)", function () {
    expect(classifyHole("T", "T", false)).to.equal("strong");
    expect(classifyHole("9", "9", false)).to.equal("strong");
    expect(classifyHole("A", "Q", true)).to.equal("strong");
    expect(classifyHole("A", "J", true)).to.equal("strong");
  });

  it("premium preflop does not fold to normal raise", function () {
    expect(shouldContinuePreflopAllIn("premium")).to.equal(true);
    expect(shouldFoldPreflopTrashToPressure("premium", "large")).to.equal(false);
    expect(shouldFoldPreflopTrashToPressure("premium", "all-in")).to.equal(false);
  });

  it("trash folds to preflop all-in", function () {
    expect(shouldFoldPreflopTrashToPressure("weak", "all-in")).to.equal(true);
    expect(shouldContinuePreflopAllIn("weak")).to.equal(false);
    expect(classifyHole("7", "2", false)).to.equal("weak");
  });

  it("strong hand can call large pressure", function () {
    expect(shouldContinuePreflopAllIn("strong")).to.equal(true);
    expect(shouldFoldPreflopTrashToPressure("strong", "all-in")).to.equal(false);
    const ctx = { toCall: 400, pot: 300, pressure: "all-in" as Pressure };
    expect(guardCall("strong", "top_pair", "preflop", ctx, 800, "call")).to.equal("call");
  });

  it("weak postflop hand folds to all-in", function () {
    const ctx = { toCall: 900, pot: 500, pressure: "all-in" as Pressure };
    expect(
      guardCall("playable", "weak_pair", "river", ctx, 900, "call"),
    ).to.equal("fold");
    expect(guardCall("weak", "air", "turn", ctx, 900, "call")).to.equal("fold");
  });

  it("small bet does not trigger overfold guard", function () {
    const ctx = { toCall: 50, pot: 400, pressure: "small" as Pressure };
    expect(guardCall("playable", "weak_pair", "turn", ctx, 2000, "call")).to.equal("call");
    expect(isLargePressureSpot(ctx, 2000)).to.equal(false);
  });

  it("personality differences remain on preflop all-in", function () {
    expect(personalityAllInAction("poker-master", "premium")).to.equal("call");
    expect(personalityAllInAction("river-mind", "strong")).to.equal("call");
    expect(personalityAllInAction("river-mind", "weak")).to.equal("fold");
    expect(personalityAllInAction("bluff-bot", "playable")).to.equal("call");
    expect(personalityAllInAction("chip-hunter", "playable")).to.equal("call");
    expect(personalityAllInAction("poker-master", "weak")).to.equal("fold");
  });
});
