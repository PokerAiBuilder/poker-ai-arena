import {
  formatAgentBattleLogMessage,
  getAgentBattlePreflopDecision,
} from "@/lib/agents/agentBattleStrategy";
import { getAgentById } from "@/lib/agents/agentRegistry";
import type { AgentDecision } from "@/lib/agents/agentTypes";
import { recordAgentBattleContribution } from "@/lib/poker/agentBattleAccounting";
import type { GameAction, GameState, Player } from "@/lib/poker/types";
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
  state.agentDecisions.push({
    agentId: player.id,
    agentName: player.name,
    strategy: agent?.strategy ?? "balanced",
    stage: state.stage,
    action: decision.action,
    amount: displayAmount ?? decision.amount,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
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
