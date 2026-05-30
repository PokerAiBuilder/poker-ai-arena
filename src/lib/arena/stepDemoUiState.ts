import type {
  StepDemoHumanActions,
  StepDemoNextStep,
  StepDemoState,
} from "@/lib/arena/stepDemo";
import {
  getStepDemoHumanActions,
  getStepDemoNextStep,
  isStepDemoBettingInProgress,
} from "@/lib/arena/stepDemo";

export type StepDemoUiActionState =
  | "ready_to_start"
  | "your_turn"
  | "poker_master_thinking"
  | "all_in_pending"
  | "next_step"
  | "runout_ready"
  | "show_result_ready"
  | "hand_complete"
  | "stack_depleted";

export type StepDemoUiControls = {
  state: StepDemoUiActionState;
  banner: string;
  actionHint: string;
  nextStep: StepDemoNextStep | null;
  humanActions: StepDemoHumanActions;
  playEnabled: boolean;
  pokerActionsEnabled: boolean;
  nextStepEnabled: boolean;
  newHandEnabled: boolean;
  resetStacksEnabled: boolean;
  agentBattleEnabled: boolean;
};

const BANNERS: Record<StepDemoUiActionState, string> = {
  ready_to_start: "START HAND",
  your_turn: "YOUR TURN",
  poker_master_thinking: "POKERMASTER THINKING",
  all_in_pending: "ALL-IN",
  next_step: "NEXT STEP",
  runout_ready: "ALL-IN",
  show_result_ready: "ALL-IN",
  hand_complete: "HAND COMPLETE",
  stack_depleted: "STACK DEPLETED",
};

const HINTS: Record<StepDemoUiActionState, string> = {
  ready_to_start: "Start a hand first — tap Play vs PokerMaster.",
  your_turn: "Your turn — choose an action.",
  poker_master_thinking: "PokerMaster is thinking...",
  all_in_pending: "You are all-in — PokerMaster is thinking...",
  next_step: "PokerMaster called — reveal the next street.",
  runout_ready: "All-in called — run out the board.",
  show_result_ready: "Board runout complete — show result.",
  hand_complete: "Hand complete — start a new hand.",
  stack_depleted: "Stack depleted — reset demo stacks to continue.",
};

function isHumanTurn(state: StepDemoState): boolean {
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

export function deriveStepDemoUiState(
  state: StepDemoState,
  options: {
    pokerMasterThinking: boolean;
    headsUpStackDepleted: boolean;
    arenaUnlocked?: boolean;
  },
): StepDemoUiControls {
  const humanActions = getStepDemoHumanActions(state);
  const rawNextStep = getStepDemoNextStep(state);
  const { pokerMasterThinking, headsUpStackDepleted } = options;

  let uiState: StepDemoUiActionState;
  let actionHint = HINTS.ready_to_start;
  let nextStep: StepDemoNextStep | null = null;

  if (headsUpStackDepleted && (!state.isActive || state.step === "result")) {
    uiState = "stack_depleted";
    actionHint = HINTS.stack_depleted;
  } else if (state.isActive && state.step === "result") {
    uiState = "hand_complete";
    actionHint =
      state.humanAllIn && state.winningHandName === "Win by fold"
        ? "PokerMaster folded — you win the pot."
        : HINTS.hand_complete;
  } else if (!state.isActive) {
    uiState = "ready_to_start";
    actionHint = HINTS.ready_to_start;
  } else if (pokerMasterThinking || isAwaitingPokerMaster(state)) {
    uiState =
      state.humanAllIn && !state.allInShowdown
        ? "all_in_pending"
        : "poker_master_thinking";
    actionHint =
      uiState === "all_in_pending"
        ? HINTS.all_in_pending
        : HINTS.poker_master_thinking;
  } else if (isHumanTurn(state)) {
    uiState = "your_turn";
    if (
      state.step === "preflop-human-vs-raise" ||
      state.step === "flop-human-vs-raise" ||
      state.step === "turn-human-vs-raise" ||
      state.step === "river-human-vs-raise"
    ) {
      actionHint = "PokerMaster raised — choose Call, Raise, or Fold.";
    } else {
      actionHint = HINTS.your_turn;
    }
  } else if (state.allInShowdown && state.communityCards.length < 5) {
    uiState = "runout_ready";
    actionHint = HINTS.runout_ready;
    nextStep = rawNextStep?.action === "runout-board" ? rawNextStep : {
      label: "Runout Board",
      action: "runout-board",
    };
  } else if (
    state.allInShowdown &&
    state.communityCards.length >= 5 &&
    state.step === "river-complete"
  ) {
    uiState = "show_result_ready";
    actionHint = HINTS.show_result_ready;
    nextStep = rawNextStep?.action === "show-result" ? rawNextStep : {
      label: "Show Result",
      action: "show-result",
    };
  } else if (rawNextStep?.action === "show-result") {
    uiState = "show_result_ready";
    actionHint =
      state.step === "river-complete"
        ? "River complete — show the result."
        : HINTS.show_result_ready;
    nextStep = rawNextStep;
  } else if (rawNextStep) {
    uiState = "next_step";
    actionHint = HINTS.next_step;
    nextStep = rawNextStep;
  } else {
    uiState = "poker_master_thinking";
    actionHint = HINTS.poker_master_thinking;
  }

  const pokerActionsEnabled = uiState === "your_turn";
  const nextStepEnabled =
    Boolean(nextStep) &&
    (uiState === "next_step" ||
      uiState === "runout_ready" ||
      uiState === "show_result_ready");
  const playEnabled =
    !state.isActive && !headsUpStackDepleted && !pokerMasterThinking;
  const newHandEnabled = uiState === "hand_complete" && !headsUpStackDepleted;
  const resetStacksEnabled = uiState === "stack_depleted";
  const agentBattleEnabled =
    !pokerMasterThinking && (!state.isActive || state.step === "result");

  return {
    state: uiState,
    banner: BANNERS[uiState],
    actionHint,
    nextStep,
    humanActions,
    playEnabled,
    pokerActionsEnabled,
    nextStepEnabled,
    newHandEnabled,
    resetStacksEnabled,
    agentBattleEnabled,
  };
}

export function stepDemoUiBannerPhase(
  uiState: StepDemoUiActionState,
): "start-hand" | "your-turn" | "waiting" | "advance-street" | "hand-complete" | "all-in" {
  switch (uiState) {
    case "ready_to_start":
      return "start-hand";
    case "your_turn":
      return "your-turn";
    case "poker_master_thinking":
    case "all_in_pending":
      return "waiting";
    case "next_step":
      return "advance-street";
    case "runout_ready":
    case "show_result_ready":
      return "all-in";
    case "hand_complete":
    case "stack_depleted":
      return "hand-complete";
  }
}

export function canApplyStepDemoTransition(
  state: StepDemoState,
  ui: StepDemoUiControls,
  action: NonNullable<StepDemoNextStep["action"]>,
): boolean {
  if (!ui.nextStep || ui.nextStep.action !== action || !ui.nextStepEnabled) {
    return false;
  }
  switch (action) {
    case "reveal-flop":
      return state.step === "preflop-complete" && !state.allInShowdown;
    case "reveal-turn":
      return state.step === "flop-complete" && !state.allInShowdown;
    case "reveal-river":
      return state.step === "turn-complete" && !state.allInShowdown;
    case "runout-board":
      return (
        state.allInShowdown &&
        state.communityCards.length < 5 &&
        state.step !== "result"
      );
    case "show-result":
      return state.step === "river-complete";
    default:
      return false;
  }
}
