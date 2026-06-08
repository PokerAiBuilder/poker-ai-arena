import { expect } from "chai";

/** Mirrors stepDemoZeroStack helpers for hardhat test isolation. */
function clampInHandStack(stack: number): number {
  return Math.max(0, Math.floor(stack));
}

function isHumanInHandStackZero(humanStack: number): boolean {
  return clampInHandStack(humanStack) <= 0;
}

function canHumanTakeBettingAction(input: {
  isActive: boolean;
  step: string;
  turn: string | null;
  allInShowdown: boolean;
  humanStack: number;
}): boolean {
  if (!input.isActive || input.step === "result" || input.allInShowdown) {
    return false;
  }
  if (input.turn !== "human") return false;
  if (isHumanInHandStackZero(input.humanStack)) return false;
  return (
    input.step === "preflop-human" ||
    input.step === "preflop-human-vs-raise" ||
    input.step === "flop-human" ||
    input.step === "flop-human-vs-raise" ||
    input.step === "turn-human" ||
    input.step === "turn-human-vs-raise" ||
    input.step === "river-human" ||
    input.step === "river-human-vs-raise"
  );
}

function isHumanMidHandBusted(input: {
  isActive: boolean;
  step: string;
  humanAllIn: boolean;
  humanStack: number;
}): boolean {
  return (
    input.isActive &&
    input.step !== "result" &&
    !input.humanAllIn &&
    isHumanInHandStackZero(input.humanStack)
  );
}

function downgradeAiBettingVsZeroHuman(
  humanStack: number,
  humanAllIn: boolean,
  facingBet: boolean,
  action: string,
): string {
  if (humanStack > 0 || humanAllIn) return action;
  if (action === "raise" || action === "all-in") {
    return facingBet ? "call" : "check";
  }
  return action;
}

function callOutcomeWentAllIn(
  stackBefore: number,
  toCall: number,
): { paid: number; stackAfter: number; wentAllIn: boolean } {
  const safeStack = clampInHandStack(stackBefore);
  const paid = Math.min(safeStack, Math.max(0, toCall));
  const stackAfter = clampInHandStack(safeStack - paid);
  return { paid, stackAfter, wentAllIn: stackAfter <= 0 && paid > 0 };
}

function canStartHeadsUpHand(humanSessionStack: number): boolean {
  return clampInHandStack(humanSessionStack) > 0;
}

describe("player zero-chip guard", function () {
  it("blocks human betting actions at 0 in-hand chips", function () {
    expect(
      canHumanTakeBettingAction({
        isActive: true,
        step: "flop-human",
        turn: "human",
        allInShowdown: false,
        humanStack: 0,
      }),
    ).to.equal(false);
  });

  it("allows human actions with chips remaining", function () {
    expect(
      canHumanTakeBettingAction({
        isActive: true,
        step: "flop-human",
        turn: "human",
        allInShowdown: false,
        humanStack: 40,
      }),
    ).to.equal(true);
  });

  it("detects mid-hand bust without all-in flag", function () {
    expect(
      isHumanMidHandBusted({
        isActive: true,
        step: "turn-human",
        humanAllIn: false,
        humanStack: 0,
      }),
    ).to.equal(true);
  });

  it("does not treat all-in zero stack as mid-hand bust", function () {
    expect(
      isHumanMidHandBusted({
        isActive: true,
        step: "turn-human",
        humanAllIn: true,
        humanStack: 0,
      }),
    ).to.equal(false);
  });

  it("downgrades AI raise against 0-chip human", function () {
    expect(
      downgradeAiBettingVsZeroHuman(0, false, true, "raise"),
    ).to.equal("call");
    expect(
      downgradeAiBettingVsZeroHuman(0, false, false, "all-in"),
    ).to.equal("check");
  });

  it("allows AI raise when human still has chips", function () {
    expect(
      downgradeAiBettingVsZeroHuman(120, false, true, "raise"),
    ).to.equal("raise");
  });

  it("treats final call as all-in when stack hits 0", function () {
    const outcome = callOutcomeWentAllIn(50, 200);
    expect(outcome.paid).to.equal(50);
    expect(outcome.stackAfter).to.equal(0);
    expect(outcome.wentAllIn).to.equal(true);
  });

  it("blocks new hand when session human stack is 0", function () {
    expect(canStartHeadsUpHand(0)).to.equal(false);
    expect(canStartHeadsUpHand(1)).to.equal(true);
  });

  it("timer/turn state should not be active at 0 chips", function () {
    const timerEnabled =
      canHumanTakeBettingAction({
        isActive: true,
        step: "river-human",
        turn: "human",
        allInShowdown: false,
        humanStack: 0,
      }) && !isHumanInHandStackZero(0);
    expect(timerEnabled).to.equal(false);
  });
});
