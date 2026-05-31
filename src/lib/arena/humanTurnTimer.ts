import type { StepDemoHumanActions } from "@/lib/arena/stepDemo";

export const HUMAN_TURN_TIMER_SECONDS = 15;

export type HumanTurnTimeoutAction = "check" | "fold";

export function resolveHumanTurnTimeoutAction(
  actions: StepDemoHumanActions,
): HumanTurnTimeoutAction {
  if (actions.canCheck) return "check";
  if (actions.canCall) return "fold";
  return "fold";
}

export function formatHumanTurnTimerSeconds(seconds: number): string {
  return `${String(Math.max(0, seconds)).padStart(2, "0")}s`;
}
