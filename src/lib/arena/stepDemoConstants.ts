/** Shared Step Demo raise constants — no imports from stepDemo or stepDemoAiDecision. */

export const STEP_DEMO_RAISE = 10;
export const STEP_DEMO_RAISE_MIN = 10;

export const STEP_DEMO_RAISE_SIZES = [10, 25, 50, "pot"] as const;
export type StepDemoRaiseSize = (typeof STEP_DEMO_RAISE_SIZES)[number];
