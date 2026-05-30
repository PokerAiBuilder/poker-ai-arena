import { BluffBot, ChipHunter, RiverMind } from "@/lib/agents/agentRegistry";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import { DEFAULT_STARTING_STACK } from "@/lib/poker/betting";
import type { SimulationResult } from "@/lib/poker/types";

export const SESSION_STACKS_STORAGE_KEY = "poker-ai-arena-stacks-v1";

export type SessionStacksState = Record<string, number>;

const TRACKED_PLAYER_IDS = [
  "human",
  PokerMaster.id,
  BluffBot.id,
  RiverMind.id,
  ChipHunter.id,
] as const;

export function createInitialSessionStacks(): SessionStacksState {
  return Object.fromEntries(
    TRACKED_PLAYER_IDS.map((id) => [id, DEFAULT_STARTING_STACK]),
  );
}

function isSessionStacksState(value: unknown): value is SessionStacksState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return TRACKED_PLAYER_IDS.every(
    (id) => typeof record[id] === "number" && Number.isFinite(record[id]),
  );
}

export function loadSessionStacks(): SessionStacksState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STACKS_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isSessionStacksState(parsed)) {
      clearSessionStacks();
      return null;
    }

    return parsed;
  } catch {
    clearSessionStacks();
    return null;
  }
}

export function saveSessionStacks(stacks: SessionStacksState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      SESSION_STACKS_STORAGE_KEY,
      JSON.stringify(stacks),
    );
  } catch (error) {
    console.warn("[analytics/sessionStacks] save failed", error);
  }
}

export function clearSessionStacks(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(SESSION_STACKS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Applies each hand's chip change to session stacks. The engine still starts
 * every simulation at DEFAULT_STARTING_STACK; we add the per-hand delta so the
 * table shows cumulative session demo values.
 */
export function updateSessionStacksAfterGame(
  current: SessionStacksState,
  result: SimulationResult,
): SessionStacksState {
  const next = { ...current };

  for (const player of result.players) {
    const prior = next[player.id] ?? DEFAULT_STARTING_STACK;
    const delta = player.stack - DEFAULT_STARTING_STACK;
    next[player.id] = prior + delta;
  }

  return next;
}
