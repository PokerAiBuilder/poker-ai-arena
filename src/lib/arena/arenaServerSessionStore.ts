import type {
  ArenaServerHandRecord,
  ArenaServerSession,
} from "@/lib/arena/arenaServerSessionTypes";
import {
  aggregateHandStatsFromHistory,
  appendRecentHands,
  buildServerHandRecord,
  type ArenaServerHandResultInput,
} from "@/lib/arena/arenaServerHandHistory";

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
        | "recentHands"
      >
    >,
  ): ArenaServerSession | null;
  appendHandResult(
    walletAddress: string,
    escrowSessionId: string,
    handInput: ArenaServerHandResultInput,
  ): ArenaServerSession | null;
  getRecentHands(
    walletAddress: string,
    escrowSessionId: string,
  ): ArenaServerHandRecord[];
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
        recentHands: session.recentHands ?? existing?.recentHands ?? [],
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

    appendHandResult(walletAddress, escrowSessionId, handInput) {
      const key = sessionKey(walletAddress, escrowSessionId);
      const existing = state.sessions.get(key);
      if (!existing) return null;

      const hand = buildServerHandRecord(
        walletAddress,
        escrowSessionId,
        handInput,
      );
      const recentHands = appendRecentHands(existing.recentHands, hand);
      const stats = aggregateHandStatsFromHistory(recentHands);

      const next: ArenaServerSession = {
        ...existing,
        recentHands,
        handsPlayed: stats.handsPlayed,
        wins: stats.wins,
        losses: stats.losses,
        biggestPot: stats.biggestPot,
        currentChips: hand.finalChips,
        updatedAt: new Date().toISOString(),
      };
      state.sessions.set(key, next);
      return next;
    },

    getRecentHands(walletAddress, escrowSessionId) {
      const session = state.sessions.get(sessionKey(walletAddress, escrowSessionId));
      return session?.recentHands ?? [];
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
