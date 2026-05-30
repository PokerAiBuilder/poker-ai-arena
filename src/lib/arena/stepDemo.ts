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

export const STEP_DEMO_RAISE = 10;

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
  startStacks: { human: number; pokerMaster: number };
  revealAiCards: boolean;
};

export type StepDemoHumanActions = {
  canFold: boolean;
  canCall: boolean;
  callAmount: number;
  canCheck: boolean;
  canRaise: boolean;
  raiseAmount: number;
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
  | "hand-complete";

export type StepDemoNextStepAction =
  | "reveal-flop"
  | "reveal-turn"
  | "reveal-river"
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
      return "Preflop complete — reveal the flop.";
    case "flop":
      return "Flop complete — reveal the turn.";
    case "turn":
      return "Turn complete — reveal the river.";
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

function toSimulationAgentDecision(
  decision: AgentDecision,
  stage: GameStage,
  stateAfterAction?: StepDemoState,
): SimulationAgentDecision {
  const humanCall =
    stateAfterAction != null ? humanAmountToCall(stateAfterAction) : 0;

  let amount = decision.amount;
  if (decision.action === "raise" || decision.action === "all-in") {
    amount = STEP_DEMO_RAISE;
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
    human: sessionStacks.human ?? DEFAULT_STARTING_STACK,
    pokerMaster: sessionStacks[PokerMaster.id] ?? DEFAULT_STARTING_STACK,
  };
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

function targetRaiseBet(state: StepDemoState): number {
  return state.currentBet === 0
    ? STEP_DEMO_RAISE
    : state.currentBet + STEP_DEMO_RAISE;
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
    human.stack += potAwarded;
    ai.hasFolded = true;
  } else {
    ai.stack += potAwarded;
    human.hasFolded = true;
  }

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

  const humanStack = stacks.human - DEFAULT_SMALL_BLIND;
  const aiStack = stacks.pokerMaster - DEFAULT_BIG_BLIND;
  const pot = DEFAULT_SMALL_BLIND + DEFAULT_BIG_BLIND;

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
        stack: humanStack,
        hasFolded: false,
      },
      pokerMaster: {
        id: PokerMaster.id,
        name: PokerMaster.name,
        holeCards: aiDeal.dealt,
        stack: aiStack,
        hasFolded: false,
      },
    },
    actionLog: [
      systemLog("New hand dealt."),
      systemLog(
        `Blinds posted — You SB ${DEFAULT_SMALL_BLIND}, ${PokerMaster.name} BB ${DEFAULT_BIG_BLIND}. Pot ${pot}. Your turn.`,
      ),
    ],
    aiDecision: null,
    winner: null,
    winningHandName: null,
    pot,
    lastPotWon: 0,
    currentBet: DEFAULT_BIG_BLIND,
    humanStreetBet: DEFAULT_SMALL_BLIND,
    aiStreetBet: DEFAULT_BIG_BLIND,
    aiRaisedThisStreet: false,
    humanReRaisedAfterAiRaise: false,
    startStacks: stacks,
    revealAiCards: false,
  };
}

export function applyHumanFold(state: StepDemoState): StepDemoState {
  if (state.turn !== "human" || state.step === "result") return state;

  const human = { ...state.players.human, hasFolded: true };
  const log = playerLog(
    human.id,
    human.name,
    "fold",
    "You fold.",
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
      const pay = Math.min(amountToCall, nextAi.stack);
      nextAi.stack -= pay;
      aiStreetBet += pay;
      pot += pay;
      break;
    }
    case "raise":
    case "all-in": {
      const newBet = targetRaiseBet(state);
      const pay = Math.min(newBet - aiStreetBet, nextAi.stack);
      nextAi.stack -= pay;
      aiStreetBet += pay;
      pot += pay;
      currentBet = aiStreetBet;
      aiRaisedThisStreet = true;
      break;
    }
    default:
      break;
  }

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
      systemLog(`${PokerMaster.name} raised — your response needed.`, stage),
    ],
  };
}

function runAiAfterHumanReRaise(state: StepDemoState): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const stage = gameStage(state);

  const decision = getStepDemoPokerMasterDecision(state, {
    afterHumanReRaise: true,
    aiAlreadyRaised: true,
  });

  const logs: GameAction[] = [
    playerLog(
      ai.id,
      ai.name,
      decision.action,
      `${ai.name} ${decision.action}${decision.amount != null ? ` ${decision.amount}` : ""} — ${decision.reasoning}`,
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

function runAiStreetResponse(state: StepDemoState): StepDemoState {
  const human = { ...state.players.human };
  const ai = { ...state.players.pokerMaster };
  const stage = gameStage(state);

  const decision = getStepDemoPokerMasterDecision(state, {
    aiAlreadyRaised: state.aiRaisedThisStreet,
  });

  const logs: GameAction[] = [
    playerLog(
      ai.id,
      ai.name,
      decision.action,
      `${ai.name} ${decision.action}${decision.amount != null ? ` ${decision.amount}` : ""} — ${decision.reasoning}`,
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

export function applyHumanCall(state: StepDemoState): StepDemoState {
  if (state.turn !== "human") return state;

  const toCall = humanAmountToCall(state);
  if (toCall <= 0) return applyHumanCheck(state);

  const human = { ...state.players.human };
  const pay = Math.min(toCall, human.stack);
  human.stack -= pay;

  const log = playerLog(
    human.id,
    human.name,
    "call",
    `You call ${pay}.`,
    gameStage(state),
  );

  const next = {
    ...state,
    players: { human, pokerMaster: state.players.pokerMaster },
    pot: state.pot + pay,
    humanStreetBet: state.humanStreetBet + pay,
    actionLog: [...state.actionLog, log],
  };

  if (isHumanFacingAiRaiseStep(state.step)) {
    return completeStreet(next);
  }

  return runAiStreetResponse(next);
}

export function applyHumanCheck(state: StepDemoState): StepDemoState {
  if (state.turn !== "human" || humanAmountToCall(state) > 0) return state;

  const log = playerLog(
    state.players.human.id,
    state.players.human.name,
    "check",
    "You check.",
    gameStage(state),
  );

  return runAiStreetResponse({
    ...state,
    actionLog: [...state.actionLog, log],
  });
}

export function applyHumanRaise(state: StepDemoState): StepDemoState {
  if (state.turn !== "human") return state;

  if (
    isHumanFacingAiRaiseStep(state.step) &&
    state.humanReRaisedAfterAiRaise
  ) {
    return state;
  }

  const human = { ...state.players.human };
  const newBet = targetRaiseBet(state);
  const pay = Math.min(newBet - state.humanStreetBet, human.stack);
  human.stack -= pay;
  const newHumanStreetBet = state.humanStreetBet + pay;

  const log = playerLog(
    human.id,
    human.name,
    "raise",
    `You ${state.currentBet === 0 ? "bet" : "raise"} ${pay} (total bet ${newHumanStreetBet}).`,
    gameStage(state),
  );

  const next = {
    ...state,
    players: { human, pokerMaster: state.players.pokerMaster },
    pot: state.pot + pay,
    humanStreetBet: newHumanStreetBet,
    currentBet: newHumanStreetBet,
    actionLog: [...state.actionLog, log],
  };

  if (isHumanFacingAiRaiseStep(state.step)) {
    return runAiAfterHumanReRaise({
      ...next,
      humanReRaisedAfterAiRaise: true,
    });
  }

  return runAiStreetResponse(next);
}

export function advanceStepDemoRevealFlop(state: StepDemoState): StepDemoState {
  if (state.step !== "preflop-complete") return state;

  const flop = dealBurnAndDraw(state.deck, 3);
  return revealCommunityStreet(
    state,
    "flop",
    flop.dealt,
    flop.remaining,
    "Flop revealed. Your turn.",
  );
}

export function advanceStepDemoRevealTurn(state: StepDemoState): StepDemoState {
  if (state.step !== "flop-complete") return state;

  const turn = dealBurnAndDraw(state.deck, 1);
  return revealCommunityStreet(
    state,
    "turn",
    turn.dealt,
    turn.remaining,
    "Turn revealed. Your turn.",
  );
}

export function advanceStepDemoRevealRiver(state: StepDemoState): StepDemoState {
  if (state.step !== "turn-complete") return state;

  const river = dealBurnAndDraw(state.deck, 1);
  return revealCommunityStreet(
    state,
    "river",
    river.dealt,
    river.remaining,
    "River revealed. Your turn.",
  );
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
    human.stack += state.pot;
  } else if (human.hasFolded) {
    winner = { id: ai.id, name: ai.name };
    winningHandName = "Win by fold";
    ai.stack += state.pot;
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
      human.stack += state.pot;
    } else {
      winner = { id: ai.id, name: ai.name };
      winningHandName = aiEval.rankName;
      ai.stack += state.pot;
    }
    revealAiCards = true;
  }

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
    actionLog: [...state.actionLog, systemLog("Showdown complete.", "showdown")],
  };
}

export function getStepDemoHumanActions(state: StepDemoState): StepDemoHumanActions {
  const isHumanTurn =
    state.turn === "human" && isHumanActionStep(state.step);

  if (!state.isActive || !isHumanTurn) {
    let disabledHint = "Waiting for PokerMaster.";
    if (!state.isActive) {
      disabledHint = "Start a hand first.";
    } else if (state.step === "result") {
      disabledHint = "Hand complete — start a new hand.";
    } else if (isHumanFacingAiRaiseStep(state.step)) {
      disabledHint = `${PokerMaster.name} raised — choose Call, Raise, or Fold.`;
    } else if (
      state.step === "preflop-complete" ||
      state.step === "flop-complete" ||
      state.step === "turn-complete" ||
      state.step === "river-complete"
    ) {
      disabledHint = getStepDemoStatusMessage(state);
    } else if (state.turn === "poker-master") {
      disabledHint = "Waiting for PokerMaster.";
    }

    return {
      canFold: false,
      canCall: false,
      callAmount: 0,
      canCheck: false,
      canRaise: false,
      raiseAmount: STEP_DEMO_RAISE,
      disabledHint,
    };
  }

  const toCall = getStepDemoHumanCallAmount(state);
  const facingRaise = isHumanFacingAiRaiseStep(state.step);
  const canReRaise = facingRaise && !state.humanReRaisedAfterAiRaise;

  return {
    canFold: true,
    canCall: toCall > 0,
    callAmount: toCall,
    canCheck: toCall === 0 && !facingRaise,
    canRaise: facingRaise ? canReRaise : true,
    raiseAmount: STEP_DEMO_RAISE,
    disabledHint: facingRaise
      ? `${PokerMaster.name} raised — choose Call, Raise, or Fold.`
      : "Your turn — choose Fold, Call, Check, or Raise.",
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
    return "Hand complete — start a new hand.";
  }

  if (state.turn === "human" && isHumanActionStep(state.step)) {
    if (isHumanFacingAiRaiseStep(state.step)) {
      return `${PokerMaster.name} raised. Choose Call, Raise, or Fold.`;
    }
    const toCall = getStepDemoHumanCallAmount(state);
    if (toCall > 0) {
      return `Your turn — call ${toCall} or raise.`;
    }
    return "Your turn — choose Fold, Check, or Raise.";
  }

  switch (state.step) {
    case "preflop-complete":
      return "Preflop complete — reveal the flop.";
    case "flop-complete":
      return "Flop complete — reveal the turn.";
    case "turn-complete":
      return "Turn complete — reveal the river.";
    case "river-complete":
      return "River complete — show the result.";
  }

  if (state.turn === "poker-master") {
    return "Waiting for PokerMaster…";
  }

  return STEP_DEMO_LABELS[state.step];
}

export function getStepDemoNextStep(
  state: StepDemoState,
): StepDemoNextStep | null {
  if (!state.isActive || isStepDemoBettingInProgress(state)) return null;

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
    return {
      phase: "hand-complete",
      banner: "HAND COMPLETE",
      actionHint: "Hand complete — start a new hand.",
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
      actionHint: "Waiting for PokerMaster…",
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
    human: state.players.human.stack,
    [PokerMaster.id]: state.players.pokerMaster.stack,
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

  const humanStack =
    state.isActive && state.step !== "idle"
      ? human.stack
      : (sessionStacks.human ?? DEFAULT_STARTING_STACK);
  const aiStack =
    state.isActive && state.step !== "idle"
      ? ai.stack
      : (sessionStacks[PokerMaster.id] ?? DEFAULT_STARTING_STACK);

  const revealAi = isShowdownResult(state) && state.revealAiCards;

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
