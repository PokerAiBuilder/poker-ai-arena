import { expect } from "chai";

type Pressure = "small" | "medium" | "large" | "pot" | "all-in";

function isLargePressureSpot(
  ctx: { toCall: number; pot: number; pressure: Pressure },
  aiStack: number,
): boolean {
  if (ctx.pressure === "all-in" || ctx.pressure === "pot") return true;
  if (aiStack > 0 && ctx.toCall >= aiStack * 0.5) return true;
  if (ctx.pot > 0 && ctx.toCall >= ctx.pot * 0.6) return true;
  return ctx.pressure === "large";
}

function guardWeakCall(
  tier: string,
  madeHand: string,
  street: string,
  ctx: { toCall: number; pot: number; pressure: Pressure },
  aiStack: number,
  action: string,
): string {
  if (action !== "call") return action;
  if (!isLargePressureSpot(ctx, aiStack)) return action;
  if (tier === "premium" || tier === "strong") return action;
  if (madeHand === "high_card" || tier === "weak") return "fold";
  if ((street === "turn" || street === "river") && madeHand === "pair") {
    return "fold";
  }
  return action;
}

describe("stepDemo AI large-bet guard", function () {
  it("detects all-in pressure from call vs stack", function () {
    const ctx = { toCall: 500, pot: 400, pressure: "medium" as Pressure };
    expect(isLargePressureSpot(ctx, 800)).to.equal(true);
  });

  it("detects pot pressure from call vs pot", function () {
    const ctx = { toCall: 300, pot: 400, pressure: "medium" as Pressure };
    expect(isLargePressureSpot(ctx, 2000)).to.equal(true);
  });

  it("folds weak turn all-in calls", function () {
    const ctx = { toCall: 900, pot: 500, pressure: "all-in" as Pressure };
    const action = guardWeakCall(
      "weak",
      "high_card",
      "turn",
      ctx,
      900,
      "call",
    );
    expect(action).to.equal("fold");
  });

  it("allows strong made hands to call", function () {
    const ctx = { toCall: 900, pot: 500, pressure: "all-in" as Pressure };
    const action = guardWeakCall(
      "strong",
      "two_pair",
      "river",
      ctx,
      900,
      "call",
    );
    expect(action).to.equal("call");
  });
});
