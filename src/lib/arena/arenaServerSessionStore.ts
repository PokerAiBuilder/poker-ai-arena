import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";

export type ArenaServerSessionStore = {
  get(walletAddress: string, escrowSessionId: string): ArenaServerSession | null;
  listAll(): ArenaServerSession[];
  upsert(session: ArenaServerSession): ArenaServerSession;
  patch(
    walletAddress: string,
    escrowSessionId: string,
    update: Partial<
      Pick<
        ArenaServerSession,
        | "currentChips"
        | "status"
        | "resolveTxHash"
        | "claimTxHash"
        | "startingChips"
        | "handsPlayed"
        | "wins"
        | "losses"
        | "biggestPot"
      >
    >,
  ): ArenaServerSession | null;
};

const GLOBAL_STORE_KEY = "__POKER_AI_ARENA_SERVER_SESSION_STORE__";

type MemoryStoreState = {
  sessions: Map<string, ArenaServerSession>;
};

function sessionKey(walletAddress: string, escrowSessionId: string): string {
  return `${walletAddress.toLowerCase()}:${escrowSessionId}`;
}

function getMemoryStoreState(): MemoryStoreState {
  const globalScope = globalThis as typeof globalThis & {
    [GLOBAL_STORE_KEY]?: MemoryStoreState;
  };
  if (!globalScope[GLOBAL_STORE_KEY]) {
    globalScope[GLOBAL_STORE_KEY] = { sessions: new Map() };
  }
  return globalScope[GLOBAL_STORE_KEY];
}

export function createMemoryArenaServerSessionStore(): ArenaServerSessionStore {
  const state = getMemoryStoreState();

  return {
    get(walletAddress, escrowSessionId) {
      return state.sessions.get(sessionKey(walletAddress, escrowSessionId)) ?? null;
    },

    listAll() {
      return Array.from(state.sessions.values());
    },

    upsert(session) {
      const key = sessionKey(session.walletAddress, session.escrowSessionId);
      const existing = state.sessions.get(key);
      const now = new Date().toISOString();
      const next: ArenaServerSession = {
        ...session,
        walletAddress: session.walletAddress.toLowerCase(),
        createdAt: existing?.createdAt ?? session.createdAt ?? now,
        updatedAt: now,
      };
      state.sessions.set(key, next);
      return next;
    },

    patch(walletAddress, escrowSessionId, update) {
      const key = sessionKey(walletAddress, escrowSessionId);
      const existing = state.sessions.get(key);
      if (!existing) return null;

      const next: ArenaServerSession = {
        ...existing,
        ...update,
        updatedAt: new Date().toISOString(),
      };
      state.sessions.set(key, next);
      return next;
    },
  };
}

let defaultStore: ArenaServerSessionStore | null = null;

export function getArenaServerSessionStore(): ArenaServerSessionStore {
  if (!defaultStore) {
    defaultStore = createMemoryArenaServerSessionStore();
  }
  return defaultStore;
}

/** Test helper — swap or reset the default store. */
export function setArenaServerSessionStoreForTests(
  store: ArenaServerSessionStore | null,
): void {
  defaultStore = store;
}
