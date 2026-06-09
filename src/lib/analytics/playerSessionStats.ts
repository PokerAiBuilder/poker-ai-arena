import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";
import type { HandHistoryRecord } from "@/lib/arena/handHistory";
import type { SessionStats } from "@/lib/analytics/types";
import { getTestStakeTier } from "@/lib/stake/testnetStake";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { loadStakeSessionHistory } from "@/lib/stake/stakeSessionStorage";

export type PlayerSessionStatsView = {
  walletShort?: string;
  sessionLabel: string;
  currentChips: number;
  startingChips: number;
  netChips: number;
  handsPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  biggestPot: number;
  totalVolume: number;
  totalDepositedEth: string;
  totalClaimedEth: string;
  chipSource: "server" | "local";
  lastWinner?: string;
};

export function computeNetChips(currentChips: number, startingChips: number): number {
  const current = Number.isFinite(currentChips) ? Math.floor(currentChips) : 0;
  const starting = Number.isFinite(startingChips) ? Math.floor(startingChips) : 0;
  return current - starting;
}

export function computeWinRate(wins: number, handsPlayed: number): number {
  if (!Number.isFinite(handsPlayed) || handsPlayed <= 0) return 0;
  const safeWins = Math.max(0, Math.floor(wins));
  return Math.round((safeWins / handsPlayed) * 1000) / 10;
}

export function formatChipDelta(delta: number): string {
  if (!Number.isFinite(delta) || delta === 0) return "±0";
  return delta > 0 ? `+${delta.toLocaleString()}` : delta.toLocaleString();
}

export function formatWinRateLabel(winRate: number, handsPlayed: number): string {
  if (handsPlayed <= 0) return "—";
  return `${winRate.toFixed(1)}%`;
}

function parseEthAmount(amount: string | undefined): number {
  if (!amount) return 0;
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEthTotal(eth: number): string {
  if (!Number.isFinite(eth) || eth <= 0) return "0 ETH";
  const str = eth
    .toFixed(6)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
  return `${str} ETH`;
}

export function sumDepositedTestEth(
  activeMeta: StakeSessionMeta | null | undefined,
  history: StakeSessionMeta[] = loadStakeSessionHistory(),
): string {
  let total = 0;

  for (const meta of history) {
    if (meta.stakeAmount) {
      total += parseEthAmount(getTestStakeTier(meta.stakeAmount).testEthAmount);
    }
  }

  if (activeMeta?.stakeAmount && activeMeta.status === "active") {
    total += parseEthAmount(getTestStakeTier(activeMeta.stakeAmount).testEthAmount);
  }

  return formatEthTotal(total);
}

export function sumClaimedTestEth(
  activeMeta: StakeSessionMeta | null | undefined,
  history: StakeSessionMeta[] = loadStakeSessionHistory(),
): string {
  let total = 0;

  for (const meta of history) {
    const claimed = meta.cashOut?.claimedEthAmount ?? meta.escrowPayoutAmount;
    total += parseEthAmount(claimed);
  }

  if (activeMeta?.status === "cashed_out") {
    const claimed =
      activeMeta.cashOut?.claimedEthAmount ?? activeMeta.escrowPayoutAmount;
    total += parseEthAmount(claimed);
  }

  return formatEthTotal(total);
}

export function settlementLabelFromMeta(
  meta: StakeSessionMeta | null | undefined,
): string {
  if (!meta) return "Demo session";
  if (meta.lockSettlement === "escrow-deposit") return "Testnet session";
  if (meta.lockSettlement === "base-sepolia-test-tx") return "Testnet session";
  return "Demo session";
}

export function buildPlayerSessionStatsView(input: {
  sessionStats: SessionStats;
  currentChips: number;
  startingChips: number;
  walletShort?: string;
  stakeSessionMeta?: StakeSessionMeta | null;
  serverSession?: ArenaServerSession | null;
}): PlayerSessionStatsView {
  const serverChips =
    input.serverSession &&
    Number.isFinite(input.serverSession.currentChips) &&
    Number.isFinite(input.serverSession.startingChips)
      ? {
          current: Math.max(0, Math.floor(input.serverSession.currentChips)),
          starting: Math.max(0, Math.floor(input.serverSession.startingChips)),
        }
      : null;

  const currentChips = serverChips?.current ?? Math.max(0, Math.floor(input.currentChips));
  const startingChips = serverChips?.starting ?? Math.max(0, Math.floor(input.startingChips));

  const handsPlayed = input.sessionStats.humanHandsPlayed ?? input.sessionStats.totalGames;
  const wins = input.sessionStats.humanWins ?? 0;
  const losses = input.sessionStats.humanLosses ?? 0;

  return {
    walletShort: input.walletShort,
    sessionLabel: settlementLabelFromMeta(input.stakeSessionMeta),
    currentChips,
    startingChips,
    netChips: computeNetChips(currentChips, startingChips),
    handsPlayed,
    wins,
    losses,
    winRate: computeWinRate(wins, handsPlayed),
    biggestPot: input.sessionStats.biggestPot,
    totalVolume: input.sessionStats.totalVolume,
    totalDepositedEth: sumDepositedTestEth(input.stakeSessionMeta),
    totalClaimedEth: sumClaimedTestEth(input.stakeSessionMeta),
    chipSource: serverChips ? "server" : "local",
    lastWinner: input.sessionStats.lastWinner,
  };
}

export function formatHandHistoryResultLine(entry: HandHistoryRecord): string {
  if (entry.resultType === "Win by fold") return "Win by fold";
  if (entry.winningHandName && entry.winningHandName !== "Win by fold") {
    return entry.winningHandName;
  }
  return entry.resultType;
}

export function formatHandHistoryCompactTitle(entry: HandHistoryRecord): string {
  const handLabel =
    entry.handNumber != null ? `Hand #${entry.handNumber}` : formatHandHistoryAge(entry.timestamp);
  const winner =
    entry.winnerName === "You" ? "You won" : `${entry.winnerName} won`;
  return `${handLabel} · ${winner}`;
}

export function formatHandHistoryAge(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 45_000) return "Just now";
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000));
    return `${minutes}m ago`;
  }
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatHandHistoryMetaLine(entry: HandHistoryRecord): string {
  const parts: string[] = [`Pot ${entry.potWon.toLocaleString()}`];

  if (entry.humanChipChange != null) {
    parts.push(`You ${formatChipDelta(entry.humanChipChange)}`);
  }

  if (entry.humanFinalChips != null) {
    parts.push(`Stack ${entry.humanFinalChips.toLocaleString()}`);
  }

  if (entry.settlementLabel) {
    parts.push(entry.settlementLabel);
  }

  return parts.join(" · ");
}

export function shouldShowHistoryTxLink(entry: HandHistoryRecord): boolean {
  return Boolean(entry.claimTxHash || entry.depositTxHash);
}
