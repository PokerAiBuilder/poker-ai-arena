import type { SessionStats } from "@/lib/analytics/types";
import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";
import { computeNetChips, computeWinRate } from "@/lib/analytics/playerSessionStats";
import { getShortAddress } from "@/lib/onchain/baseSepolia";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { isStakeSessionActive } from "@/lib/stake/stakeSessionStorage";
import { testStakeAmountToWei } from "@/lib/stake/testnetStake";

export type LeaderboardEntrySource = "server" | "local-preview";

export type TestnetLeaderboardEntry = {
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
  source?: LeaderboardEntrySource;
  previewLabel?: string;
};

export const TESTNET_LEADERBOARD_DEFAULT_LIMIT = 10;

export const TESTNET_LEADERBOARD_STORE_TODO =
  "TODO: persist hand history + global leaderboard in DB/Prisma — current rankings use in-memory server sessions only.";

function safeNonNegativeInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function safeNetChips(currentChips: number, startingChips: number): number {
  if (!Number.isFinite(currentChips) || !Number.isFinite(startingChips)) return 0;
  return Math.floor(currentChips) - Math.floor(startingChips);
}

export function computeWinRateFromRecord(wins: number, handsPlayed: number): number {
  const hands = safeNonNegativeInt(handsPlayed);
  if (hands <= 0) return 0;
  const safeWins = safeNonNegativeInt(wins);
  return Math.round((safeWins / hands) * 1000) / 10;
}

export function formatLeaderboardWalletAddress(
  walletAddress: string,
): string {
  const trimmed = walletAddress.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return "Unknown";
  return getShortAddress(trimmed);
}

function parseWeiString(value: string): bigint {
  try {
    if (!/^\d+$/.test(value)) return BigInt(0);
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

/** Demo estimate for claimed wei when only deposit + chip ratio is known on server session. */
export function estimateSessionClaimedWei(session: ArenaServerSession): bigint {
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

export function aggregateLeaderboardEntryFromSessions(
  walletAddress: string,
  sessions: ArenaServerSession[],
): TestnetLeaderboardEntry | null {
  if (sessions.length === 0) return null;

  const normalizedWallet = walletAddress.toLowerCase();
  let currentChips = 0;
  let startingChips = 0;
  let netChips = 0;
  let totalDepositedWei = BigInt(0);
  let totalClaimedWei = BigInt(0);
  let lastUpdated = sessions[0].updatedAt;

  let handsPlayed = 0;
  let wins = 0;
  let losses = 0;
  let biggestPot = 0;

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

    if (session.updatedAt > lastUpdated) {
      lastUpdated = session.updatedAt;
    }
  }

  return {
    walletAddress: normalizedWallet,
    shortWalletAddress: formatLeaderboardWalletAddress(normalizedWallet),
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
    source: "server",
  };
}

export function buildLeaderboardPreviewFromLocal(input: {
  stakeSessionMeta: StakeSessionMeta;
  sessionStats: SessionStats;
  currentChips: number;
  startingChips: number;
}): TestnetLeaderboardEntry | null {
  const meta = input.stakeSessionMeta;
  if (meta.lockSettlement !== "escrow-deposit") return null;
  if (!isStakeSessionActive(meta)) return null;
  if (!meta.walletAddress) return null;

  const walletAddress = meta.walletAddress.toLowerCase();
  const currentChips = safeNonNegativeInt(input.currentChips);
  const startingChips = safeNonNegativeInt(input.startingChips);
  const handsPlayed = safeNonNegativeInt(
    input.sessionStats.humanHandsPlayed ?? input.sessionStats.totalGames ?? 0,
  );
  const wins = safeNonNegativeInt(input.sessionStats.humanWins ?? 0);
  const losses = safeNonNegativeInt(input.sessionStats.humanLosses ?? 0);
  const biggestPot = safeNonNegativeInt(input.sessionStats.biggestPot ?? 0);

  return {
    walletAddress,
    shortWalletAddress: formatLeaderboardWalletAddress(walletAddress),
    sessionsCount: 1,
    handsPlayed,
    wins,
    losses,
    winRate: computeWinRate(wins, handsPlayed),
    currentChips,
    startingChips,
    netChips: computeNetChips(currentChips, startingChips),
    totalDepositedWei: testStakeAmountToWei(meta.stakeAmount),
    totalClaimedWei: "0",
    biggestPot,
    lastUpdated: new Date().toISOString(),
    source: "local-preview",
    previewLabel: "Current session",
  };
}

function mergeLeaderboardEntry(
  server: TestnetLeaderboardEntry,
  preview: TestnetLeaderboardEntry,
): TestnetLeaderboardEntry {
  return {
    ...server,
    currentChips: Math.max(server.currentChips, preview.currentChips),
    startingChips: Math.max(server.startingChips, preview.startingChips),
    netChips:
      Math.max(server.currentChips, preview.currentChips) -
      Math.max(server.startingChips, preview.startingChips),
    handsPlayed: Math.max(server.handsPlayed, preview.handsPlayed),
    wins: Math.max(server.wins, preview.wins),
    losses: Math.max(server.losses, preview.losses),
    winRate: computeWinRateFromRecord(
      Math.max(server.wins, preview.wins),
      Math.max(server.handsPlayed, preview.handsPlayed),
    ),
    biggestPot: Math.max(server.biggestPot, preview.biggestPot),
    lastUpdated:
      preview.lastUpdated > server.lastUpdated
        ? preview.lastUpdated
        : server.lastUpdated,
    source: "server",
  };
}

export function mergeLeaderboardWithLocalPreview(
  serverEntries: TestnetLeaderboardEntry[],
  preview: TestnetLeaderboardEntry | null,
): TestnetLeaderboardEntry[] {
  if (!preview) return sortTestnetLeaderboardEntries(serverEntries);

  const wallet = preview.walletAddress.toLowerCase();
  const existingIndex = serverEntries.findIndex(
    (entry) => entry.walletAddress.toLowerCase() === wallet,
  );

  if (existingIndex >= 0) {
    const merged = [...serverEntries];
    merged[existingIndex] = mergeLeaderboardEntry(
      merged[existingIndex],
      preview,
    );
    return sortTestnetLeaderboardEntries(merged);
  }

  return sortTestnetLeaderboardEntries([preview, ...serverEntries]);
}

export function shouldShowLeaderboardEmptyState(
  entries: TestnetLeaderboardEntry[],
  preview: TestnetLeaderboardEntry | null,
): boolean {
  return entries.length === 0 && preview == null;
}

export function getDepositedEthLabel(
  stakeSessionMeta: StakeSessionMeta | null | undefined,
): "Wallet deposited" | "Session stake" {
  if (stakeSessionMeta?.lockSettlement === "escrow-deposit") {
    return "Wallet deposited";
  }
  return "Session stake";
}

export function buildTestnetLeaderboardFromSessions(
  sessions: ArenaServerSession[],
): TestnetLeaderboardEntry[] {
  const byWallet = new Map<string, ArenaServerSession[]>();

  for (const session of sessions) {
    const wallet = session.walletAddress.toLowerCase();
    const bucket = byWallet.get(wallet) ?? [];
    bucket.push(session);
    byWallet.set(wallet, bucket);
  }

  const entries: TestnetLeaderboardEntry[] = [];

  for (const [wallet, walletSessions] of byWallet) {
    const entry = aggregateLeaderboardEntryFromSessions(wallet, walletSessions);
    if (entry) entries.push(entry);
  }

  return sortTestnetLeaderboardEntries(entries);
}

export function sortTestnetLeaderboardEntries(
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

export function takeTopLeaderboardEntries(
  entries: TestnetLeaderboardEntry[],
  limit = TESTNET_LEADERBOARD_DEFAULT_LIMIT,
): TestnetLeaderboardEntry[] {
  const safeLimit = safeNonNegativeInt(limit);
  if (safeLimit <= 0) return [];
  return sortTestnetLeaderboardEntries(entries).slice(0, safeLimit);
}

export function formatLeaderboardLastActive(iso: string): string {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return "—";

  const diff = Date.now() - parsed;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `${minutes}m ago`;
  }
  if (diff < 86_400_000) {
    const hours = Math.max(1, Math.floor(diff / 3_600_000));
    return `${hours}h ago`;
  }

  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}
