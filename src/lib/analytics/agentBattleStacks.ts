import { BluffBot, ChipHunter, RiverMind } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import { DEFAULT_STARTING_STACK } from "@/lib/poker/betting";
import type { SimulationResult } from "@/lib/poker/types";
import { sanitizeSessionStackValue } from "@/lib/analytics/sessionStacks";

export const AGENT_BATTLE_STACKS_STORAGE_KEY = "poker-ai-arena-agent-battle-stacks-v1";

export type AgentBattleStacksState = Record<string, number>;

const AGENT_BATTLE_PLAYER_IDS = [
  PokerMaster.id,
  BluffBot.id,
  RiverMind.id,
  ChipHunter.id,
] as const;

export function createInitialAgentBattleStacks(): AgentBattleStacksState {
  return Object.fromEntries(
    AGENT_BATTLE_PLAYER_IDS.map((id) => [id, DEFAULT_STARTING_STACK]),
  );
}

export function sanitizeAgentBattleStacks(
  stacks: AgentBattleStacksState,
): AgentBattleStacksState {
  const next = createInitialAgentBattleStacks();
  for (const id of AGENT_BATTLE_PLAYER_IDS) {
    if (id in stacks) {
      next[id] = sanitizeSessionStackValue(stacks[id]);
    }
  }
  return next;
}

/** Agents with at least 1 chip — required to run Agent Battle. */
export function countAgentBattlePlayersWithChips(
  stacks: AgentBattleStacksState,
): number {
  const sanitized = sanitizeAgentBattleStacks(stacks);
  return AGENT_BATTLE_PLAYER_IDS.filter((id) => sanitized[id] > 0).length;
}

/**
 * Agent Battle cannot run when fewer than 2 agents have chips, or any agent
 * is busted (0 chips). Requires reset before the next spectator hand.
 */
export function isAgentBattleStackDepleted(
  stacks: AgentBattleStacksState,
): boolean {
  const sanitized = sanitizeAgentBattleStacks(stacks);
  if (countAgentBattlePlayersWithChips(sanitized) < 2) {
    return true;
  }
  return AGENT_BATTLE_PLAYER_IDS.some((id) => sanitized[id] <= 0);
}

export function canRunAgentBattle(stacks: AgentBattleStacksState): boolean {
  return !isAgentBattleStackDepleted(stacks);
}

export function resetAgentBattleStacks(): AgentBattleStacksState {
  return createInitialAgentBattleStacks();
}

export function loadAgentBattleStacks(): AgentBattleStacksState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AGENT_BATTLE_STACKS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      clearAgentBattleStacks();
      return null;
    }
    return sanitizeAgentBattleStacks(parsed as AgentBattleStacksState);
  } catch {
    clearAgentBattleStacks();
    return null;
  }
}

export function saveAgentBattleStacks(stacks: AgentBattleStacksState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      AGENT_BATTLE_STACKS_STORAGE_KEY,
      JSON.stringify(sanitizeAgentBattleStacks(stacks)),
    );
  } catch (error) {
    console.warn("[analytics/agentBattleStacks] save failed", error);
  }
}

export function clearAgentBattleStacks(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(AGENT_BATTLE_STACKS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Apply authoritative final stacks from an Agent Battle hand result. */
export function updateAgentBattleStacksAfterHand(
  current: AgentBattleStacksState,
  result: SimulationResult,
): AgentBattleStacksState {
  if (result.gameMode !== "agent-vs-agent") {
    return sanitizeAgentBattleStacks(current);
  }

  const next = sanitizeAgentBattleStacks({ ...current });
  const authoritative =
    result.agentBattleAccounting?.finalStacks ??
    Object.fromEntries(result.players.map((player) => [player.id, player.stack]));

  for (const id of AGENT_BATTLE_PLAYER_IDS) {
    if (id in authoritative) {
      next[id] = sanitizeSessionStackValue(authoritative[id]);
    }
  }

  return sanitizeAgentBattleStacks(next);
}
