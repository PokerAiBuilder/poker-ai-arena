import { expect } from "chai";

/** Mirrors leaderboard preview/merge helpers for hardhat tests. */
type TestnetLeaderboardEntry = {
  walletAddress: string;
  shortWalletAddress: string;
  sessionsCount: number;
  handsPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  currentChips: number;
  startingChips: number;
  netChips: number;
  totalDepositedWei: string;
  totalClaimedWei: string;
  biggestPot: number;
  lastUpdated: string;
  source?: "server" | "local-preview";
  previewLabel?: string;
};

type StakeSessionMeta = {
  stakeAmount: string;
  startingChips: number;
  lockedAt: string;
  status: "active" | "cashed_out";
  lockSettlement?: "escrow-deposit" | "mock";
  walletAddress?: string;
};

type SessionStats = {
  totalGames: number;
  humanHandsPlayed?: number;
  humanWins?: number;
  humanLosses?: number;
  biggestPot: number;
};

function computeNetChips(currentChips: number, startingChips: number): number {
  return Math.floor(currentChips) - Math.floor(startingChips);
}

function computeWinRate(wins: number, handsPlayed: number): number {
  if (handsPlayed <= 0) return 0;
  return Math.round((wins / handsPlayed) * 1000) / 10;
}

function buildLeaderboardPreviewFromLocal(input: {
  stakeSessionMeta: StakeSessionMeta;
  sessionStats: SessionStats;
  currentChips: number;
  startingChips: number;
}): TestnetLeaderboardEntry | null {
  const meta = input.stakeSessionMeta;
  if (meta.lockSettlement !== "escrow-deposit") return null;
  if (meta.status !== "active") return null;
  if (!meta.walletAddress) return null;

  const handsPlayed = input.sessionStats.humanHandsPlayed ?? 0;
  const wins = input.sessionStats.humanWins ?? 0;
  const losses = input.sessionStats.humanLosses ?? 0;

  return {
    walletAddress: meta.walletAddress.toLowerCase(),
    shortWalletAddress: "0xaaaa…aaaa",
    sessionsCount: 1,
    handsPlayed,
    wins,
    losses,
    winRate: computeWinRate(wins, handsPlayed),
    currentChips: input.currentChips,
    startingChips: input.startingChips,
    netChips: computeNetChips(input.currentChips, input.startingChips),
    totalDepositedWei: "1000000000000000",
    totalClaimedWei: "0",
    biggestPot: input.sessionStats.biggestPot,
    lastUpdated: "2026-06-03T00:00:00.000Z",
    source: "local-preview",
    previewLabel: "Current session",
  };
}

function mergeLeaderboardWithLocalPreview(
  serverEntries: TestnetLeaderboardEntry[],
  preview: TestnetLeaderboardEntry | null,
): TestnetLeaderboardEntry[] {
  if (!preview) return serverEntries;
  const wallet = preview.walletAddress.toLowerCase();
  const existing = serverEntries.find((e) => e.walletAddress === wallet);
  if (existing) {
    return serverEntries.map((entry) =>
      entry.walletAddress === wallet
        ? {
            ...entry,
            handsPlayed: Math.max(entry.handsPlayed, preview.handsPlayed),
            wins: Math.max(entry.wins, preview.wins),
            netChips: preview.netChips,
            currentChips: preview.currentChips,
          }
        : entry,
    );
  }
  return [preview, ...serverEntries];
}

function shouldShowLeaderboardEmptyState(
  entries: TestnetLeaderboardEntry[],
  preview: TestnetLeaderboardEntry | null,
): boolean {
  return entries.length === 0 && preview == null;
}

function getDepositedEthLabel(
  meta: StakeSessionMeta | null | undefined,
): "Wallet deposited" | "Session stake" {
  return meta?.lockSettlement === "escrow-deposit"
    ? "Wallet deposited"
    : "Session stake";
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

describe("arena leaderboard preview helpers", function () {
  const activeEscrowMeta: StakeSessionMeta = {
    stakeAmount: "0.001",
    startingChips: 1000,
    lockedAt: "2026-06-01T00:00:00.000Z",
    status: "active",
    lockSettlement: "escrow-deposit",
    walletAddress: walletA,
  };

  const sessionStats: SessionStats = {
    totalGames: 4,
    humanHandsPlayed: 4,
    humanWins: 2,
    humanLosses: 2,
    biggestPot: 80,
  };

  it("current wallet preview appears when API leaderboard is empty", function () {
    const preview = buildLeaderboardPreviewFromLocal({
      stakeSessionMeta: activeEscrowMeta,
      sessionStats,
      currentChips: 900,
      startingChips: 1000,
    });

    const merged = mergeLeaderboardWithLocalPreview([], preview);
    expect(merged).to.have.length(1);
    expect(merged[0].source).to.equal("local-preview");
    expect(merged[0].previewLabel).to.equal("Current session");
    expect(merged[0].netChips).to.equal(-100);
  });

  it("server session entry merges with local preview stats", function () {
    const preview = buildLeaderboardPreviewFromLocal({
      stakeSessionMeta: activeEscrowMeta,
      sessionStats,
      currentChips: 900,
      startingChips: 1000,
    })!;

    const serverEntry: TestnetLeaderboardEntry = {
      ...preview,
      source: "server",
      previewLabel: undefined,
      handsPlayed: 0,
      wins: 0,
      losses: 0,
      netChips: 0,
      currentChips: 1000,
    };

    const merged = mergeLeaderboardWithLocalPreview([serverEntry], preview);
    expect(merged[0].handsPlayed).to.equal(4);
    expect(merged[0].netChips).to.equal(-100);
  });

  it("empty state only when no server entries and no preview", function () {
    expect(shouldShowLeaderboardEmptyState([], null)).to.equal(true);
    expect(
      shouldShowLeaderboardEmptyState(
        [],
        buildLeaderboardPreviewFromLocal({
          stakeSessionMeta: activeEscrowMeta,
          sessionStats,
          currentChips: 900,
          startingChips: 1000,
        }),
      ),
    ).to.equal(false);
  });

  it("deposited label uses wallet meaning for escrow", function () {
    expect(getDepositedEthLabel(activeEscrowMeta)).to.equal("Wallet deposited");
    expect(getDepositedEthLabel({ ...activeEscrowMeta, lockSettlement: "mock" })).to.equal(
      "Session stake",
    );
  });
});
