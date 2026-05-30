import type { AgentDecision } from "@/lib/agents/agentTypes";
import { getAgentById, getAgentDecision } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type {
  GameAction,
  GameActionType,
  GameStage,
  GameState,
  Player,
  SimulationAgentDecision,
} from "@/lib/poker/types";
import { evaluateBestHand } from "@/lib/poker/evaluator";
import { RANK_VALUES } from "@/lib/poker/types";

export const DEFAULT_STARTING_STACK = 1000;
export const DEFAULT_SMALL_BLIND = 5;
export const DEFAULT_BIG_BLIND = 10;

export type BettingDecision = {
  action: Exclude<GameActionType, "deal" | "showdown" | "blind">;
  amount?: number;
  message: string;
};

export function resetRoundBets(players: Player[]): void {
  for (const player of players) {
    player.currentBet = 0;
  }
}

export function getActivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.hasFolded && !p.isAllIn);
}

export function getPlayerById(state: GameState, playerId: string): Player {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) {
    throw new Error(`Player not found: ${playerId}`);
  }
  return player;
}

export function amountToCall(player: Player, currentBet: number): number {
  return Math.max(0, currentBet - player.currentBet);
}

export function canCheck(player: Player, currentBet: number): boolean {
  return amountToCall(player, currentBet) === 0;
}

export function bettingRoundComplete(state: GameState): boolean {
  const active = getActivePlayers(state);
  if (active.length <= 1) return true;

  return active.every(
    (player) =>
      player.currentBet === state.currentBet || player.stack === 0,
  );
}

function logAction(
  state: GameState,
  entry: Omit<GameAction, "timestamp">,
): GameAction {
  const action: GameAction = { ...entry, timestamp: Date.now() };
  state.actionLog.push(action);
  return action;
}

function getPlayerPosition(player: Player, state: GameState): string {
  const index = state.players.findIndex((p) => p.id === player.id);
  if (index === state.dealerIndex) return "button";
  if (index === (state.dealerIndex + 1) % state.players.length) {
    return state.players.length === 2 ? "big blind" : "small blind";
  }
  return "middle";
}

function buildAgentInput(player: Player, state: GameState) {
  const agent = getAgentById(player.id) ?? PokerMaster;
  const toCall = amountToCall(player, state.currentBet);

  return {
    agent,
    partialInput: {
      holeCards: player.holeCards,
      communityCards: state.communityCards,
      currentBet: state.currentBet,
      amountToCall: toCall,
      minRaise: state.bigBlind,
      stack: player.stack,
      pot: state.pot,
      position: getPlayerPosition(player, state),
      gameStage: state.stage,
      previousActions: state.actionLog,
    },
  };
}

function formatAgentMessage(
  agentName: string,
  decision: AgentDecision,
  toCall: number,
): string {
  switch (decision.action) {
    case "fold":
      return `${agentName} folds — ${decision.reasoning}.`;
    case "check":
      return `${agentName} checks — ${decision.reasoning}.`;
    case "call":
      return `${agentName} calls ${decision.amount ?? toCall} chips — ${decision.reasoning}.`;
    case "raise":
      return `${agentName} raises ${decision.amount ?? 0} chips — ${decision.reasoning}.`;
    case "all-in":
      return `${agentName} goes all-in ${decision.amount ?? 0} chips — ${decision.reasoning}.`;
    default:
      return `${agentName} acts — ${decision.reasoning}.`;
  }
}

function recordAgentDecision(
  state: GameState,
  agentId: string,
  agentName: string,
  strategy: SimulationAgentDecision["strategy"],
  decision: AgentDecision,
): void {
  state.agentDecisions.push({
    agentId,
    agentName,
    strategy,
    stage: state.stage,
    action: decision.action,
    amount: decision.amount,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
  });
}

function agentDecisionToBetting(
  player: Player,
  state: GameState,
  decision: AgentDecision,
): BettingDecision {
  const toCall = amountToCall(player, state.currentBet);
  const agent = getAgentById(player.id) ?? PokerMaster;

  recordAgentDecision(
    state,
    agent.id,
    agent.name,
    agent.strategy,
    decision,
  );

  return {
    action: decision.action,
    amount: decision.amount,
    message: formatAgentMessage(agent.name, decision, toCall),
  };
}

function preflopStrength(player: Player): number {
  const [a, b] = player.holeCards.map((c) => RANK_VALUES[c.rank]);
  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const isPair = a === b;
  const suited = player.holeCards[0].suit === player.holeCards[1].suit;

  if (isPair) return high * 3;
  if (suited && high >= 10) return high + low * 0.5;
  return high + low * 0.25;
}

function postflopStrength(player: Player, state: GameState): number {
  const allCards = [...player.holeCards, ...state.communityCards];
  if (allCards.length < 5) return preflopStrength(player);
  const evaluated = evaluateBestHand(allCards);
  return evaluated.scores[0] * 100 + (evaluated.scores[1] ?? 0);
}

/**
 * Fallback rules-based betting for human / non-agent players.
 */
export function decideSimpleAction(
  player: Player,
  state: GameState,
): BettingDecision {
  const toCall = amountToCall(player, state.currentBet);
  const strength =
    state.stage === "preflop"
      ? preflopStrength(player)
      : postflopStrength(player, state);

  const bluff = Math.random() < 0.1;

  if (strength >= 36 || bluff) {
    if (toCall === 0) {
      const raiseTo = state.currentBet + state.bigBlind;
      return {
        action: "raise",
        amount: raiseTo,
        message: `${player.name} raises to ${raiseTo} chips with a strong read.`,
      };
    }
    if (toCall <= state.bigBlind * 2) {
      return {
        action: "call",
        amount: toCall,
        message: `${player.name} calls ${toCall} chips to continue.`,
      };
    }
    return {
      action: "fold",
      message: `${player.name} folds — price too high.`,
    };
  }

  if (strength >= 22) {
    if (toCall === 0) {
      return {
        action: "check",
        message: `${player.name} checks with a medium hand.`,
      };
    }
    if (toCall <= state.bigBlind) {
      return {
        action: "call",
        amount: toCall,
        message: `${player.name} calls ${toCall} chips with a medium hand.`,
      };
    }
    return {
      action: "fold",
      message: `${player.name} folds a marginal hand.`,
    };
  }

  if (toCall === 0) {
    return {
      action: "check",
      message: `${player.name} checks with a weak hand.`,
    };
  }

  if (toCall <= state.smallBlind && bluff) {
    return {
      action: "call",
      amount: toCall,
      message: `${player.name} peeks with a loose call.`,
    };
  }

  return {
    action: "fold",
    message: `${player.name} folds a weak hand.`,
  };
}

function decidePlayerAction(
  player: Player,
  state: GameState,
): BettingDecision {
  if (player.role === "human") {
    return decideSimpleAction(player, state);
  }

  const agent = getAgentById(player.id);
  if (agent) {
    const { agent: resolvedAgent, partialInput } = buildAgentInput(player, state);
    const decision = getAgentDecision(resolvedAgent.id, partialInput);
    return agentDecisionToBetting(player, state, decision);
  }

  return decideSimpleAction(player, state);
}

export function postBlinds(state: GameState): GameAction[] {
  const actions: GameAction[] = [];
  const isHeadsUp = state.players.length === 2;

  const sbIndex = isHeadsUp
    ? state.dealerIndex
    : (state.dealerIndex + 1) % state.players.length;
  const bbIndex = isHeadsUp
    ? (state.dealerIndex + 1) % state.players.length
    : (state.dealerIndex + 2) % state.players.length;

  const sbPlayer = state.players[sbIndex];
  const bbPlayer = state.players[bbIndex];

  const sbAmount = Math.min(state.smallBlind, sbPlayer.stack);
  sbPlayer.stack -= sbAmount;
  sbPlayer.currentBet = sbAmount;
  state.pot += sbAmount;

  actions.push(
    logAction(state, {
      playerId: sbPlayer.id,
      playerName: sbPlayer.name,
      action: "blind",
      amount: sbAmount,
      stage: state.stage,
      message: `${sbPlayer.name} posts small blind ${sbAmount} chips.`,
    }),
  );

  const bbAmount = Math.min(state.bigBlind, bbPlayer.stack);
  bbPlayer.stack -= bbAmount;
  bbPlayer.currentBet = bbAmount;
  state.pot += bbAmount;
  state.currentBet = bbAmount;

  actions.push(
    logAction(state, {
      playerId: bbPlayer.id,
      playerName: bbPlayer.name,
      action: "blind",
      amount: bbAmount,
      stage: state.stage,
      message: `${bbPlayer.name} posts big blind ${bbAmount} chips.`,
    }),
  );

  return actions;
}

export function applyAction(
  state: GameState,
  playerId: string,
  decision: BettingDecision,
): GameAction {
  const player = getPlayerById(state, playerId);
  const toCall = amountToCall(player, state.currentBet);

  switch (decision.action) {
    case "fold": {
      player.hasFolded = true;
      return logAction(state, {
        playerId: player.id,
        playerName: player.name,
        action: "fold",
        stage: state.stage,
        message: decision.message,
      });
    }

    case "check": {
      if (!canCheck(player, state.currentBet)) {
        throw new Error(`${player.name} cannot check — must call ${toCall}`);
      }
      return logAction(state, {
        playerId: player.id,
        playerName: player.name,
        action: "check",
        stage: state.stage,
        message: decision.message,
      });
    }

    case "call": {
      const callAmount = Math.min(toCall, player.stack);
      player.stack -= callAmount;
      player.currentBet += callAmount;
      state.pot += callAmount;
      if (player.stack === 0) player.isAllIn = true;

      return logAction(state, {
        playerId: player.id,
        playerName: player.name,
        action: "call",
        amount: callAmount,
        stage: state.stage,
        message: decision.message,
      });
    }

    case "raise": {
      const raiseTotal = decision.amount ?? state.currentBet + state.bigBlind;
      const needed = raiseTotal - player.currentBet;
      const paid = Math.min(needed, player.stack);
      player.stack -= paid;
      player.currentBet += paid;
      state.pot += paid;
      state.currentBet = Math.max(state.currentBet, player.currentBet);
      if (player.stack === 0) player.isAllIn = true;

      return logAction(state, {
        playerId: player.id,
        playerName: player.name,
        action: "raise",
        amount: paid,
        stage: state.stage,
        message: decision.message,
      });
    }

    case "all-in": {
      const allInAmount = player.stack;
      player.stack = 0;
      player.currentBet += allInAmount;
      state.pot += allInAmount;
      state.currentBet = Math.max(state.currentBet, player.currentBet);
      player.isAllIn = true;

      return logAction(state, {
        playerId: player.id,
        playerName: player.name,
        action: "all-in",
        amount: allInAmount,
        stage: state.stage,
        message: decision.message,
      });
    }

    default:
      throw new Error(`Unsupported action: ${decision.action}`);
  }
}

export function runBettingRound(state: GameState, stage: GameStage): void {
  state.stage = stage;
  resetRoundBets(state.players);

  let safety = 0;
  while (!bettingRoundComplete(state) && safety < 20) {
    safety += 1;
    const active = getActivePlayers(state);
    if (active.length <= 1) break;

    for (const player of active) {
      if (bettingRoundComplete(state)) break;
      if (player.hasFolded || player.isAllIn) continue;

      const toCall = amountToCall(player, state.currentBet);
      if (
        player.currentBet === state.currentBet &&
        toCall === 0 &&
        safety > 1
      ) {
        continue;
      }

      const decision = decidePlayerAction(player, state);
      applyAction(state, player.id, decision);

      if (getActivePlayers(state).length <= 1) break;
    }
  }
}
