import type { StepDemoState, StepDemoStep } from "@/lib/arena/stepDemo";
import { isStepDemoBettingInProgress } from "@/lib/arena/stepDemo";

export type StepDemoAutoDealStreet = "flop" | "turn" | "river";

export type StepDemoAutoFlowPending =
  | StepDemoAutoDealStreet
  | "runout-board"
  | "show-result";

export const AUTO_DEAL_STEP_KEYS: Record<StepDemoAutoDealStreet, string> = {
  flop: "deal-flop",
  turn: "deal-turn",
  river: "deal-river",
};

export const AUTO_FLOW_STEP_KEYS = {
  runoutBoard: "runout-board",
  showResult: "show-result",
} as const;

export const AUTO_DEAL_PENDING_HINTS: Record<StepDemoAutoDealStreet, string> = {
  flop: "Dealing flop...",
  turn: "Dealing turn...",
  river: "Dealing river...",
};

export const AUTO_RUNOUT_PENDING_HINT =
  "All-in called — running out the board...";

export const AUTO_SHOW_PENDING_HINT = "Preparing showdown...";

export const AUTO_SHOW_AFTER_RUNOUT_HINT =
  "Board runout complete — preparing showdown...";

const AUTO_DEAL_COMPLETE_STEP: Record<StepDemoAutoDealStreet, StepDemoStep> = {
  flop: "preflop-complete",
  turn: "flop-complete",
  river: "turn-complete",
};

const RUNOUT_VALID_STEPS: StepDemoStep[] = [
  "preflop-complete",
  "flop-complete",
  "turn-complete",
];

/** UI status for Human vs AI auto-flow (streets / showdown). */
export type StepDemoAutoFlowStatus =
  | "idle"
  | "your_turn"
  | "poker_master_thinking"
  | "auto_dealing_flop"
  | "auto_dealing_turn"
  | "auto_dealing_river"
  | "auto_showdown"
  | "hand_complete"
  | "stack_depleted";

export const STEP_DEMO_AUTO_FLOW_HINTS: Record<StepDemoAutoFlowStatus, string> = {
  idle: "Start a hand first — tap Play vs PokerMaster.",
  your_turn: "Your turn — choose an action.",
  poker_master_thinking: "PokerMaster is thinking...",
  auto_dealing_flop: "Ready to deal flop.",
  auto_dealing_turn: "Ready to deal turn.",
  auto_dealing_river: "Ready to deal river.",
  auto_showdown: "Ready for showdown.",
  hand_complete: "Hand complete — start a new hand.",
  stack_depleted: "Stack depleted — reset demo stacks to continue.",
};

function isHumanBettingTurn(state: StepDemoState): boolean {
  return (
    state.isActive &&
    state.turn === "human" &&
    isStepDemoBettingInProgress(state) &&
    state.step !== "result"
  );
}

function isAwaitingPokerMaster(state: StepDemoState): boolean {
  return (
    state.isActive &&
    state.turn === "poker-master" &&
    state.step !== "result"
  );
}

function autoFlowBlocked(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): boolean {
  const { pokerMasterThinking, headsUpStackDepleted } = options;
  if (!state.isActive || state.step === "result") return true;
  if (headsUpStackDepleted) return true;
  if (pokerMasterThinking || isAwaitingPokerMaster(state)) return true;
  if (isHumanBettingTurn(state)) return true;
  return false;
}

export function deriveStepDemoAutoFlowStatus(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): StepDemoAutoFlowStatus {
  const { pokerMasterThinking, headsUpStackDepleted } = options;

  if (headsUpStackDepleted && (!state.isActive || state.step === "result")) {
    return "stack_depleted";
  }

  if (!state.isActive) {
    return "idle";
  }

  if (state.step === "result") {
    return "hand_complete";
  }

  if (pokerMasterThinking || isAwaitingPokerMaster(state)) {
    return "poker_master_thinking";
  }

  if (isHumanBettingTurn(state)) {
    return "your_turn";
  }

  if (state.allInShowdown && state.communityCards.length < 5) {
    return "idle";
  }

  if (state.step === "river-complete") {
    return "auto_showdown";
  }

  switch (state.step) {
    case "preflop-complete":
      return "auto_dealing_flop";
    case "flop-complete":
      return "auto_dealing_turn";
    case "turn-complete":
      return "auto_dealing_river";
    default:
      return "idle";
  }
}

export function autoDealDelayMs(): number {
  return 800 + Math.random() * 400;
}

export function autoShowdownDelayMs(): number {
  return 1000 + Math.random() * 500;
}

export function resolveAutoRunoutBoard(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): boolean {
  if (autoFlowBlocked(state, options)) return false;
  if (!state.allInShowdown || state.communityCards.length >= 5) return false;
  return RUNOUT_VALID_STEPS.includes(state.step);
}

export function resolveAutoShowResult(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): boolean {
  if (autoFlowBlocked(state, options)) return false;
  return state.step === "river-complete";
}

export function resolveAutoDealStreet(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): StepDemoAutoDealStreet | null {
  if (autoFlowBlocked(state, options)) return null;
  if (state.allInShowdown) return null;

  switch (state.step) {
    case "preflop-complete":
      return state.communityCards.length >= 3 ? null : "flop";
    case "flop-complete":
      return state.communityCards.length >= 4 ? null : "turn";
    case "turn-complete":
      return state.communityCards.length >= 5 ? null : "river";
    default:
      return null;
  }
}

export type ResolvedAutoFlowAction = {
  stepKey: string;
  pending: StepDemoAutoFlowPending;
  delayMs: number;
};

export type AutoFlowDebugSnapshot = {
  step: StepDemoStep;
  autoFlowStatus: StepDemoAutoFlowStatus;
  autoFlowPending: StepDemoAutoFlowPending | null;
  nextAction: ResolvedAutoFlowAction | null;
  blockedReason: string | null;
  scheduledKey: string | null;
};

function explainAutoFlowBlockedReason(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): string {
  const { pokerMasterThinking, headsUpStackDepleted } = options;

  if (!state.isActive) return "hand inactive";
  if (state.step === "result") return "hand complete";
  if (headsUpStackDepleted) return "stack depleted";
  if (pokerMasterThinking) return "PokerMaster thinking (timer)";
  if (isAwaitingPokerMaster(state)) return "awaiting PokerMaster turn";
  if (isHumanBettingTurn(state)) return "human betting turn";

  if (state.allInShowdown && state.communityCards.length < 5) {
    if (!RUNOUT_VALID_STEPS.includes(state.step)) {
      return `all-in runout not valid for step ${state.step}`;
    }
    return "all-in runout should schedule";
  }

  if (state.step === "river-complete") {
    return "show result should schedule";
  }

  switch (state.step) {
    case "preflop-complete":
      return state.communityCards.length >= 3
        ? "flop already dealt"
        : "deal flop should schedule";
    case "flop-complete":
      return state.communityCards.length >= 4
        ? "turn already dealt"
        : "deal turn should schedule";
    case "turn-complete":
      return state.communityCards.length >= 5
        ? "river already dealt"
        : "deal river should schedule";
    default:
      return `no auto action for step ${state.step}`;
  }
}

export function buildAutoFlowDebugSnapshot(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
    autoFlowPending: StepDemoAutoFlowPending | null;
    scheduledKey: string | null;
  },
): AutoFlowDebugSnapshot {
  const autoFlowStatus = deriveStepDemoAutoFlowStatus(state, {
    pokerMasterThinking: options.pokerMasterThinking,
    headsUpStackDepleted: options.headsUpStackDepleted,
  });
  const nextAction = resolveNextAutoFlowAction(state, {
    pokerMasterThinking: options.pokerMasterThinking,
    headsUpStackDepleted: options.headsUpStackDepleted,
  });

  return {
    step: state.step,
    autoFlowStatus,
    autoFlowPending: options.autoFlowPending,
    nextAction,
    blockedReason: nextAction
      ? null
      : explainAutoFlowBlockedReason(state, {
          pokerMasterThinking: options.pokerMasterThinking,
          headsUpStackDepleted: options.headsUpStackDepleted,
        }),
    scheduledKey: options.scheduledKey,
  };
}

/** Next auto-flow action: runout → show result → deal street. */
export function resolveNextAutoFlowAction(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
  },
): ResolvedAutoFlowAction | null {
  if (resolveAutoRunoutBoard(state, options)) {
    return {
      stepKey: AUTO_FLOW_STEP_KEYS.runoutBoard,
      pending: "runout-board",
      delayMs: autoShowdownDelayMs(),
    };
  }

  if (resolveAutoShowResult(state, options)) {
    return {
      stepKey: AUTO_FLOW_STEP_KEYS.showResult,
      pending: "show-result",
      delayMs: autoShowdownDelayMs(),
    };
  }

  const street = resolveAutoDealStreet(state, options);
  if (street) {
    return {
      stepKey: AUTO_DEAL_STEP_KEYS[street],
      pending: street,
      delayMs: autoDealDelayMs(),
    };
  }

  return null;
}

export function canApplyAutoFlowAction(
  state: StepDemoState,
  pending: StepDemoAutoFlowPending,
): boolean {
  if (!state.isActive || state.step === "result") return false;

  switch (pending) {
    case "flop":
      return state.step === "preflop-complete" && !state.allInShowdown;
    case "turn":
      return state.step === "flop-complete" && !state.allInShowdown;
    case "river":
      return state.step === "turn-complete" && !state.allInShowdown;
    case "runout-board":
      return (
        state.allInShowdown &&
        state.communityCards.length < 5 &&
        RUNOUT_VALID_STEPS.includes(state.step)
      );
    case "show-result":
      return state.step === "river-complete";
    default:
      return false;
  }
}

export function getAutoFlowPendingHint(
  pending: StepDemoAutoFlowPending,
  state: StepDemoState,
): string {
  if (pending === "runout-board") {
    return AUTO_RUNOUT_PENDING_HINT;
  }
  if (pending === "show-result") {
    if (state.allInShowdown && state.communityCards.length >= 5) {
      return AUTO_SHOW_AFTER_RUNOUT_HINT;
    }
    return AUTO_SHOW_PENDING_HINT;
  }
  return AUTO_DEAL_PENDING_HINTS[pending];
}

export function completeStepForAutoDealStreet(
  street: StepDemoAutoDealStreet,
): StepDemoStep {
  return AUTO_DEAL_COMPLETE_STEP[street];
}

export function getStepDemoAutoFlowHint(
  status: StepDemoAutoFlowStatus,
): string {
  return STEP_DEMO_AUTO_FLOW_HINTS[status];
}

export type AutoStepTimerController = {
  /** Schedule a one-shot auto step; ignores stale callbacks after hand generation bumps. */
  scheduleAutoStep: (
    callback: () => void,
    delayMs: number,
    stepKey?: string,
  ) => void;
  hasPendingStep: (stepKey: string) => boolean;
  clearAutoStepTimers: () => void;
  /** Invalidate pending auto steps and return the new hand generation id. */
  bumpHandGeneration: () => number;
  getHandGeneration: () => number;
};

export function createAutoStepTimerController(): AutoStepTimerController {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  let handGeneration = 0;

  function clearAutoStepTimers() {
    for (const timerId of timers.values()) {
      clearTimeout(timerId);
    }
    timers.clear();
  }

  function bumpHandGeneration() {
    handGeneration += 1;
    clearAutoStepTimers();
    return handGeneration;
  }

  function scheduleAutoStep(
    callback: () => void,
    delayMs: number,
    stepKey = "default",
  ) {
    const existing = timers.get(stepKey);
    if (existing) {
      clearTimeout(existing);
    }

    const generationAtSchedule = handGeneration;
    const timerId = setTimeout(() => {
      timers.delete(stepKey);
      if (generationAtSchedule !== handGeneration) {
        return;
      }
      callback();
    }, delayMs);

    timers.set(stepKey, timerId);
  }

  function hasPendingStep(stepKey: string): boolean {
    return timers.has(stepKey);
  }

  return {
    scheduleAutoStep,
    hasPendingStep,
    clearAutoStepTimers,
    bumpHandGeneration,
    getHandGeneration: () => handGeneration,
  };
}
