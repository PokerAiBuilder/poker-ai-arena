import { AGENT_REGISTRY } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import { createDeck, dealCards, shuffleDeck } from "@/lib/poker/deck";
import {
  compareEvaluatedHands,
  describeHand,
  evaluateBestHand,
  runEvaluatorSelfCheck,
} from "@/lib/poker/evaluator";
import type {
  EvaluatedHand,
  GameMode,
  GameState,
  HandResult,
  Player,
  SimulationResult,
} from "@/lib/poker/types";
import { formatCards } from "@/lib/poker/types";
import {
  DEFAULT_BIG_BLIND,
  DEFAULT_SMALL_BLIND,
  DEFAULT_STARTING_STACK,
  getActivePlayers,
  postBlinds,
  runBettingRound,
} from "@/lib/poker/betting";

let gameCounter = 0;

function createBaseGameState(
  players: Player[],
  overrides?: Partial<Pick<GameState, "smallBlind" | "bigBlind">>,
): GameState {
  gameCounter += 1;

  return {
    id: `game-${gameCounter}`,
    players,
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    stage: "preflop",
    actionLog: [],
    agentDecisions: [],
    dealerIndex: 0,
    smallBlind: overrides?.smallBlind ?? DEFAULT_SMALL_BLIND,
    bigBlind: overrides?.bigBlind ?? DEFAULT_BIG_BLIND,
    handNumber: 0,
  };
}

export function createNewGame(
  overrides?: Partial<Pick<GameState, "smallBlind" | "bigBlind">>,
): GameState {
  const human: Player = {
    id: "human",
    name: "Human Player",
    role: "human",
    stack: DEFAULT_STARTING_STACK,
    holeCards: [],
    currentBet: 0,
    hasFolded: false,
    isAllIn: false,
  };

  const ai: Player = {
    id: PokerMaster.id,
    name: PokerMaster.name,
    role: "ai",
    stack: DEFAULT_STARTING_STACK,
    holeCards: [],
    currentBet: 0,
    hasFolded: false,
    isAllIn: false,
  };

  return createBaseGameState([human, ai], overrides);
}

export function createAgentBattleGame(
  overrides?: Partial<Pick<GameState, "smallBlind" | "bigBlind">>,
): GameState {
  const players: Player[] = AGENT_REGISTRY.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: "ai",
    stack: DEFAULT_STARTING_STACK,
    holeCards: [],
    currentBet: 0,
    hasFolded: false,
    isAllIn: false,
  }));

  return createBaseGameState(players, overrides);
}

export function dealNewHand(state: GameState, introMessage?: string): void {
  state.handNumber += 1;
  state.deck = shuffleDeck(createDeck());
  state.communityCards = [];
  state.pot = 0;
  state.currentBet = 0;
  state.stage = "preflop";
  state.actionLog = [];
  state.agentDecisions = [];

  for (const player of state.players) {
    player.holeCards = [];
    player.currentBet = 0;
    player.hasFolded = false;
    player.isAllIn = false;
  }

  state.actionLog.push({
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage: "preflop",
    message:
      introMessage ?? `Hand #${state.handNumber} — new cards dealt.`,
    timestamp: Date.now(),
  });

  for (const player of state.players) {
    const { dealt, remaining } = dealCards(state.deck, 2);
    player.holeCards = dealt;
    state.deck = remaining;

    state.actionLog.push({
      playerId: player.id,
      playerName: player.name,
      action: "deal",
      stage: "preflop",
      message: `${player.name} receives hole cards.`,
      timestamp: Date.now(),
    });
  }

  postBlinds(state);
}

export function dealFlop(state: GameState): void {
  if (state.deck.length < 3) {
    throw new Error("Not enough cards in deck to deal flop");
  }

  const { dealt, remaining } = dealCards(state.deck, 3);
  state.communityCards = dealt;
  state.deck = remaining;
  state.stage = "flop";

  state.actionLog.push({
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage: "flop",
    message: `Flop: ${formatCards(dealt)}.`,
    timestamp: Date.now(),
  });
}

export function dealTurn(state: GameState): void {
  const { dealt, remaining } = dealCards(state.deck, 1);
  state.communityCards.push(...dealt);
  state.deck = remaining;
  state.stage = "turn";
}

export function dealRiver(state: GameState): void {
  const { dealt, remaining } = dealCards(state.deck, 1);
  state.communityCards.push(...dealt);
  state.deck = remaining;
  state.stage = "river";
}

function logArenaMessage(
  state: GameState,
  stage: GameState["stage"],
  message: string,
): void {
  state.actionLog.push({
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage,
    message,
    timestamp: Date.now(),
  });
}

/** Agent Battle: deal turn + river with honest board-runout logs (no street betting). */
function runAgentBattleBoardRunout(state: GameState): void {
  if (state.communityCards.length === 0) {
    dealFlop(state);
  }

  logArenaMessage(
    state,
    "flop",
    "Board runs out to the river — no turn/river betting in this spectator sim.",
  );

  if (state.communityCards.length === 3) {
    dealTurn(state);
    logArenaMessage(
      state,
      "turn",
      `Turn: ${formatCards(state.communityCards.slice(3, 4))}.`,
    );
  }

  if (state.communityCards.length === 4) {
    dealRiver(state);
    logArenaMessage(
      state,
      "river",
      `River: ${formatCards(state.communityCards.slice(4, 5))}.`,
    );
  }
}

export function determineWinner(
  state: GameState,
  options?: { gameMode?: GameMode },
): HandResult {
  state.stage = "showdown";
  const gameMode = options?.gameMode;
  const isAgentBattle = gameMode === "agent-vs-agent";

  const active = state.players.filter((p) => !p.hasFolded);

  if (active.length === 1) {
    const winner = active[0];
    winner.stack += state.pot;

    const result: HandResult = {
      winnerId: winner.id,
      winnerName: winner.name,
      winningHand: {
        rank: "high_card",
        rankName: "Win by fold",
        scores: [0],
        bestFive: winner.holeCards,
      },
      pot: state.pot,
      isSplit: false,
      loserIds: state.players.filter((p) => p.id !== winner.id).map((p) => p.id),
    };

    state.actionLog.push({
      playerId: winner.id,
      playerName: winner.name,
      action: "showdown",
      stage: "showdown",
      message: isAgentBattle
        ? `${winner.name} wins the Agent Battle — all opponents folded.`
        : `${winner.name} wins ${state.pot} chips — opponent folded.`,
      timestamp: Date.now(),
    });

    state.pot = 0;
    return result;
  }

  const evaluations = active.map((player) => ({
    player,
    hand: evaluateBestHand([...player.holeCards, ...state.communityCards]),
  }));

  evaluations.sort((a, b) => compareEvaluatedHands(b.hand, a.hand));
  const bestScore = evaluations[0].hand.scores.join(",");
  const winners = evaluations.filter(
    (e) => e.hand.scores.join(",") === bestScore,
  );

  const share = Math.floor(state.pot / winners.length);
  for (const { player } of winners) {
    player.stack += share;
  }

  const winner = winners[0].player;
  const isSplit = winners.length > 1;

  if (isAgentBattle) {
    state.actionLog.push({
      playerId: "system",
      playerName: "Arena",
      action: "showdown",
      stage: "showdown",
      message: "Showdown complete.",
      timestamp: Date.now(),
    });
  }

  state.actionLog.push({
    playerId: winner.id,
    playerName: winner.name,
    action: "showdown",
    stage: "showdown",
    message: isSplit
      ? `Split pot — ${winners.map((w) => w.player.name).join(" & ")} tie with ${winners[0].hand.rankName}.`
      : isAgentBattle
        ? `${winner.name} wins the Agent Battle — Showdown: ${describeHand(winners[0].hand)}.`
        : `${winner.name} wins ${state.pot} chips with ${describeHand(winners[0].hand)}.`,
    timestamp: Date.now(),
  });

  const result: HandResult = {
    winnerId: winner.id,
    winnerName: winner.name,
    winningHand: winners[0].hand,
    pot: state.pot,
    isSplit,
    loserIds: state.players
      .filter((p) => !winners.some((w) => w.player.id === p.id))
      .map((p) => p.id),
  };

  state.pot = 0;
  return result;
}

function toSimulationResult(
  state: GameState,
  result: HandResult,
  gameMode: GameMode,
): SimulationResult {
  const evaluations = new Map<string, EvaluatedHand>();

  const minBoardForEval = gameMode === "agent-vs-agent" ? 5 : 3;

  for (const player of state.players) {
    if (!player.hasFolded && state.communityCards.length >= minBoardForEval) {
      evaluations.set(
        player.id,
        evaluateBestHand([...player.holeCards, ...state.communityCards]),
      );
    }
  }

  const agentIds = state.players
    .filter((p) => p.role === "ai")
    .map((p) => p.id);

  return {
    gameId: state.id,
    handNumber: state.handNumber,
    gameMode,
    agents: gameMode === "agent-vs-agent" ? agentIds : [PokerMaster.id],
    players: state.players.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.role,
      holeCards: player.holeCards,
      stack: player.stack,
      hasFolded: player.hasFolded,
      finalHand: evaluations.get(player.id),
    })),
    communityCards: state.communityCards,
    winner: {
      id: result.winnerId,
      name: result.winnerName,
    },
    winningHand: {
      rank: result.winningHand.rank,
      rankName: result.winningHand.rankName,
      cards: result.winningHand.bestFive,
    },
    pot: result.pot,
    actionLog: state.actionLog,
    stage: state.stage,
    agentDecisions: state.agentDecisions,
  };
}

export function simulateHand(
  state: GameState,
  gameMode: GameMode,
): SimulationResult {
  dealNewHand(
    state,
    gameMode === "agent-vs-agent"
      ? `Agent Battle begins — ${state.players.length} AI agents at the table.`
      : undefined,
  );

  console.debug("[poker/engine] hand started", {
    gameId: state.id,
    gameMode,
    players: state.players.map((p) => p.name),
  });

  runBettingRound(state, "preflop");

  if (getActivePlayers(state).length <= 1) {
    const result = determineWinner(state, { gameMode });
    return toSimulationResult(state, result, gameMode);
  }

  dealFlop(state);
  runBettingRound(state, "flop");

  const result = determineWinner(state, { gameMode });
  const simulation = toSimulationResult(state, result, gameMode);

  console.debug("[poker/engine] hand complete", {
    gameMode,
    winner: simulation.winner.name,
    hand: simulation.winningHand.rankName,
    pot: simulation.pot,
  });

  return simulation;
}

export function simulateHumanVsAi(): SimulationResult {
  runEvaluatorSelfCheck();
  const state = createNewGame();
  return simulateHand(state, "human-vs-ai");
}

/** @deprecated Use simulateHumanVsAi() */
export function simulateSimpleHand(): SimulationResult {
  return simulateHumanVsAi();
}

/**
 * Agent Battle spectator sim: preflop agent decisions, then full board runout
 * (no turn/river betting). Human vs AI legacy sim stays on {@link simulateHand}.
 */
export function simulateAgentBattleHand(state: GameState): SimulationResult {
  const gameMode: GameMode = "agent-vs-agent";

  dealNewHand(
    state,
    `Agent Battle begins — ${state.players.length} AI agents at the table.`,
  );

  console.debug("[poker/engine] agent battle started", {
    gameId: state.id,
    players: state.players.map((p) => p.name),
  });

  runBettingRound(state, "preflop");

  if (getActivePlayers(state).length <= 1) {
    const result = determineWinner(state, { gameMode });
    return toSimulationResult(state, result, gameMode);
  }

  runAgentBattleBoardRunout(state);

  const result = determineWinner(state, { gameMode });
  const simulation = toSimulationResult(state, result, gameMode);

  console.debug("[poker/engine] agent battle complete", {
    gameMode,
    winner: simulation.winner.name,
    hand: simulation.winningHand.rankName,
    pot: simulation.pot,
    communityCards: simulation.communityCards.length,
  });

  return simulation;
}

export function simulateAgentBattle(): SimulationResult {
  runEvaluatorSelfCheck();
  const state = createAgentBattleGame();
  return simulateAgentBattleHand(state);
}

export function runEngineSelfCheck(): SimulationResult[] {
  const results = [
    simulateHumanVsAi(),
    simulateAgentBattle(),
    simulateHumanVsAi(),
  ];
  console.debug(
    "[poker/engine] self-check complete",
    results.map((r) => ({
      gameMode: r.gameMode,
      winner: r.winner.name,
      hand: r.winningHand.rankName,
    })),
  );
  return results;
}
