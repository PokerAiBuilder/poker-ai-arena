import type { StepDemoState } from "@/lib/arena/stepDemo";

export const ZERO_STACK_DISABLED_HINT =
  "No chips left — start a new test stake session.";

export function clampInHandStack(stack: number): number {
  return Math.max(0, Math.floor(stack));
}

export function getHumanInHandStack(state: StepDemoState): number {
  return clampInHandStack(state.players.human.stack);
}

export function isHumanInHandStackZero(state: StepDemoState): boolean {
  return getHumanInHandStack(state) <= 0;
}

/** Active hand, human has no chips, and not in an all-in flow. */
export function isHumanMidHandBusted(state: StepDemoState): boolean {
  return (
    state.isActive &&
    state.step !== "result" &&
    !state.humanAllIn &&
    isHumanInHandStackZero(state)
  );
}

export function canHumanTakeBettingAction(state: StepDemoState): boolean {
  if (!state.isActive || state.step === "result" || state.allInShowdown) {
    return false;
  }
  if (state.turn !== "human") return false;
  if (isHumanInHandStackZero(state)) return false;
  return (
    state.step === "preflop-human" ||
    state.step === "preflop-human-vs-raise" ||
    state.step === "flop-human" ||
    state.step === "flop-human-vs-raise" ||
    state.step === "turn-human" ||
    state.step === "turn-human-vs-raise" ||
    state.step === "river-human" ||
    state.step === "river-human-vs-raise"
  );
}

type AiAction = "fold" | "check" | "call" | "raise" | "all-in";

/** AI must not raise or re-raise into a human who has no chips left. */
export function downgradeAiBettingVsZeroHuman(
  humanStack: number,
  humanAllIn: boolean,
  facingBet: boolean,
  action: AiAction,
): AiAction {
  if (humanStack > 0 || humanAllIn) return action;
  if (action === "raise" || action === "all-in") {
    return facingBet ? "call" : "check";
  }
  return action;
}
