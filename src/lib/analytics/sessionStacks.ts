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

function isValidStackValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Invalid/NaN → 0. Never silently refills to default (user must reset explicitly). */
export function sanitizeSessionStackValue(value: unknown): number {
  if (!isValidStackValue(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function createInitialSessionStacks(): SessionStacksState {
  return Object.fromEntries(
    TRACKED_PLAYER_IDS.map((id) => [id, DEFAULT_STARTING_STACK]),
  );
}

/** Clamp stored values; missing keys keep first-session defaults. */
export function sanitizeSessionStacks(
  stacks: SessionStacksState,
): SessionStacksState {
  const next = createInitialSessionStacks();
  for (const id of TRACKED_PLAYER_IDS) {
    if (id in stacks) {
      next[id] = sanitizeSessionStackValue(stacks[id]);
    }
  }
  return next;
}

export function isHeadsUpStackDepleted(stacks: SessionStacksState): boolean {
  const sanitized = sanitizeSessionStacks(stacks);
  return sanitized.human <= 0 || sanitized[PokerMaster.id] <= 0;
}

export function canStartHeadsUpHand(stacks: SessionStacksState): boolean {
  return !isHeadsUpStackDepleted(stacks);
}

/** User-triggered reset — Human vs AI demo stacks only. */
export function resetHeadsUpDemoStacks(
  stacks: SessionStacksState,
): SessionStacksState {
  return sanitizeSessionStacks({
    ...stacks,
    human: DEFAULT_STARTING_STACK,
    [PokerMaster.id]: DEFAULT_STARTING_STACK,
  });
}

function stacksChanged(
  before: SessionStacksState,
  after: SessionStacksState,
): boolean {
  return TRACKED_PLAYER_IDS.some((id) => before[id] !== after[id]);
}

function mergeLoadedStacks(raw: Record<string, unknown>): SessionStacksState {
  const merged = createInitialSessionStacks();
  for (const id of TRACKED_PLAYER_IDS) {
    if (id in raw) {
      merged[id] = sanitizeSessionStackValue(raw[id]);
    }
  }
  return merged;
}

function isSessionStacksState(value: unknown): value is SessionStacksState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return TRACKED_PLAYER_IDS.every((id) => isValidStackValue(record[id]));
}

export function loadSessionStacks(): SessionStacksState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_STACKS_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);

    let fromStorage: SessionStacksState;
    if (isSessionStacksState(parsed)) {
      fromStorage = sanitizeSessionStacks(parsed);
    } else if (parsed && typeof parsed === "object") {
      fromStorage = mergeLoadedStacks(parsed as Record<string, unknown>);
    } else {
      clearSessionStacks();
      return null;
    }

    if (!isSessionStacksState(parsed) || stacksChanged(parsed as SessionStacksState, fromStorage)) {
      saveSessionStacks(fromStorage);
    }

    return fromStorage;
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
      JSON.stringify(sanitizeSessionStacks(stacks)),
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
  const next = sanitizeSessionStacks({ ...current });

  for (const player of result.players) {
    const prior = next[player.id] ?? DEFAULT_STARTING_STACK;
    const delta = player.stack - DEFAULT_STARTING_STACK;
    next[player.id] = sanitizeSessionStackValue(prior + delta);
  }

  return sanitizeSessionStacks(next);
}
