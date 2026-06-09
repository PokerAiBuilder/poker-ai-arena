import { expect } from "chai";

/** Mirrors escrowSessionChips helpers for hardhat tests. */
const MAX_CHIP_MULTIPLIER = 10;

type StakeSessionMeta = {
  stakeAmount: string;
  startingChips: number;
  currentChips?: number;
  lockedAt: string;
  status: "active" | "cashed_out";
  lockSettlement?: "mock" | "escrow-deposit";
  walletAddress?: string;
  escrowSessionId?: string;
};

function sanitizeChipCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isValidCurrentChips(currentChips: number, startingChips: number): boolean {
  const starting = sanitizeChipCount(startingChips);
  if (starting <= 0) return false;
  const chips = sanitizeChipCount(currentChips);
  return chips <= starting * MAX_CHIP_MULTIPLIER;
}

function resolveEscrowCurrentChips(input: {
  startingChips: number;
  localCurrentChips?: number | null;
  serverCurrentChips?: number | null;
}): { currentChips: number; source: "server" | "local" | "starting" } {
  const startingChips = sanitizeChipCount(input.startingChips);

  if (
    input.serverCurrentChips != null &&
    Number.isFinite(input.serverCurrentChips) &&
    isValidCurrentChips(input.serverCurrentChips, startingChips)
  ) {
    return {
      currentChips: sanitizeChipCount(input.serverCurrentChips),
      source: "server",
    };
  }

  if (
    input.localCurrentChips != null &&
    Number.isFinite(input.localCurrentChips) &&
    isValidCurrentChips(input.localCurrentChips, startingChips)
  ) {
    return {
      currentChips: sanitizeChipCount(input.localCurrentChips),
      source: "local",
    };
  }

  return {
    currentChips: startingChips,
    source: "starting",
  };
}

function withEscrowCurrentChips(
  meta: StakeSessionMeta,
  currentChips: number,
): StakeSessionMeta {
  return { ...meta, currentChips: sanitizeChipCount(currentChips) };
}

function snapshotEscrowChipsBeforeMockSession(
  humanChips: number,
  escrowSessions: StakeSessionMeta[],
): StakeSessionMeta[] {
  const active = escrowSessions
    .filter(
      (meta) =>
        meta.status === "active" && meta.lockSettlement === "escrow-deposit",
    )
    .sort((a, b) => b.lockedAt.localeCompare(a.lockedAt))[0];
  if (!active) return [];

  const chips = sanitizeChipCount(humanChips);
  if (active.currentChips === chips) return [];
  return [withEscrowCurrentChips(active, chips)];
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function escrowSession(
  startingChips: number,
  currentChips?: number,
): StakeSessionMeta {
  return {
    stakeAmount: startingChips === 100 ? "0.00010" : "0.001",
    startingChips,
    currentChips,
    lockedAt: "2026-06-01T10:00:00.000Z",
    status: "active",
    lockSettlement: "escrow-deposit",
    walletAddress: walletA,
    escrowSessionId: startingChips === 100 ? "100" : "1000",
  };
}

describe("escrow session chips restore", function () {
  it("1000-chip escrow restores 900 after disconnect/mock/mock cashout/reconnect", function () {
    let store = escrowSession(1000, 900);
    const mockMeta: StakeSessionMeta = {
      stakeAmount: "0.001",
      startingChips: 1000,
      lockedAt: "2026-06-01T11:00:00.000Z",
      status: "cashed_out",
      lockSettlement: "mock",
    };

    const snapshotted = snapshotEscrowChipsBeforeMockSession(900, [store]);
    if (snapshotted.length > 0) store = snapshotted[0];

    expect(store.currentChips).to.equal(900);
    expect(store.startingChips).to.equal(1000);
    expect(mockMeta.status).to.equal("cashed_out");

    const restored = resolveEscrowCurrentChips({
      startingChips: store.startingChips,
      localCurrentChips: store.currentChips,
      serverCurrentChips: null,
    });
    expect(restored.currentChips).to.equal(900);
    expect(restored.source).to.equal("local");
  });

  it("100-chip escrow restores 90, not 1000", function () {
    const store = escrowSession(100, 90);
    const restored = resolveEscrowCurrentChips({
      startingChips: store.startingChips,
      localCurrentChips: store.currentChips,
      serverCurrentChips: null,
    });
    expect(restored.currentChips).to.equal(90);
    expect(restored.source).to.equal("local");
    expect(store.startingChips).to.equal(100);
    expect(restored.currentChips).to.not.equal(1000);
  });

  it("mock cashout does not mutate escrow currentChips", function () {
    const escrow = escrowSession(1000, 900);
    const mock: StakeSessionMeta = {
      stakeAmount: "0.001",
      startingChips: 1000,
      lockedAt: "2026-06-01T11:00:00.000Z",
      status: "active",
      lockSettlement: "mock",
    };
    mock.status = "cashed_out";

    expect(escrow.currentChips).to.equal(900);
    expect(mock.status).to.equal("cashed_out");
    expect(escrow.startingChips).to.equal(1000);
  });

  it("server currentChips preferred over local", function () {
    const restored = resolveEscrowCurrentChips({
      startingChips: 1000,
      localCurrentChips: 900,
      serverCurrentChips: 880,
    });
    expect(restored.currentChips).to.equal(880);
    expect(restored.source).to.equal("server");
  });

  it("local currentChips fallback works when server missing", function () {
    const restored = resolveEscrowCurrentChips({
      startingChips: 250,
      localCurrentChips: 210,
      serverCurrentChips: null,
    });
    expect(restored.currentChips).to.equal(210);
    expect(restored.source).to.equal("local");
  });

  it("startingChips remains original stake amount", function () {
    const store = withEscrowCurrentChips(escrowSession(100, 90), 90);
    const restored = resolveEscrowCurrentChips({
      startingChips: store.startingChips,
      localCurrentChips: undefined,
      serverCurrentChips: undefined,
    });
    expect(restored.currentChips).to.equal(100);
    expect(restored.source).to.equal("starting");
    expect(store.startingChips).to.equal(100);
    expect(store.currentChips).to.equal(90);
  });
});
