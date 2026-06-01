import {
  formatAgentBattleLogMessage,
  getAgentBattlePostflopDecision,
  getAgentBattlePreflopDecision,
} from "@/lib/agents/agentBattleStrategy";
import { getAgentById } from "@/lib/agents/agentRegistry";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import {
  agentBattlePressure,
  buildDecisionDisplayMeta,
} from "@/lib/arena/decisionDisplayMetadata";
import { recordAgentBattleContribution } from "@/lib/poker/agentBattleAccounting";
import { dealCards } from "@/lib/poker/deck";
import type { GameAction, GameStage, GameState, Player } from "@/lib/poker/types";
import { formatCards } from "@/lib/poker/types";
import {
  amountToCall,
  applyAction,
  bettingRoundComplete,
  getActivePlayers,
  resetRoundBets,
  type BettingDecision,
} from "@/lib/poker/betting";

function clampStack(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function sanitizeGameStacks(state: GameState): void {
  state.pot = Math.max(0, Math.floor(state.pot));
  if (!Number.isFinite(state.pot)) state.pot = 0;

  for (const player of state.players) {
    player.stack = clampStack(player.stack);
    player.currentBet = Math.max(0, Math.floor(player.currentBet));
  }

  state.currentBet = Math.max(0, Math.floor(state.currentBet));
}

function normalizeDecision(
  player: Player,
  state: GameState,
  decision: AgentDecision,
): AgentDecision {
  const toCall = amountToCall(player, state.currentBet);

  if (decision.action === "raise") {
    const raiseTotal = decision.amount ?? state.currentBet + state.bigBlind;
    if (raiseTotal <= state.currentBet) {
      if (toCall === 0) {
        return {
          action: "check",
          confidence: decision.confidence,
          reasoning: decision.reasoning,
        };
      }
      return {
        action: "call",
        amount: Math.min(toCall, player.stack),
        confidence: decision.confidence,
        reasoning: decision.reasoning,
      };
    }
    return { ...decision, amount: Math.floor(raiseTotal) };
  }

  if (decision.action === "call") {
    return {
      ...decision,
      amount: Math.min(toCall, player.stack, decision.amount ?? toCall),
    };
  }

  return decision;
}

function recordAgentDecision(
  state: GameState,
  player: Player,
  decision: AgentDecision,
  displayAmount?: number,
): void {
  const agent = getAgentById(player.id);
  const toCall = amountToCall(player, state.currentBet);
  const display = buildDecisionDisplayMeta({
    agentId: player.id,
    holeCards: player.holeCards,
    communityCards: state.communityCards,
    stage: state.stage,
    toCall,
    pressure: agentBattlePressure(state, toCall),
  });

  state.agentDecisions.push({
    agentId: player.id,
    agentName: player.name,
    strategy: agent?.strategy ?? "balanced",
    stage: state.stage,
    action: decision.action,
    amount: displayAmount ?? decision.amount,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
    ...display,
  });
}

function applyAgentBattleAction(
  state: GameState,
  player: Player,
  decision: AgentDecision,
): GameAction {
  const beforeCurrentBet = state.currentBet;
  const normalized = normalizeDecision(player, state, decision);
  const toCallBefore = amountToCall(player, beforeCurrentBet);

  let displayAmount: number | undefined;
  if (normalized.action === "raise" && normalized.amount != null) {
    displayAmount = Math.max(0, normalized.amount - beforeCurrentBet);
  } else if (normalized.action === "call") {
    displayAmount = Math.min(toCallBefore, player.stack);
  }

  recordAgentDecision(state, player, normalized, displayAmount);

  const betting: BettingDecision = {
    action: normalized.action,
    amount: normalized.amount,
    message: formatAgentBattleLogMessage(
      player.name,
      player.id,
      normalized,
      toCallBefore,
      displayAmount,
      state.stage,
    ),
  };

  const action = applyAction(state, player.id, betting);

  if (state.agentBattleMeta && action.amount != null && action.amount > 0) {
    recordAgentBattleContribution(
      state.agentBattleMeta,
      player.id,
      action.amount,
    );
  }

  sanitizeGameStacks(state);
  return action;
}

/** Agent Battle preflop only — personality-driven sizing, no Human vs AI path. */
export function runAgentBattlePreflopRound(state: GameState): void {
  state.stage = "preflop";
  resetRoundBets(state.players);

  let safety = 0;
  let preflopRaises = 0;
  while (!bettingRoundComplete(state) && safety < 12) {
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

      let decision = getAgentBattlePreflopDecision(player, state);
      if (preflopRaises >= 5 && decision.action === "raise") {
        const toCall = amountToCall(player, state.currentBet);
        decision =
          toCall > 0 && toCall <= player.stack - 1
            ? {
                action: "call",
                amount: toCall,
                confidence: decision.confidence * 0.9,
                reasoning: "cap reached — calling to keep the pot moving",
              }
            : {
                action: "fold",
                confidence: decision.confidence * 0.85,
                reasoning: "cap reached — releasing vs oversized pressure",
              };
      }

      const action = applyAgentBattleAction(state, player, decision);
      if (action.action === "raise") preflopRaises += 1;

      if (getActivePlayers(state).length <= 1) break;
    }
  }

  sanitizeGameStacks(state);
}

function logStreetDeal(state: GameState, stage: GameStage, message: string): void {
  state.actionLog.push({
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage,
    message,
    timestamp: Date.now(),
  });
}

function dealAgentBattleFlop(state: GameState): void {
  if (state.communityCards.length > 0) return;
  const { dealt, remaining } = dealCards(state.deck, 3);
  state.communityCards = dealt;
  state.deck = remaining;
  state.stage = "flop";
  logStreetDeal(state, "flop", `Flop dealt: ${formatCards(dealt)}.`);
}

function dealAgentBattleTurn(state: GameState): void {
  if (state.communityCards.length !== 3) return;
  const { dealt, remaining } = dealCards(state.deck, 1);
  state.communityCards.push(...dealt);
  state.deck = remaining;
  state.stage = "turn";
  logStreetDeal(
    state,
    "turn",
    `Turn dealt: ${formatCards(state.communityCards.slice(3, 4))}.`,
  );
}

function dealAgentBattleRiver(state: GameState): void {
  if (state.communityCards.length !== 4) return;
  const { dealt, remaining } = dealCards(state.deck, 1);
  state.communityCards.push(...dealt);
  state.deck = remaining;
  state.stage = "river";
  logStreetDeal(
    state,
    "river",
    `River dealt: ${formatCards(state.communityCards.slice(4, 5))}.`,
  );
}

/** One lightweight betting pass per postflop street (Agent Battle only). */
export function runAgentBattleStreetRound(state: GameState): void {
  resetRoundBets(state.players);
  state.currentBet = 0;

  let streetRaises = 0;
  let safety = 0;
  const playersToAct = new Set(getActivePlayers(state).map((player) => player.id));

  while (playersToAct.size > 0 && safety < 24) {
    safety += 1;

    if (getActivePlayers(state).length <= 1) {
      playersToAct.clear();
      break;
    }

    let progress = false;

    for (const player of getActivePlayers(state)) {
      if (!playersToAct.has(player.id)) continue;
      if (player.hasFolded || player.isAllIn) {
        playersToAct.delete(player.id);
        continue;
      }

      let decision = getAgentBattlePostflopDecision(player, state);

      if (streetRaises >= 1 && decision.action === "raise") {
        const toCall = amountToCall(player, state.currentBet);
        decision =
          toCall > 0 && toCall <= player.stack
            ? {
                action: "call",
                amount: toCall,
                confidence: decision.confidence * 0.9,
                reasoning: "street cap — calling after a bet",
              }
            : toCall === 0
              ? {
                  action: "check",
                  confidence: decision.confidence * 0.85,
                  reasoning: "street cap — checking it down",
                }
              : {
                  action: "fold",
                  confidence: decision.confidence * 0.85,
                  reasoning: "street cap — folding to pressure",
                };
      }

      const action = applyAgentBattleAction(state, player, decision);
      playersToAct.delete(player.id);
      progress = true;

      if (action.action === "raise") {
        streetRaises += 1;
        for (const responder of getActivePlayers(state)) {
          if (responder.id === player.id) continue;
          const toCall = amountToCall(responder, state.currentBet);
          if (toCall > 0 || responder.currentBet !== state.currentBet) {
            playersToAct.add(responder.id);
          }
        }
      }

      if (getActivePlayers(state).length <= 1) {
        playersToAct.clear();
        break;
      }
    }

    if (!progress) break;
  }

  sanitizeGameStacks(state);
}

function runAgentBattleStreetSequence(
  state: GameState,
  deal: () => void,
): void {
  if (state.players.filter((p) => !p.hasFolded).length <= 1) return;
  deal();
  runAgentBattleStreetRound(state);
}

/** Flop → turn → river with one betting round per street. */
export function runAgentBattlePostflopStreets(state: GameState): void {
  runAgentBattleStreetSequence(state, () => dealAgentBattleFlop(state));
  if (state.players.filter((p) => !p.hasFolded).length <= 1) return;

  runAgentBattleStreetSequence(state, () => dealAgentBattleTurn(state));
  if (state.players.filter((p) => !p.hasFolded).length <= 1) return;

  runAgentBattleStreetSequence(state, () => dealAgentBattleRiver(state));
}

/**
 * Deal remaining board cards when a hand ends by fold — spectator display only.
 * No betting, no stack/pot changes, winner unchanged.
 */
export function completeAgentBattleSpectatorBoard(state: GameState): boolean {
  if (getActivePlayers(state).length !== 1) return false;
  if (state.communityCards.length >= 5) return false;

  const before = state.communityCards.length;

  if (before < 3) dealAgentBattleFlop(state);
  if (state.communityCards.length < 4) dealAgentBattleTurn(state);
  if (state.communityCards.length < 5) dealAgentBattleRiver(state);

  if (state.communityCards.length === 5 && before < 5) {
    state.actionLog.push({
      playerId: "system",
      playerName: "Arena",
      action: "deal",
      stage: "showdown",
      message: "Board completed for spectator display.",
      timestamp: Date.now(),
    });
    return true;
  }

  return false;
}
