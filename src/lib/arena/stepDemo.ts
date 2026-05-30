import { PokerMaster } from "@/lib/agents/pokerMaster";
import { getStepDemoPokerMasterDecision } from "@/lib/arena/stepDemoAiDecision";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import type { TableSeat } from "@/components/arena/PokerTable";
import type { AgentStatus } from "@/components/arena/AgentAvatar";
import type { SessionStacksState } from "@/lib/analytics/sessionStacks";
import {
  DEFAULT_BIG_BLIND,
  DEFAULT_SMALL_BLIND,
  DEFAULT_STARTING_STACK,
} from "@/lib/poker/betting";
import { createDeck, dealCards, shuffleDeck } from "@/lib/poker/deck";
import { compareEvaluatedHands, evaluateBestHand } from "@/lib/poker/evaluator";
import type {
  Card,
  GameAction,
  GameStage,
  SimulationAgentDecision,
} from "@/lib/poker/types";
import {
  STEP_DEMO_RAISE,
  STEP_DEMO_RAISE_MIN,
  STEP_DEMO_RAISE_SIZES,
  type StepDemoRaiseSize,
} from "@/lib/arena/stepDemoConstants";

export {
  STEP_DEMO_RAISE,
  STEP_DEMO_RAISE_MIN,
  STEP_DEMO_RAISE_SIZES,
  type StepDemoRaiseSize,
} from "@/lib/arena/stepDemoConstants";

export type StepDemoRaiseOption = {
  size: StepDemoRaiseSize;
  label: string;
  increment: number;
  enabled: boolean;
  cappedToStack?: boolean;
};

export type StepDemoStep =
  | "idle"
  | "preflop-human"
  | "preflop-human-vs-raise"
  | "preflop-complete"
  | "flop-human"
  | "flop-human-vs-raise"
  | "flop-complete"
  | "turn-human"
  | "turn-human-vs-raise"
  | "turn-complete"
  | "river-human"
  | "river-human-vs-raise"
  | "river-complete"
  | "result";

export type StepDemoStreet = "preflop" | "flop" | "turn" | "river";

export type StepDemoPlayerState = {
  id: string;
  name: string;
  holeCards: Card[];
  stack: number;
  hasFolded: boolean;
};

export type StepDemoState = {
  isActive: boolean;
  step: StepDemoStep;
  street: StepDemoStreet;
  turn: "human" | "poker-master" | null;
  deck: Card[];
  communityCards: Card[];
  players: {
    human: StepDemoPlayerState;
    pokerMaster: StepDemoPlayerState;
  };
  actionLog: GameAction[];
  aiDecision: SimulationAgentDecision | null;
  winner: { id: string; name: string } | null;
  winningHandName: string | null;
  pot: number;
  lastPotWon: number;
  currentBet: number;
  humanStreetBet: number;
  aiStreetBet: number;
  aiRaisedThisStreet: boolean;
  /** Human already re-raised once after an AI raise this street. */
  humanReRaisedAfterAiRaise: boolean;
  /** Increment of the human's most recent raise/bet this street (for AI tuning). */
  lastHumanRaiseIncrement: number;
  /** Human committed entire remaining stack this hand. */
  humanAllIn: boolean;
  /** Both players all-in — betting locked, runout/showdown flow. */
  allInShowdown: boolean;
  startStacks: { human: number; pokerMaster: number };
  revealAiCards: boolean;
};

export type StepDemoHumanActions = {
  canFold: boolean;
  canCall: boolean;
  callAmount: number;
  canCheck: boolean;
  canRaise: boolean;
  canAllIn: boolean;
  allInAmount: number;
  raiseAmount: number;
  raiseOptions: StepDemoRaiseOption[];
  disabledHint: string;
};

export const STEP_DEMO_LABELS: Record<StepDemoStep, string> = {
  idle: "Ready to play",
  "preflop-human": "Your turn — preflop",
  "preflop-human-vs-raise": "Respond to PokerMaster's raise",
  "preflop-complete": "Preflop complete — reveal the flop",
  "flop-human": "Your turn — flop",
  "flop-human-vs-raise": "Respond to PokerMaster's raise",
  "flop-complete": "Flop complete — reveal the turn",
  "turn-human": "Your turn — turn",
  "turn-human-vs-raise": "Respond to PokerMaster's raise",
  "turn-complete": "Turn complete — reveal the river",
  "river-human": "Your turn — river",
  "river-human-vs-raise": "Respond to PokerMaster's raise",
  "river-complete": "River complete — show result",
  result: "Hand complete",
};

export type StepDemoGameplayPhase =
  | "start-hand"
  | "your-turn"
  | "waiting"
  | "advance-street"
  | "hand-complete"
  | "all-in";

/** Deferred PokerMaster response — resolved by ArenaShell after thinking delay. */
export type StepDemoPendingAi =
  | "street-response"
  | "after-re-raise"
  | "all-in-response";

export type StepDemoHumanActionOutcome = {
  state: StepDemoState;
  pendingAi: StepDemoPendingAi | null;
};

export type StepDemoNextStepAction =
  | "reveal-flop"
  | "reveal-turn"
  | "reveal-river"
  | "runout-board"
  | "show-result";

export type StepDemoNextStep = {
  label: string;
  action: StepDemoNextStepAction;
};

export type StepDemoGameplayGuidance = {
  phase: StepDemoGameplayPhase | null;
  banner: string;
  actionHint: string;
  nextStep?: StepDemoNextStep;
};

export function createInitialStepDemoState(): StepDemoState {
  return {
    isActive: false,
    step: "idle",
    street: "preflop",
    turn: null,
    deck: [],
    communityCards: [],
    players: {
      human: {
        id: "human",
        name: "You",
        holeCards: [],
        stack: DEFAULT_STARTING_STACK,
        hasFolded: false,
      },
      pokerMaster: {
        id: PokerMaster.id,
        name: PokerMaster.name,
        holeCards: [],
        stack: DEFAULT_STARTING_STACK,
        hasFolded: false,
      },
    },
    actionLog: [],
    aiDecision: null,
    winner: null,
    winningHandName: null,
    pot: 0,
    lastPotWon: 0,
    currentBet: 0,
    humanStreetBet: 0,
    aiStreetBet: 0,
    aiRaisedThisStreet: false,
    humanReRaisedAfterAiRaise: false,
    lastHumanRaiseIncrement: 0,
    humanAllIn: false,
    allInShowdown: false,
    startStacks: { human: DEFAULT_STARTING_STACK, pokerMaster: DEFAULT_STARTING_STACK },
    revealAiCards: false,
  };
}

function isHumanFacingAiRaiseStep(step: StepDemoStep): boolean {
  return (
    step === "preflop-human-vs-raise" ||
    step === "flop-human-vs-raise" ||
    step === "turn-human-vs-raise" ||
    step === "river-human-vs-raise"
  );
}

function isHumanActionStep(step: StepDemoStep): boolean {
  return (
    step === "preflop-human" ||
    step === "preflop-human-vs-raise" ||
    step === "flop-human" ||
    step === "flop-human-vs-raise" ||
    step === "turn-human" ||
    step === "turn-human-vs-raise" ||
    step === "river-human" ||
    step === "river-human-vs-raise"
  );
}

export function isStepDemoBettingInProgress(state: StepDemoState): boolean {
  return isHumanActionStep(state.step);
}

function humanVsRaiseStep(street: StepDemoStreet): StepDemoStep {
  switch (street) {
    case "preflop":
      return "preflop-human-vs-raise";
    case "flop":
      return "flop-human-vs-raise";
    case "turn":
      return "turn-human-vs-raise";
    case "river":
      return "river-human-vs-raise";
  }
}

function streetCompleteStep(street: StepDemoStreet): StepDemoStep {
  switch (street) {
    case "preflop":
      return "preflop-complete";
    case "flop":
      return "flop-complete";
    case "turn":
      return "turn-complete";
    case "river":
      return "river-complete";
  }
}

function streetCompleteMessage(street: StepDemoStreet): string {
  switch (street) {
    case "preflop":
    case "flop":
    case "turn":
      return "PokerMaster called — reveal the next street.";
    case "river":
      return "River complete — show the result.";
  }
}

function humanBettingStep(street: StepDemoStreet): StepDemoStep {
  switch (street) {
    case "preflop":
      return "preflop-human";
    case "flop":
      return "flop-human";
    case "turn":
      return "turn-human";
    case "river":
      return "river-human";
  }
}

export function isStepDemoFacingAiRaise(state: StepDemoState): boolean {
  return isHumanFacingAiRaiseStep(state.step);
}

function isShowdownResult(state: StepDemoState): boolean {
  return (
    state.step === "result" &&
    state.winningHandName != null &&
    state.winningHandName !== "Win by fold"
  );
}

function completeStreet(state: StepDemoState): StepDemoState {
  return {
    ...state,
    step: streetCompleteStep(state.street),
    turn: null,
    humanReRaisedAfterAiRaise: false,
    lastHumanRaiseIncrement: 0,
    actionLog: [
      ...state.actionLog,
      systemLog(streetCompleteMessage(state.street), gameStage(state)),
    ],
  };
}

function revealCommunityStreet(
  state: StepDemoState,
  street: "flop" | "turn" | "river",
  newCards: Card[],
  remainingDeck: Card[],
  logMessage: string,
): StepDemoState {
  const communityCards =
    street === "flop" ? newCards : [...state.communityCards, ...newCards];

  return {
    ...state,
    step: humanBettingStep(street),
    street,
    turn: "human",
    deck: remainingDeck,
    communityCards,
    currentBet: 0,
    humanStreetBet: 0,
    aiStreetBet: 0,
    aiRaisedThisStreet: false,
    humanReRaisedAfterAiRaise: false,
    lastHumanRaiseIncrement: 0,
    aiDecision: null,
    actionLog: [...state.actionLog, systemLog(logMessage, street)],
  };
}

function dealBurnAndDraw(deck: Card[], count: number): { dealt: Card[]; remaining: Card[] } {
  const burn = dealCards(deck, 1);
  return dealCards(burn.remaining, count);
}

function systemLog(message: string, stage: GameStage = "preflop"): GameAction {
  return {
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage,
    message,
    timestamp: Date.now(),
  };
}

function playerLog(
  playerId: string,
  playerName: string,
  action: GameAction["action"],
  message: string,
  stage: GameStage,
): GameAction {
  return {
    playerId,
    playerName,
    action,
    stage,
    message,
    timestamp: Date.now(),
  };
}

function formatPokerMasterActionMessage(
  decision: AgentDecision,
  chipsPaid?: number,
): string {
  switch (decision.action) {
    case "fold":
      return "PokerMaster folds";
    case "check":
      return "PokerMaster checks";
    case "call": {
      const amount = chipsPaid ?? decision.amount;
      return amount != null && amount > 0
        ? `PokerMaster calls ${amount} chips`
        : "PokerMaster calls";
    }
    case "raise":
    case "all-in":
      return `PokerMaster raises +${decision.amount ?? STEP_DEMO_RAISE}`;
    default:
      return `PokerMaster ${decision.action}`;
  }
}

function awaitingAiResponse(state: StepDemoState): StepDemoState {
  return {
    ...state,
    turn: "poker-master",
    aiDecision: null,
  };
}

function buildSafeFallbackDecision(
  state: StepDemoState,
): AgentDecision {
  const toCall = aiAmountToCall(state);
  const aiStack = clampStack(state.players.pokerMaster.stack);

  if (toCall === 0) {
    return {
      action: "check",
      reasoning: "safe fallback — checking",
      confidence: 0.5,
    };
  }
  if (aiStack > 0) {
    return {
      action: "call",
      amount: Math.min(toCall, aiStack),
      reasoning: "safe fallback — calling",
      confidence: 0.5,
    };
  }
  return {
    action: "fold",
    reasoning: "safe fallback — folding",
    confidence: 0.5,
  };
}

export function resolveStepDemoPendingAiWithFallback(
  state: StepDemoState,
  pending: StepDemoPendingAi,
): StepDemoState {
  const base: StepDemoState = {
    ...state,
    actionLog: [
      ...state.actionLog,
      systemLog(
        "PokerMaster took too long — safe fallback applied.",
        gameStage(state),
      ),
    ],
  };
  const decision = buildSafeFallbackDecision(state);
  switch (pending) {
    case "street-response":
      return runAiStreetResponse(base, decision);
    case "after-re-raise":
      return runAiAfterHumanReRaise(base, decision);
    case "all-in-response":
      return runAiResponseToHumanAllIn(base, decision);
  }
}

export function resolveStepDemoPendingAi(
  state: StepDemoState,
  pending: StepDemoPendingAi,
): StepDemoState {
  switch (pending) {
    case "street-response":
      return runAiStreetResponse(state);
    case "after-re-raise":
      return runAiAfterHumanReRaise(state);
    case "all-in-response":
      return runAiResponseToHumanAllIn(state);
  }
}

function toSimulationAgentDecision(
  decision: AgentDecision,
  stage: GameStage,
  stateAfterAction?: StepDemoState,
): SimulationAgentDecision {
  const humanCall =
    stateAfterAction != null ? humanAmountToCall(stateAfterAction) : 0;

  let amount = decision.amount;
  if (decision.action === "raise" || decision.action === "all-in") {
    amount = decision.amount ?? STEP_DEMO_RAISE;
  } else if (decision.action === "call") {
    amount = decision.amount ?? (humanCall > 0 ? humanCall : undefined);
  }

  const reasoning =
    stateAfterAction != null &&
    (decision.action === "raise" || decision.action === "all-in") &&
    humanCall > 0
      ? `${decision.reasoning} You need to call ${humanCall} to continue.`
      : decision.reasoning;

  return {
    agentId: PokerMaster.id,
    agentName: PokerMaster.name,
    strategy: PokerMaster.strategy,
    stage,
    action: decision.action,
    amount,
    confidence: decision.confidence,
    reasoning,
  };
}

function resolveStacks(
  sessionStacks: SessionStacksState,
): { human: number; pokerMaster: number } {
  return {
    human: clampStack(sessionStacks.human ?? DEFAULT_STARTING_STACK),
    pokerMaster: clampStack(
      sessionStacks[PokerMaster.id] ?? DEFAULT_STARTING_STACK,
    ),
  };
}

function clampStack(stack: number): number {
  if (!Number.isFinite(stack)) return 0;
  return Math.max(0, Math.floor(stack));
}

/** Subtract chips from stack; never returns negative stack or over-payment. */
function deductStack(
  stack: number,
  amount: number,
): { stack: number; paid: number } {
  const safeStack = clampStack(stack);
  const requested = Math.max(0, amount);
  const paid = Math.min(requested, safeStack);
  return { stack: clampStack(safeStack - paid), paid };
}

function addToStack(stack: number, amount: number): number {
  return clampStack(clampStack(stack) + Math.max(0, amount));
}

function humanRaisePay(state: StepDemoState, increment: number): number {
  if (increment <= 0) return 0;
  const newBet = targetRaiseBetFromIncrement(state, increment);
  const owed = Math.max(0, newBet - state.humanStreetBet);
  return deductStack(state.players.human.stack, owed).paid;
}

function gameStage(state: StepDemoState): GameStage {
  if (state.street === "preflop") return "preflop";
  if (state.street === "flop") return "flop";
  if (state.street === "turn") return "turn";
  if (state.street === "river") return "river";
  return "showdown";
}

export function humanAmountToCall(state: StepDemoState): number {
  return Math.max(0, state.currentBet - state.humanStreetBet);
}

/** Single source of truth for UI call buttons when the human can act. */
export function getStepDemoHumanCallAmount(state: StepDemoState): number {
  if (!state.isActive || state.turn !== "human") return 0;
  if (!isHumanActionStep(state.step)) return 0;
  return humanAmountToCall(state);
}

function aiAmountToCall(state: StepDemoState): number {
  return Math.max(0, state.currentBet - state.aiStreetBet);
}

const RAISE_OPTION_LABELS: Record<StepDemoRaiseSize, string> = {
  10: "Raise +10",
  25: "+25",
  50: "+50",
  pot: "Pot",
};

function requestedHumanRaiseIncrement(
  state: StepDemoState,
  size: StepDemoRaiseSize,
): number {
  if (size === "pot") {
    return Math.max(STEP_DEMO_RAISE_MIN, state.pot);
  }
  return size;
}

/** Max raise increment the human can afford (not all-in semantics). */
export function maxHumanRaiseIncrement(state: StepDemoState): number {
  const humanStack = clampStack(state.players.human.stack);
  if (humanStack <= 0) return 0;
  const toCall = humanAmountToCall(state);
  if (state.currentBet === 0) {
    return Math.max(0, humanStack + state.humanStreetBet);
  }
  return Math.max(0, humanStack - toCall);
}

export function resolveHumanRaiseIncrement(
  state: StepDemoState,
  size: StepDemoRaiseSize,
): number {
  const requested = requestedHumanRaiseIncrement(state, size);
  const maxInc = maxHumanRaiseIncrement(state);
  return Math.max(0, Math.min(requested, maxInc));
}

function targetRaiseBetFromIncrement(
  state: StepDemoState,
  increment: number,
): number {
  if (increment <= 0) return state.currentBet;
  return state.currentBet === 0 ? increment : state.currentBet + increment;
}

function targetAiRaiseBet(state: StepDemoState): number {
  return targetRaiseBetFromIncrement(state, STEP_DEMO_RAISE);
}

function buildRaiseOptions(state: StepDemoState): StepDemoRaiseOption[] {
  return STEP_DEMO_RAISE_SIZES.map((size) => {
    const requested = requestedHumanRaiseIncrement(state, size);
    const increment = resolveHumanRaiseIncrement(state, size);
    const pay = humanRaisePay(state, increment);
    const enabled =
      increment >= STEP_DEMO_RAISE_MIN &&
      pay >= STEP_DEMO_RAISE_MIN &&
      pay > 0 &&
      clampStack(state.players.human.stack) > 0;
    const cappedToStack = enabled && increment < requested;
    let label = RAISE_OPTION_LABELS[size];
    if (enabled && cappedToStack) {
      label =
        size === "pot"
          ? `Pot (${pay})`
          : size === 10
            ? `Raise +${pay}`
            : `+${pay}`;
    }
    return {
      size,
      label,
      increment,
      enabled,
      cappedToStack,
    };
  });
}

function targetRaiseBet(state: StepDemoState): number {
  return targetAiRaiseBet(state);
}

function finishHandByFold(
  state: StepDemoState,
  winnerSide: "human" | "poker-master",
  logs: GameAction[],
): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const potAwarded = state.pot;

  if (winnerSide === "human") {
    human.stack = addToStack(human.stack, potAwarded);
    ai.hasFolded = true;
  } else {
    ai.stack = addToStack(ai.stack, potAwarded);
    human.hasFolded = true;
  }

  human.stack = clampStack(human.stack);
  ai.stack = clampStack(ai.stack);

  const winner =
    winnerSide === "human"
      ? { id: human.id, name: human.name }
      : { id: ai.id, name: ai.name };

  return {
    ...state,
    step: "result",
    turn: null,
    players: { human, pokerMaster: ai },
    winner,
    winningHandName: "Win by fold",
    pot: 0,
    lastPotWon: potAwarded,
    revealAiCards: false,
    actionLog: [
      ...state.actionLog,
      ...logs,
      systemLog(`${winner.name} wins — Win by fold.`, "showdown"),
    ],
  };
}

export function dealStepDemoHand(sessionStacks: SessionStacksState): StepDemoState {
  const stacks = resolveStacks(sessionStacks);
  let deck = shuffleDeck(createDeck());

  const humanDeal = dealCards(deck, 2);
  deck = humanDeal.remaining;
  const aiDeal = dealCards(deck, 2);
  deck = aiDeal.remaining;

  const humanPrior = clampStack(stacks.human);
  const aiPrior = clampStack(stacks.pokerMaster);
  const humanBlind = deductStack(humanPrior, DEFAULT_SMALL_BLIND);
  const aiBlind = deductStack(aiPrior, DEFAULT_BIG_BLIND);
  const humanStreetBet = humanBlind.paid;
  const aiStreetBet = aiBlind.paid;
  const pot = humanStreetBet + aiStreetBet;
  const currentBet = Math.max(humanStreetBet, aiStreetBet);

  return {
    isActive: true,
    step: "preflop-human",
    street: "preflop",
    turn: "human",
    deck,
    communityCards: [],
    players: {
      human: {
        id: "human",
        name: "You",
        holeCards: humanDeal.dealt,
        stack: humanBlind.stack,
        hasFolded: false,
      },
      pokerMaster: {
        id: PokerMaster.id,
        name: PokerMaster.name,
        holeCards: aiDeal.dealt,
        stack: aiBlind.stack,
        hasFolded: false,
      },
    },
    actionLog: [
      systemLog("New hand dealt."),
      systemLog(
        `Blinds posted — You ${humanStreetBet}, ${PokerMaster.name} ${aiStreetBet}. Pot ${pot}.`,
      ),
    ],
    aiDecision: null,
    winner: null,
    winningHandName: null,
    pot,
    lastPotWon: 0,
    currentBet,
    humanStreetBet,
    aiStreetBet,
    aiRaisedThisStreet: false,
    humanReRaisedAfterAiRaise: false,
    lastHumanRaiseIncrement: 0,
    humanAllIn: false,
    allInShowdown: false,
    startStacks: stacks,
    revealAiCards: false,
  };
}

function settleUncalledAllInBet(state: StepDemoState): StepDemoState {
  const matched = Math.min(state.humanStreetBet, state.aiStreetBet);
  const uncalled = state.humanStreetBet - matched;
  if (uncalled <= 0) return state;

  const human = { ...state.players.human };
  human.stack = addToStack(human.stack, uncalled);

  return {
    ...state,
    players: { ...state.players, human },
    pot: state.pot - uncalled,
    humanStreetBet: matched,
    currentBet: matched,
  };
}

function runAiResponseToHumanAllIn(
  state: StepDemoState,
  forcedDecision?: AgentDecision,
): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const stage = gameStage(state);

  const decision =
    forcedDecision ??
    getStepDemoPokerMasterDecision(state, { humanWentAllIn: true });

  if (decision.action === "fold") {
    const foldDecision = {
      ...decision,
      reasoning: `FOLD to all-in — ${decision.reasoning}`,
    };
    const logs: GameAction[] = [
      playerLog(
        ai.id,
        ai.name,
        "fold",
        "PokerMaster folds",
        stage,
      ),
      systemLog("PokerMaster folded — you win the pot.", stage),
    ];
    return finishHandByFold(
      {
        ...state,
        players: { human, pokerMaster: ai },
        aiDecision: toSimulationAgentDecision(foldDecision, stage, state),
      },
      "human",
      logs,
    );
  }

  const toCall = aiAmountToCall(state);
  const chips = deductStack(ai.stack, toCall);
  ai.stack = chips.stack;
  const aiStreetBet = state.aiStreetBet + chips.paid;
  const currentBet = Math.max(state.currentBet, aiStreetBet);

  const callDecision = {
    action: "call" as const,
    amount: chips.paid,
    confidence: decision.confidence,
    reasoning: `CALL all-in — ${decision.reasoning}`,
  };

  const logs: GameAction[] = [
    playerLog(
      ai.id,
      ai.name,
      "call",
      `PokerMaster calls ${chips.paid} chips`,
      stage,
    ),
  ];

  let nextState: StepDemoState = settleUncalledAllInBet({
    ...state,
    players: { human, pokerMaster: ai },
    pot: state.pot + chips.paid,
    currentBet,
    aiStreetBet,
    humanAllIn: true,
    allInShowdown: true,
    revealAiCards: true,
    aiDecision: toSimulationAgentDecision(callDecision, stage, {
      ...state,
      currentBet,
      aiStreetBet,
    }),
    actionLog: [...state.actionLog, ...logs],
  });

  const boardFull = nextState.communityCards.length >= 5;
  nextState = {
    ...nextState,
    step: boardFull ? "river-complete" : streetCompleteStep(state.street),
    turn: null,
    humanReRaisedAfterAiRaise: false,
    lastHumanRaiseIncrement: 0,
    actionLog: [
      ...nextState.actionLog,
      systemLog(
        boardFull
          ? "All-in showdown."
          : "All-in called — run out the board.",
        stage,
      ),
    ],
  };

  return nextState;
}

export function applyHumanFold(state: StepDemoState): StepDemoState {
  if (state.turn !== "human" || state.step === "result" || state.allInShowdown) {
    return state;
  }

  const human = { ...state.players.human, hasFolded: true };
  const log = playerLog(
    human.id,
    human.name,
    "fold",
    "You fold",
    gameStage(state),
  );

  return finishHandByFold(
    { ...state, players: { human, pokerMaster: state.players.pokerMaster } },
    "poker-master",
    [log],
  );
}

function applyAiDecisionChips(
  state: StepDemoState,
  ai: StepDemoPlayerState,
  decision: AgentDecision,
): {
  ai: StepDemoPlayerState;
  pot: number;
  currentBet: number;
  aiStreetBet: number;
  aiRaisedThisStreet: boolean;
} {
  const amountToCall = aiAmountToCall(state);
  let pot = state.pot;
  let currentBet = state.currentBet;
  let aiStreetBet = state.aiStreetBet;
  let aiRaisedThisStreet = state.aiRaisedThisStreet;
  const nextAi = { ...ai };

  switch (decision.action) {
    case "call": {
      const chips = deductStack(nextAi.stack, amountToCall);
      nextAi.stack = chips.stack;
      aiStreetBet += chips.paid;
      pot += chips.paid;
      break;
    }
    case "raise":
    case "all-in": {
      const newBet = targetRaiseBet(state);
      const owed = Math.max(0, newBet - aiStreetBet);
      const chips = deductStack(nextAi.stack, owed);
      nextAi.stack = chips.stack;
      aiStreetBet += chips.paid;
      pot += chips.paid;
      if (chips.paid > 0) {
        currentBet = aiStreetBet;
        aiRaisedThisStreet = true;
      }
      break;
    }
    default:
      break;
  }

  nextAi.stack = clampStack(nextAi.stack);

  return { ai: nextAi, pot, currentBet, aiStreetBet, aiRaisedThisStreet };
}

function promptHumanVsAiRaise(
  state: StepDemoState,
  base: StepDemoState,
  stage: GameStage,
  decision: AgentDecision,
): StepDemoState {
  return {
    ...base,
    step: humanVsRaiseStep(state.street),
    turn: "human",
    aiDecision: toSimulationAgentDecision(decision, stage, base),
    actionLog: [
      ...base.actionLog,
      systemLog("PokerMaster raised — respond to continue.", stage),
    ],
  };
}

function runAiAfterHumanReRaise(
  state: StepDemoState,
  forcedDecision?: AgentDecision,
): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const stage = gameStage(state);

  const decision =
    forcedDecision ??
    getStepDemoPokerMasterDecision(state, {
      afterHumanReRaise: true,
      aiAlreadyRaised: true,
    });

  const logs: GameAction[] = [
    playerLog(
      ai.id,
      ai.name,
      decision.action,
      formatPokerMasterActionMessage(decision),
      stage,
    ),
  ];

  if (decision.action === "fold") {
    return finishHandByFold(
      {
        ...state,
        players: { human, pokerMaster: ai },
        aiDecision: toSimulationAgentDecision(decision, stage, state),
      },
      "human",
      logs,
    );
  }

  const chips = applyAiDecisionChips(state, ai, decision);

  const afterChips: StepDemoState = {
    ...state,
    players: { human, pokerMaster: chips.ai },
    pot: chips.pot,
    currentBet: chips.currentBet,
    aiStreetBet: chips.aiStreetBet,
    aiRaisedThisStreet: chips.aiRaisedThisStreet,
    actionLog: [...state.actionLog, ...logs],
  };

  return completeStreet({
    ...afterChips,
    aiDecision: toSimulationAgentDecision(decision, stage, afterChips),
  });
}

function runAiStreetResponse(
  state: StepDemoState,
  forcedDecision?: AgentDecision,
): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const stage = gameStage(state);

  const decision =
    forcedDecision ??
    getStepDemoPokerMasterDecision(state, {
      aiAlreadyRaised: state.aiRaisedThisStreet,
    });

  const logs: GameAction[] = [
    playerLog(
      ai.id,
      ai.name,
      decision.action,
      formatPokerMasterActionMessage(decision),
      stage,
    ),
  ];

  if (decision.action === "fold") {
    return finishHandByFold(
      {
        ...state,
        players: { human, pokerMaster: ai },
        aiDecision: toSimulationAgentDecision(decision, stage, state),
      },
      "human",
      logs,
    );
  }

  const isAiRaise =
    decision.action === "raise" || decision.action === "all-in";

  const chips = applyAiDecisionChips(state, ai, decision);

  const base: StepDemoState = {
    ...state,
    players: { human, pokerMaster: chips.ai },
    pot: chips.pot,
    currentBet: chips.currentBet,
    humanStreetBet: state.humanStreetBet,
    aiStreetBet: chips.aiStreetBet,
    aiRaisedThisStreet: chips.aiRaisedThisStreet,
    actionLog: [...state.actionLog, ...logs],
  };

  if (isAiRaise) {
    return promptHumanVsAiRaise(state, base, stage, decision);
  }

  return completeStreet({
    ...base,
    aiDecision: toSimulationAgentDecision(decision, stage, base),
  });
}

export function applyHumanCallWithOutcome(
  state: StepDemoState,
): StepDemoHumanActionOutcome {
  if (state.turn !== "human" || state.allInShowdown) {
    return { state, pendingAi: null };
  }

  const toCall = humanAmountToCall(state);
  if (toCall <= 0) return applyHumanCheckWithOutcome(state);

  const human = { ...state.players.human };
  const chips = deductStack(human.stack, toCall);
  if (chips.paid <= 0) return { state, pendingAi: null };
  human.stack = chips.stack;

  const log = playerLog(
    human.id,
    human.name,
    "call",
    `You call ${chips.paid} chips`,
    gameStage(state),
  );

  const next = {
    ...state,
    players: { human, pokerMaster: state.players.pokerMaster },
    pot: state.pot + chips.paid,
    humanStreetBet: state.humanStreetBet + chips.paid,
    actionLog: [...state.actionLog, log],
  };

  if (isHumanFacingAiRaiseStep(state.step)) {
    return { state: completeStreet(next), pendingAi: null };
  }

  return {
    state: awaitingAiResponse(next),
    pendingAi: "street-response",
  };
}

export function applyHumanCall(state: StepDemoState): StepDemoState {
  const outcome = applyHumanCallWithOutcome(state);
  return outcome.pendingAi
    ? resolveStepDemoPendingAi(outcome.state, outcome.pendingAi)
    : outcome.state;
}

export function applyHumanCheckWithOutcome(
  state: StepDemoState,
): StepDemoHumanActionOutcome {
  if (state.turn !== "human" || state.allInShowdown || humanAmountToCall(state) > 0) {
    return { state, pendingAi: null };
  }

  const log = playerLog(
    state.players.human.id,
    state.players.human.name,
    "check",
    "You check",
    gameStage(state),
  );

  const next = {
    ...state,
    actionLog: [...state.actionLog, log],
  };

  return {
    state: awaitingAiResponse(next),
    pendingAi: "street-response",
  };
}

export function applyHumanCheck(state: StepDemoState): StepDemoState {
  const outcome = applyHumanCheckWithOutcome(state);
  return outcome.pendingAi
    ? resolveStepDemoPendingAi(outcome.state, outcome.pendingAi)
    : outcome.state;
}

export function applyHumanRaiseWithOutcome(
  state: StepDemoState,
  size: StepDemoRaiseSize = 10,
): StepDemoHumanActionOutcome {
  if (state.turn !== "human" || state.allInShowdown) {
    return { state, pendingAi: null };
  }

  if (
    isHumanFacingAiRaiseStep(state.step) &&
    state.humanReRaisedAfterAiRaise
  ) {
    return { state, pendingAi: null };
  }

  const increment = resolveHumanRaiseIncrement(state, size);
  if (increment < STEP_DEMO_RAISE_MIN || clampStack(state.players.human.stack) <= 0) {
    return { state, pendingAi: null };
  }

  const human = { ...state.players.human };
  const pay = humanRaisePay(state, increment);
  if (pay < STEP_DEMO_RAISE_MIN) return { state, pendingAi: null };

  const chips = deductStack(human.stack, pay);
  human.stack = chips.stack;
  const newHumanStreetBet = state.humanStreetBet + chips.paid;
  if (chips.paid <= 0) return { state, pendingAi: null };

  const raiseLabel =
    size === "pot"
      ? `Pot (${pay} chips)`
      : size === 10
        ? `+${increment} chips`
        : `+${increment} chips`;

  const log = playerLog(
    human.id,
    human.name,
    "raise",
    `You raise ${raiseLabel}`,
    gameStage(state),
  );

  const next = {
    ...state,
    players: { human, pokerMaster: state.players.pokerMaster },
    pot: state.pot + chips.paid,
    humanStreetBet: newHumanStreetBet,
    currentBet: newHumanStreetBet,
    lastHumanRaiseIncrement: increment,
    actionLog: [...state.actionLog, log],
  };

  if (isHumanFacingAiRaiseStep(state.step)) {
    return {
      state: awaitingAiResponse({
        ...next,
        humanReRaisedAfterAiRaise: true,
      }),
      pendingAi: "after-re-raise",
    };
  }

  return {
    state: awaitingAiResponse(next),
    pendingAi: "street-response",
  };
}

export function applyHumanRaise(
  state: StepDemoState,
  size: StepDemoRaiseSize = 10,
): StepDemoState {
  const outcome = applyHumanRaiseWithOutcome(state, size);
  return outcome.pendingAi
    ? resolveStepDemoPendingAi(outcome.state, outcome.pendingAi)
    : outcome.state;
}

export function applyHumanAllInWithOutcome(
  state: StepDemoState,
): StepDemoHumanActionOutcome {
  if (state.turn !== "human" || state.step === "result" || state.allInShowdown) {
    return { state, pendingAi: null };
  }

  const humanStack = clampStack(state.players.human.stack);
  if (humanStack <= 0) return { state, pendingAi: null };

  const human = { ...state.players.human };
  const chips = deductStack(human.stack, humanStack);
  human.stack = chips.stack;
  if (chips.paid <= 0) return { state, pendingAi: null };

  const newHumanStreetBet = state.humanStreetBet + chips.paid;
  const increment = chips.paid;

  const log = playerLog(
    human.id,
    human.name,
    "all-in",
    `You go all-in for ${chips.paid} chips`,
    gameStage(state),
  );

  const next: StepDemoState = {
    ...state,
    players: { human, pokerMaster: state.players.pokerMaster },
    pot: state.pot + chips.paid,
    humanStreetBet: newHumanStreetBet,
    currentBet: Math.max(state.currentBet, newHumanStreetBet),
    lastHumanRaiseIncrement: increment,
    humanAllIn: true,
    actionLog: [...state.actionLog, log],
  };

  return {
    state: awaitingAiResponse(next),
    pendingAi: "all-in-response",
  };
}

export function applyHumanAllIn(state: StepDemoState): StepDemoState {
  const outcome = applyHumanAllInWithOutcome(state);
  return outcome.pendingAi
    ? resolveStepDemoPendingAi(outcome.state, outcome.pendingAi)
    : outcome.state;
}

export function advanceStepDemoRevealFlop(state: StepDemoState): StepDemoState {
  if (state.step !== "preflop-complete" || state.allInShowdown) return state;

  const flop = dealBurnAndDraw(state.deck, 3);
  return revealCommunityStreet(
    state,
    "flop",
    flop.dealt,
    flop.remaining,
    "Flop revealed",
  );
}

export function advanceStepDemoRevealTurn(state: StepDemoState): StepDemoState {
  if (state.step !== "flop-complete" || state.allInShowdown) return state;

  const turn = dealBurnAndDraw(state.deck, 1);
  return revealCommunityStreet(
    state,
    "turn",
    turn.dealt,
    turn.remaining,
    "Turn revealed",
  );
}

export function advanceStepDemoRevealRiver(state: StepDemoState): StepDemoState {
  if (state.step !== "turn-complete" || state.allInShowdown) return state;

  const river = dealBurnAndDraw(state.deck, 1);
  return revealCommunityStreet(
    state,
    "river",
    river.dealt,
    river.remaining,
    "River revealed",
  );
}

export function advanceStepDemoRunoutBoard(state: StepDemoState): StepDemoState {
  if (!state.allInShowdown || state.communityCards.length >= 5) return state;

  const validSteps: StepDemoStep[] = [
    "preflop-complete",
    "flop-complete",
    "turn-complete",
  ];
  if (!validSteps.includes(state.step)) return state;

  let deck = state.deck;
  let communityCards = [...state.communityCards];
  const logs: GameAction[] = [];

  function burnAndDeal(count: number): Card[] {
    const burn = dealCards(deck, 1);
    deck = burn.remaining;
    const draw = dealCards(deck, count);
    deck = draw.remaining;
    communityCards = [...communityCards, ...draw.dealt];
    return draw.dealt;
  }

  if (communityCards.length === 0) {
    burnAndDeal(3);
    logs.push(systemLog("Flop revealed", "flop"));
    burnAndDeal(1);
    logs.push(systemLog("Turn revealed", "turn"));
    burnAndDeal(1);
    logs.push(systemLog("River revealed", "river"));
  } else if (communityCards.length === 3) {
    burnAndDeal(1);
    logs.push(systemLog("Turn revealed", "turn"));
    burnAndDeal(1);
    logs.push(systemLog("River revealed", "river"));
  } else if (communityCards.length === 4) {
    burnAndDeal(1);
    logs.push(systemLog("River revealed", "river"));
  }

  return {
    ...state,
    step: "river-complete",
    street: "river",
    deck,
    communityCards,
    actionLog: [
      ...state.actionLog,
      ...logs,
      systemLog("All-in showdown.", "river"),
    ],
  };
}

export function advanceStepDemoShowResult(state: StepDemoState): StepDemoState {
  if (state.step !== "river-complete") return state;

  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const potAwarded = state.pot;
  let winner: { id: string; name: string };
  let winningHandName: string;

  let revealAiCards = false;

  if (ai.hasFolded) {
    winner = { id: human.id, name: human.name };
    winningHandName = "Win by fold";
    human.stack = addToStack(human.stack, state.pot);
  } else if (human.hasFolded) {
    winner = { id: ai.id, name: ai.name };
    winningHandName = "Win by fold";
    ai.stack = addToStack(ai.stack, state.pot);
  } else {
    const humanEval = evaluateBestHand([
      ...human.holeCards,
      ...state.communityCards,
    ]);
    const aiEval = evaluateBestHand([...ai.holeCards, ...state.communityCards]);
    const cmp = compareEvaluatedHands(humanEval, aiEval);

    if (cmp >= 0) {
      winner = { id: human.id, name: human.name };
      winningHandName = humanEval.rankName;
      human.stack = addToStack(human.stack, state.pot);
    } else {
      winner = { id: ai.id, name: ai.name };
      winningHandName = aiEval.rankName;
      ai.stack = addToStack(ai.stack, state.pot);
    }
    revealAiCards = true;
  }

  human.stack = clampStack(human.stack);
  ai.stack = clampStack(ai.stack);

  return {
    ...state,
    step: "result",
    turn: null,
    players: { human, pokerMaster: ai },
    winner,
    winningHandName,
    pot: 0,
    lastPotWon: potAwarded,
    revealAiCards,
    actionLog: [...state.actionLog, systemLog("Showdown complete", "showdown")],
  };
}

export function getStepDemoHumanActions(state: StepDemoState): StepDemoHumanActions {
  const isHumanTurn =
    state.turn === "human" && isHumanActionStep(state.step);

  if (!state.isActive || !isHumanTurn) {
    let disabledHint = "PokerMaster is thinking...";
    if (!state.isActive) {
      disabledHint = "Start a hand first.";
    } else if (state.step === "result") {
      disabledHint = "Hand complete — start a new hand.";
    } else if (isHumanFacingAiRaiseStep(state.step)) {
      disabledHint = "PokerMaster raised — respond to continue.";
    } else if (state.turn === "poker-master") {
      disabledHint = state.humanAllIn
        ? "You are all-in — PokerMaster is thinking..."
        : "PokerMaster is thinking...";
    } else if (
      state.step === "preflop-complete" ||
      state.step === "flop-complete" ||
      state.step === "turn-complete" ||
      state.step === "river-complete"
    ) {
      disabledHint = getStepDemoStatusMessage(state);
    }

    return {
      canFold: false,
      canCall: false,
      callAmount: 0,
      canCheck: false,
      canRaise: false,
      canAllIn: false,
      allInAmount: 0,
      raiseAmount: STEP_DEMO_RAISE,
      raiseOptions: [],
      disabledHint,
    };
  }

  const humanStack = clampStack(state.players.human.stack);
  const toCall = getStepDemoHumanCallAmount(state);
  const facingRaise = isHumanFacingAiRaiseStep(state.step);
  const canReRaise = facingRaise && !state.humanReRaisedAfterAiRaise;
  const raiseOptions = buildRaiseOptions(state);
  const defaultRaise = raiseOptions.find((o) => o.size === 10)?.increment ?? STEP_DEMO_RAISE;
  const bettingLocked = state.allInShowdown || state.humanAllIn;

  if (bettingLocked) {
    return {
      canFold: false,
      canCall: false,
      callAmount: 0,
      canCheck: false,
      canRaise: false,
      canAllIn: false,
      allInAmount: 0,
      raiseAmount: defaultRaise,
      raiseOptions: [],
      disabledHint: state.allInShowdown
        ? "All-in showdown — use the next step button."
        : "You are all-in — PokerMaster is thinking...",
    };
  }

  return {
    canFold: true,
    canCall: toCall > 0,
    callAmount: toCall,
    canCheck: toCall === 0 && !facingRaise,
    canRaise: facingRaise ? canReRaise : raiseOptions.some((o) => o.enabled),
    canAllIn: humanStack > 0,
    allInAmount: humanStack,
    raiseAmount: defaultRaise,
    raiseOptions,
    disabledHint: facingRaise
      ? "PokerMaster raised — respond to continue."
      : "Your turn — choose an action.",
  };
}

export function getStepDemoTurnLabel(state: StepDemoState): string {
  if (state.step === "result") return "Showdown";
  if (state.turn === "human") return "You";
  if (state.turn === "poker-master") return PokerMaster.name;
  if (
    state.step === "preflop-complete" ||
    state.step === "flop-complete" ||
    state.step === "turn-complete" ||
    state.step === "river-complete"
  ) {
    return "Next step";
  }
  return "—";
}

export function getStepDemoStatusMessage(state: StepDemoState): string {
  if (!state.isActive) return "Start a hand to play vs PokerMaster.";

  if (state.step === "result") {
    if (state.humanAllIn && state.winningHandName === "Win by fold") {
      return "PokerMaster folded — you win the pot.";
    }
    return "Hand complete — start a new hand.";
  }

  if (state.allInShowdown) {
    if (state.communityCards.length < 5) {
      return "All-in called — run out the board.";
    }
    return "All-in showdown.";
  }

  if (state.turn === "poker-master") {
    if (state.humanAllIn) {
      return "You are all-in — PokerMaster is thinking...";
    }
    return "PokerMaster is thinking...";
  }

  if (state.turn === "human" && isHumanActionStep(state.step)) {
    if (isHumanFacingAiRaiseStep(state.step)) {
      return "PokerMaster raised — respond to continue.";
    }
    return "Your turn — choose an action.";
  }

  switch (state.step) {
    case "preflop-complete":
    case "flop-complete":
    case "turn-complete":
      return "PokerMaster called — reveal the next street.";
    case "river-complete":
      return "River complete — show the result.";
  }

  return STEP_DEMO_LABELS[state.step];
}

export function getStepDemoNextStep(
  state: StepDemoState,
): StepDemoNextStep | null {
  if (!state.isActive || isStepDemoBettingInProgress(state)) return null;

  if (state.allInShowdown) {
    if (state.communityCards.length < 5) {
      return { label: "Runout Board", action: "runout-board" };
    }
    if (state.step === "river-complete" || state.communityCards.length >= 5) {
      return { label: "Show Result", action: "show-result" };
    }
    return null;
  }

  switch (state.step) {
    case "preflop-complete":
      return { label: "Reveal Flop", action: "reveal-flop" };
    case "flop-complete":
      return { label: "Reveal Turn", action: "reveal-turn" };
    case "turn-complete":
      return { label: "Reveal River", action: "reveal-river" };
    case "river-complete":
      return { label: "Show Result", action: "show-result" };
    default:
      return null;
  }
}

export function getStepDemoGameplayGuidance(
  state: StepDemoState,
): StepDemoGameplayGuidance {
  if (!state.isActive) {
    return {
      phase: "start-hand",
      banner: "START HAND",
      actionHint: "Start a hand first — tap Play vs PokerMaster.",
    };
  }

  if (state.step === "result") {
    const hint =
      state.humanAllIn && state.winningHandName === "Win by fold"
        ? "PokerMaster folded — you win the pot."
        : state.allInShowdown || state.humanAllIn
          ? "All-in showdown complete."
          : "Hand complete — start a new hand.";
    return {
      phase: "hand-complete",
      banner: "HAND COMPLETE",
      actionHint: hint,
    };
  }

  if (state.allInShowdown) {
    const nextStep = getStepDemoNextStep(state);
    return {
      phase: "all-in",
      banner: "ALL-IN",
      actionHint: getStepDemoStatusMessage(state),
      nextStep: nextStep ?? undefined,
    };
  }

  if (state.turn === "human" && isHumanActionStep(state.step)) {
    return {
      phase: "your-turn",
      banner: "YOUR TURN",
      actionHint: getStepDemoStatusMessage(state),
    };
  }

  const nextStep = getStepDemoNextStep(state);
  if (nextStep) {
    return {
      phase: "advance-street",
      banner: "NEXT STEP",
      actionHint: getStepDemoStatusMessage(state),
      nextStep,
    };
  }

  if (state.turn === "poker-master") {
    return {
      phase: "waiting",
      banner: "POKERMASTER THINKING",
      actionHint: state.humanAllIn
        ? "You are all-in — PokerMaster is thinking..."
        : "PokerMaster is thinking...",
    };
  }

  return {
    phase: "advance-street",
    banner: "NEXT STEP",
    actionHint: getStepDemoStatusMessage(state),
  };
}

export function getStepDemoStreetLabel(state: StepDemoState): string {
  if (state.step === "result") return "Result";
  switch (state.street) {
    case "preflop":
      return "Preflop";
    case "flop":
      return "Flop";
    case "turn":
      return "Turn";
    case "river":
      return "River";
  }
}

export function getStepDemoStackUpdates(
  state: StepDemoState,
): Pick<SessionStacksState, "human" | typeof PokerMaster.id> | null {
  if (state.step !== "result" || !state.winner) return null;

  return {
    human: clampStack(state.players.human.stack),
    [PokerMaster.id]: clampStack(state.players.pokerMaster.stack),
  };
}

export function buildStepDemoSeats(
  state: StepDemoState,
  sessionStacks: SessionStacksState,
): TableSeat[] {
  const human = state.players.human;
  const ai = state.players.pokerMaster;
  const winnerId = state.winner?.id;

  function seatStatus(playerId: string, folded: boolean): AgentStatus {
    if (state.step === "result" && winnerId === playerId) return "winner";
    if (folded) return "folded";
    if (state.turn === playerId && state.step !== "result") return "active";
    if (state.isActive && state.step !== "idle" && state.step !== "result") {
      return "idle";
    }
    return "idle";
  }

  const humanStack = clampStack(
    state.isActive && state.step !== "idle"
      ? human.stack
      : (sessionStacks.human ?? DEFAULT_STARTING_STACK),
  );
  const aiStack = clampStack(
    state.isActive && state.step !== "idle"
      ? ai.stack
      : (sessionStacks[PokerMaster.id] ?? DEFAULT_STARTING_STACK),
  );

  const revealAi =
    (isShowdownResult(state) && state.revealAiCards) ||
    (state.allInShowdown && state.isActive && state.step !== "result");

  return [
    {
      id: PokerMaster.id,
      name: ai.name,
      avatar: PokerMaster.avatar,
      strategy: PokerMaster.strategy,
      stack: aiStack,
      holeCards: ai.holeCards,
      status: seatStatus(ai.id, ai.hasFolded),
      position: "top",
      revealCards: revealAi,
    },
    {
      id: human.id,
      name: human.name,
      avatar: "HP",
      strategy: "balanced",
      stack: humanStack,
      holeCards: human.holeCards,
      status: seatStatus(human.id, human.hasFolded),
      position: "bottom",
      revealCards: state.isActive,
    },
  ];
}

export function getStepDemoPotDisplay(state: StepDemoState): number | null {
  if (!state.isActive) return null;
  if (state.step === "result") return state.lastPotWon;
  return state.pot;
}
