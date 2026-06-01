import type { CachedSharedAgentBattleHand } from "@/lib/arena/sharedAgentBattleTypes";

/**
 * Persistence layer for the active shared Agent Battle hand.
 * A future Redis/DB implementation can replace the default memory store.
 */
export type SharedAgentBattleStore = {
  getCurrent(): CachedSharedAgentBattleHand | null;
  setCurrent(hand: CachedSharedAgentBattleHand): void;
  clear(): void;
};

const GLOBAL_STORE_KEY = "__POKER_AI_SHARED_AGENT_BATTLE_STORE__";

type MemoryStoreState = {
  current: CachedSharedAgentBattleHand | null;
};

function getMemoryStoreState(): MemoryStoreState {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: MemoryStoreState;
  };
  if (!globalScope[GLOBAL_STORE_KEY]) {
    globalScope[GLOBAL_STORE_KEY] = { current: null };
  }
  return globalScope[GLOBAL_STORE_KEY];
}

/** In-process store — survives Next.js dev HMR via `globalThis`. */
export function createMemorySharedAgentBattleStore(): SharedAgentBattleStore {
  const state = getMemoryStoreState();
  return {
    getCurrent: () => state.current,
    setCurrent: (hand) => {
      state.current = hand;
    },
    clear: () => {
      state.current = null;
    },
  };
}

let defaultStore: SharedAgentBattleStore | null = null;

export function getSharedAgentBattleStore(): SharedAgentBattleStore {
  if (!defaultStore) {
    defaultStore = createMemorySharedAgentBattleStore();
  }
  return defaultStore;
}

/** Test helper — swap or reset the default store. */
export function setSharedAgentBattleStoreForTests(
  store: SharedAgentBattleStore | null,
): void {
  defaultStore = store;
}
