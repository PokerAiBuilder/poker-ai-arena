import { expect } from "chai";

/** Mirrors arenaLeaderboard helpers for hardhat tests. */
type ArenaServerSession = {
  walletAddress: string;
  escrowSessionId: string;
  stakeAmountWei: string;
  startingChips: number;
  currentChips: number;
  status: string;
  claimTxHash?: string;
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
  updatedAt: string;
};

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
};

function safeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function safeNetChips(currentChips: number, startingChips: number): number {
  if (!Number.isFinite(currentChips) || !Number.isFinite(startingChips)) return 0;
  return Math.floor(currentChips) - Math.floor(startingChips);
}

function computeWinRateFromRecord(wins: number, handsPlayed: number): number {
  const hands = safeNonNegativeInt(handsPlayed);
  if (hands <= 0) return 0;
  const safeWins = safeNonNegativeInt(wins);
  return Math.round((safeWins / hands) * 1000) / 10;
}

function formatLeaderboardWalletAddress(walletAddress: string): string {
  const trimmed = walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return "Unknown";
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function parseWeiString(value: string): bigint {
  try {
    if (!/^\d+$/.test(value)) return BigInt(0);
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

function estimateSessionClaimedWei(session: ArenaServerSession): bigint {
  const hasClaim =
    Boolean(session.claimTxHash) ||
    session.status === "claimed" ||
    session.status === "closed";
  if (!hasClaim) return BigInt(0);

  const stakeWei = parseWeiString(session.stakeAmountWei);
  const starting = safeNonNegativeInt(session.startingChips);
  const current = safeNonNegativeInt(session.currentChips);
  if (stakeWei <= BigInt(0) || starting <= 0) return BigInt(0);
  return (stakeWei * BigInt(current)) / BigInt(starting);
}

function aggregateLeaderboardEntryFromSessions(
  walletAddress: string,
  sessions: ArenaServerSession[],
): TestnetLeaderboardEntry | null {
  if (sessions.length === 0) return null;

  let currentChips = 0;
  let startingChips = 0;
  let netChips = 0;
  let totalDepositedWei = BigInt(0);
  let totalClaimedWei = BigInt(0);
  let handsPlayed = 0;
  let wins = 0;
  let losses = 0;
  let biggestPot = 0;
  let lastUpdated = sessions[0].updatedAt;

  for (const session of sessions) {
    const sessionCurrent = safeNonNegativeInt(session.currentChips);
    const sessionStarting = safeNonNegativeInt(session.startingChips);
    currentChips += sessionCurrent;
    startingChips += sessionStarting;
    netChips += safeNetChips(sessionCurrent, sessionStarting);
    totalDepositedWei += parseWeiString(session.stakeAmountWei);
    totalClaimedWei += estimateSessionClaimedWei(session);
    handsPlayed += safeNonNegativeInt(session.handsPlayed ?? 0);
    wins += safeNonNegativeInt(session.wins ?? 0);
    losses += safeNonNegativeInt(session.losses ?? 0);
    biggestPot = Math.max(biggestPot, safeNonNegativeInt(session.biggestPot ?? 0));
    if (session.updatedAt > lastUpdated) lastUpdated = session.updatedAt;
  }

  return {
    walletAddress: walletAddress.toLowerCase(),
    shortWalletAddress: formatLeaderboardWalletAddress(walletAddress),
    sessionsCount: sessions.length,
    handsPlayed,
    wins,
    losses,
    winRate: computeWinRateFromRecord(wins, handsPlayed),
    currentChips,
    startingChips,
    netChips,
    totalDepositedWei: totalDepositedWei.toString(),
    totalClaimedWei: totalClaimedWei.toString(),
    biggestPot,
    lastUpdated,
  };
}

function sortTestnetLeaderboardEntries(
  entries: TestnetLeaderboardEntry[],
): TestnetLeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.netChips !== a.netChips) return b.netChips - a.netChips;
    const claimedA = parseWeiString(a.totalClaimedWei);
    const claimedB = parseWeiString(b.totalClaimedWei);
    if (claimedB > claimedA) return 1;
    if (claimedB < claimedA) return -1;
    return b.handsPlayed - a.handsPlayed;
  });
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function session(
  wallet: string,
  id: string,
  input: Partial<ArenaServerSession> & Pick<ArenaServerSession, "currentChips" | "startingChips" | "stakeAmountWei">,
): ArenaServerSession {
  return {
    walletAddress: wallet,
    escrowSessionId: id,
    status: "active",
    updatedAt: "2026-06-01T12:00:00.000Z",
    ...input,
  };
}

describe("arena testnet leaderboard helpers", function () {
  it("aggregates leaderboard entry per wallet", function () {
    const entry = aggregateLeaderboardEntryFromSessions(walletA, [
      session(walletA, "1", {
        startingChips: 1000,
        currentChips: 900,
        stakeAmountWei: "1000000000000000",
      }),
      session(walletA, "2", {
        startingChips: 250,
        currentChips: 300,
        stakeAmountWei: "250000000000000",
        updatedAt: "2026-06-02T12:00:00.000Z",
      }),
    ]);

    expect(entry).to.not.equal(null);
    expect(entry!.sessionsCount).to.equal(2);
    expect(entry!.netChips).to.equal(-50);
    expect(entry!.currentChips).to.equal(1200);
    expect(entry!.startingChips).to.equal(1250);
    expect(entry!.shortWalletAddress).to.equal("0xaaaa…aaaa");
    expect(entry!.lastUpdated).to.equal("2026-06-02T12:00:00.000Z");
  });

  it("sorts by netChips descending", function () {
    const sorted = sortTestnetLeaderboardEntries([
      aggregateLeaderboardEntryFromSessions(walletA, [
        session(walletA, "1", {
          startingChips: 1000,
          currentChips: 800,
          stakeAmountWei: "1000000000000000",
        }),
      ])!,
      aggregateLeaderboardEntryFromSessions(walletB, [
        session(walletB, "1", {
          startingChips: 1000,
          currentChips: 1200,
          stakeAmountWei: "1000000000000000",
        }),
      ])!,
    ]);

    expect(sorted[0].walletAddress).to.equal(walletB.toLowerCase());
    expect(sorted[0].netChips).to.equal(200);
    expect(sorted[1].netChips).to.equal(-200);
  });

  it("handles empty sessions", function () {
    expect(aggregateLeaderboardEntryFromSessions(walletA, [])).to.equal(null);
    expect(sortTestnetLeaderboardEntries([])).to.deep.equal([]);
  });

  it("formats wallet address safely", function () {
    expect(formatLeaderboardWalletAddress(walletA)).to.equal("0xaaaa…aaaa");
    expect(formatLeaderboardWalletAddress("not-an-address")).to.equal("Unknown");
    expect(formatLeaderboardWalletAddress("")).to.equal("Unknown");
  });

  it("aggregates hand stats from server sessions", function () {
    const entry = aggregateLeaderboardEntryFromSessions(walletA, [
      session(walletA, "1", {
        startingChips: 1000,
        currentChips: 900,
        stakeAmountWei: "1000000000000000",
        handsPlayed: 5,
        wins: 3,
        losses: 2,
        biggestPot: 120,
      }),
    ]);

    expect(entry!.handsPlayed).to.equal(5);
    expect(entry!.wins).to.equal(3);
    expect(entry!.losses).to.equal(2);
    expect(entry!.biggestPot).to.equal(120);
    expect(entry!.winRate).to.equal(60);
  });

  it("avoids negative or NaN aggregate stats", function () {
    const entry = aggregateLeaderboardEntryFromSessions(walletA, [
      session(walletA, "1", {
        startingChips: Number.NaN,
        currentChips: Number.NaN,
        stakeAmountWei: "invalid",
      }),
    ]);

    expect(entry!.currentChips).to.equal(0);
    expect(entry!.startingChips).to.equal(0);
    expect(entry!.netChips).to.equal(0);
    expect(entry!.winRate).to.equal(0);
    expect(entry!.totalDepositedWei).to.equal("0");
    expect(entry!.totalClaimedWei).to.equal("0");
  });
});
