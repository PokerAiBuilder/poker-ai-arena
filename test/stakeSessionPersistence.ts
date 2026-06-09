import { expect } from "chai";

/** Mirrors stakeSessionPersistence helpers for hardhat tests. */
type StakeSessionMeta = {
  stakeAmount: string;
  startingChips: number;
  lockedAt: string;
  status: "active" | "cashed_out";
  lockSettlement?: "mock" | "base-sepolia-test-tx" | "escrow-deposit";
  walletAddress?: string;
  escrowSessionId?: string;
  lockTxHash?: string;
};

function normalizeWalletAddress(address?: string | null): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function isStakeSessionActive(meta: StakeSessionMeta | null | undefined): boolean {
  return meta?.status === "active";
}

function isMockLockSettlement(meta: StakeSessionMeta): boolean {
  return meta.lockSettlement === "mock";
}

function isWalletBackedLockSettlement(meta: StakeSessionMeta): boolean {
  return (
    meta.lockSettlement === "escrow-deposit" ||
    meta.lockSettlement === "base-sepolia-test-tx"
  );
}

function walletBackedSessionKey(meta: StakeSessionMeta): string | null {
  if (!isWalletBackedLockSettlement(meta)) return null;
  const wallet = normalizeWalletAddress(meta.walletAddress);
  if (!wallet) return null;
  const sessionId = meta.escrowSessionId ?? meta.lockTxHash;
  if (!sessionId) return null;
  return `${wallet}:${sessionId}`;
}

function findActiveEscrowForWallet(
  sessions: StakeSessionMeta[],
  walletAddress?: string | null,
): StakeSessionMeta | null {
  const wallet = normalizeWalletAddress(walletAddress);
  if (!wallet) return null;

  const matches = sessions.filter(
    (meta) =>
      isStakeSessionActive(meta) &&
      isWalletBackedLockSettlement(meta) &&
      normalizeWalletAddress(meta.walletAddress) === wallet,
  );

  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.lockedAt.localeCompare(a.lockedAt))[0];
}

function findMostRecentActiveWalletBackedSession(
  sessions: StakeSessionMeta[],
): StakeSessionMeta | null {
  const active = sessions.filter(
    (meta) => isStakeSessionActive(meta) && isWalletBackedLockSettlement(meta),
  );
  if (active.length === 0) return null;
  return active.sort((a, b) => b.lockedAt.localeCompare(a.lockedAt))[0];
}

function resolveActiveStakeSession(input: {
  isConnected: boolean;
  walletAddress?: string | null;
  escrowSessions: StakeSessionMeta[];
  mockSession: StakeSessionMeta | null;
}): StakeSessionMeta | null {
  const wallet = normalizeWalletAddress(input.walletAddress);
  const activeMock =
    input.mockSession && isStakeSessionActive(input.mockSession)
      ? input.mockSession
      : null;

  if (input.isConnected && wallet) {
    const walletEscrow = findActiveEscrowForWallet(
      input.escrowSessions,
      wallet,
    );
    if (walletEscrow) return walletEscrow;
    if (activeMock) return activeMock;
    return null;
  }

  if (activeMock) return activeMock;
  return findMostRecentActiveWalletBackedSession(input.escrowSessions);
}

function canStartMockSessionWhileStored(
  isConnected: boolean,
  walletAddress: string | undefined | null,
  escrowSessions: StakeSessionMeta[],
): boolean {
  if (!isConnected || !walletAddress) return true;
  return !findActiveEscrowForWallet(escrowSessions, walletAddress);
}

type SessionStore = {
  escrow: Record<string, StakeSessionMeta>;
  mock: StakeSessionMeta | null;
};

function saveEscrow(store: SessionStore, meta: StakeSessionMeta): SessionStore {
  const key = walletBackedSessionKey(meta);
  if (!key) return store;
  return {
    ...store,
    escrow: { ...store.escrow, [key]: meta },
  };
}

function saveMock(store: SessionStore, meta: StakeSessionMeta): SessionStore {
  return { ...store, mock: meta };
}

function cashOutMock(store: SessionStore): SessionStore {
  if (!store.mock) return store;
  return {
    ...store,
    mock: { ...store.mock, status: "cashed_out" },
  };
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function escrowForWalletA(sessionId = "42"): StakeSessionMeta {
  return {
    stakeAmount: "0.001",
    startingChips: 1000,
    lockedAt: "2026-06-01T10:00:00.000Z",
    status: "active",
    lockSettlement: "escrow-deposit",
    walletAddress: walletA,
    escrowSessionId: sessionId,
  };
}

function mockSession(): StakeSessionMeta {
  return {
    stakeAmount: "0.001",
    startingChips: 1000,
    lockedAt: "2026-06-01T11:00:00.000Z",
    status: "active",
    lockSettlement: "mock",
  };
}

describe("stake session persistence", function () {
  it("escrow session survives wallet disconnect", function () {
    let store: SessionStore = { escrow: {}, mock: null };
    store = saveEscrow(store, escrowForWalletA());

    const disconnected = resolveActiveStakeSession({
      isConnected: false,
      walletAddress: walletA,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });

    expect(disconnected?.lockSettlement).to.equal("escrow-deposit");
    expect(disconnected?.walletAddress?.toLowerCase()).to.equal(walletA.toLowerCase());
    expect(store.escrow[walletBackedSessionKey(escrowForWalletA())!].status).to.equal(
      "active",
    );
  });

  it("starting mock session while disconnected does not delete escrow session", function () {
    let store: SessionStore = { escrow: {}, mock: null };
    store = saveEscrow(store, escrowForWalletA());
    store = saveMock(store, mockSession());

    expect(Object.keys(store.escrow)).to.have.length(1);
    expect(store.mock?.lockSettlement).to.equal("mock");

    const activeWhileDisconnected = resolveActiveStakeSession({
      isConnected: false,
      walletAddress: undefined,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });
    expect(activeWhileDisconnected?.lockSettlement).to.equal("mock");
    expect(store.escrow[walletBackedSessionKey(escrowForWalletA())!].status).to.equal(
      "active",
    );
  });

  it("mock cashout does not close escrow session", function () {
    let store: SessionStore = { escrow: {}, mock: null };
    store = saveEscrow(store, escrowForWalletA());
    store = saveMock(store, mockSession());
    store = cashOutMock(store);

    expect(store.mock?.status).to.equal("cashed_out");
    expect(store.escrow[walletBackedSessionKey(escrowForWalletA())!].status).to.equal(
      "active",
    );

    const afterMockCashout = resolveActiveStakeSession({
      isConnected: false,
      walletAddress: undefined,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });
    expect(afterMockCashout?.lockSettlement).to.equal("escrow-deposit");
  });

  it("reconnecting original wallet restores escrow session", function () {
    let store: SessionStore = { escrow: {}, mock: null };
    store = saveEscrow(store, escrowForWalletA());
    store = saveMock(store, mockSession());

    const reconnected = resolveActiveStakeSession({
      isConnected: true,
      walletAddress: walletA,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });

    expect(reconnected?.lockSettlement).to.equal("escrow-deposit");
    expect(reconnected?.escrowSessionId).to.equal("42");
  });

  it("wallet B does not see wallet A session", function () {
    const store: SessionStore = {
      escrow: {
        [walletBackedSessionKey(escrowForWalletA())!]: escrowForWalletA(),
      },
      mock: null,
    };

    const forWalletB = resolveActiveStakeSession({
      isConnected: true,
      walletAddress: walletB,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });

    expect(forWalletB).to.equal(null);
    expect(findActiveEscrowForWallet(Object.values(store.escrow), walletB)).to.equal(
      null,
    );
  });

  it("matching escrow session takes priority over stale mock session", function () {
    const store: SessionStore = {
      escrow: {
        [walletBackedSessionKey(escrowForWalletA())!]: escrowForWalletA(),
      },
      mock: mockSession(),
    };

    const resolved = resolveActiveStakeSession({
      isConnected: true,
      walletAddress: walletA,
      escrowSessions: Object.values(store.escrow),
      mockSession: store.mock,
    });

    expect(resolved?.lockSettlement).to.equal("escrow-deposit");
    expect(canStartMockSessionWhileStored(true, walletA, Object.values(store.escrow))).to.equal(
      false,
    );
  });
});
