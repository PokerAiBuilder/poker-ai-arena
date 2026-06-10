"use client";

import type {
  ArenaServerSession,
  ArenaServerSessionStatus,
} from "@/lib/arena/arenaServerSessionTypes";
import {
  buildServerHandResultFromStepDemo,
  type ArenaServerHandResultInput,
} from "@/lib/arena/arenaServerHandHistory";
import type { StepDemoState } from "@/lib/arena/stepDemo";
import type { SessionStats } from "@/lib/analytics/types";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { testStakeAmountToWei } from "@/lib/stake/testnetStake";

type RegisterArenaSessionInput = {
  walletAddress: string;
  escrowSessionId: string;
  stakeAmount: string;
  startingChips: number;
  currentChips?: number;
  depositTxHash: string;
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
};

export type ArenaSessionHandPatch = {
  currentChips: number;
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
  status?: ArenaServerSessionStatus;
  latestHandResult?: ArenaServerHandResultInput;
};

type PatchArenaSessionInput = {
  walletAddress: string;
  escrowSessionId: string;
  currentChips?: number;
  status?: ArenaServerSessionStatus;
  resolveTxHash?: string;
  claimTxHash?: string;
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
  latestHandResult?: ArenaServerHandResultInput;
};

function warnArenaSessionSync(message: string, err?: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[arena/session sync] ${message}`, err ?? "");
  }
}

export function isEscrowArenaSessionMeta(
  meta: StakeSessionMeta | null | undefined,
): meta is StakeSessionMeta & {
  lockSettlement: "escrow-deposit";
  escrowSessionId: string;
  walletAddress: string;
  lockTxHash: string;
} {
  return (
    meta?.lockSettlement === "escrow-deposit" &&
    Boolean(meta.escrowSessionId) &&
    Boolean(meta.walletAddress) &&
    Boolean(meta.lockTxHash)
  );
}

export async function registerArenaServerSession(
  input: RegisterArenaSessionInput,
): Promise<ArenaServerSession | null> {
  try {
    const res = await fetch("/api/arena/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: input.walletAddress,
        escrowSessionId: input.escrowSessionId,
        stakeAmountWei: testStakeAmountToWei(input.stakeAmount),
        startingChips: input.startingChips,
        currentChips: input.currentChips ?? input.startingChips,
        lockSettlement: "escrow-deposit",
        depositTxHash: input.depositTxHash,
        status: "active",
        handsPlayed: input.handsPlayed ?? 0,
        wins: input.wins ?? 0,
        losses: input.losses ?? 0,
        biggestPot: input.biggestPot ?? 0,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      warnArenaSessionSync(data.error ?? `register failed (${res.status})`);
      return null;
    }

    const data = (await res.json()) as { session: ArenaServerSession };
    return data.session;
  } catch (err) {
    warnArenaSessionSync("register failed", err);
    return null;
  }
}

export async function patchArenaServerSession(
  input: PatchArenaSessionInput,
): Promise<ArenaServerSession | null> {
  try {
    const res = await fetch("/api/arena/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      warnArenaSessionSync(data.error ?? `patch failed (${res.status})`);
      return null;
    }

    const data = (await res.json()) as { session: ArenaServerSession };
    return data.session;
  } catch (err) {
    warnArenaSessionSync("patch failed", err);
    return null;
  }
}

export async function fetchArenaServerSession(
  walletAddress: string,
  escrowSessionId: string,
): Promise<ArenaServerSession | null> {
  try {
    const params = new URLSearchParams({
      walletAddress,
      escrowSessionId,
    });
    const res = await fetch(`/api/arena/session?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      session: ArenaServerSession;
      recentHands?: ArenaServerSession["recentHands"];
    };
    const session = data.session;
    if (session && Array.isArray(data.recentHands)) {
      session.recentHands = data.recentHands;
    }
    return session;
  } catch {
    return null;
  }
}

export async function ensureArenaServerSessionRegistered(
  meta: StakeSessionMeta,
): Promise<ArenaServerSession | null> {
  if (!isEscrowArenaSessionMeta(meta)) return null;

  const existing = await fetchArenaServerSession(
    meta.walletAddress,
    meta.escrowSessionId,
  );
  if (existing) return existing;

  return registerArenaServerSession({
    walletAddress: meta.walletAddress,
    escrowSessionId: meta.escrowSessionId,
    stakeAmount: meta.stakeAmount,
    startingChips: meta.startingChips,
    currentChips: meta.currentChips ?? meta.startingChips,
    depositTxHash: meta.lockTxHash,
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    biggestPot: 0,
  });
}

export function sessionStatsToHandPatch(
  sessionStats: SessionStats,
): Pick<ArenaSessionHandPatch, "handsPlayed" | "wins" | "losses" | "biggestPot"> {
  return {
    handsPlayed: sessionStats.humanHandsPlayed ?? sessionStats.totalGames ?? 0,
    wins: sessionStats.humanWins ?? 0,
    losses: sessionStats.humanLosses ?? 0,
    biggestPot: sessionStats.biggestPot ?? 0,
  };
}

export function syncArenaSessionHandProgress(
  meta: StakeSessionMeta | null,
  patch: ArenaSessionHandPatch,
): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  void (async () => {
    const registered = await ensureArenaServerSessionRegistered(meta);
    if (!registered) return;

    await patchArenaServerSession({
      walletAddress: meta.walletAddress,
      escrowSessionId: meta.escrowSessionId,
      currentChips: patch.currentChips,
      status:
        patch.status ??
        (patch.currentChips <= 0 ? "depleted" : "active"),
      handsPlayed: patch.handsPlayed,
      wins: patch.wins,
      losses: patch.losses,
      biggestPot: patch.biggestPot,
      latestHandResult: patch.latestHandResult,
    });
  })();
}

export function syncArenaSessionAfterDeposit(meta: StakeSessionMeta): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  void registerArenaServerSession({
    walletAddress: meta.walletAddress,
    escrowSessionId: meta.escrowSessionId,
    stakeAmount: meta.stakeAmount,
    startingChips: meta.startingChips,
    currentChips: meta.currentChips ?? meta.startingChips,
    depositTxHash: meta.lockTxHash,
  });
}

export function syncArenaSessionAfterHand(
  meta: StakeSessionMeta | null,
  currentChips: number,
  sessionStats?: SessionStats,
  stepDemo?: StepDemoState,
  handNumber?: number,
  humanStackBeforeHand?: number,
): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  const latestHandResult =
    stepDemo != null
      ? buildServerHandResultFromStepDemo(
          stepDemo,
          handNumber,
          humanStackBeforeHand,
        ) ?? undefined
      : undefined;

  syncArenaSessionHandProgress(meta, {
    currentChips,
    ...(sessionStats ? sessionStatsToHandPatch(sessionStats) : {}),
    latestHandResult,
  });
}

export function syncArenaSessionAfterResolve(
  meta: StakeSessionMeta | null,
  currentChips: number,
  resolveTxHash?: string | null,
): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  void patchArenaServerSession({
    walletAddress: meta.walletAddress,
    escrowSessionId: meta.escrowSessionId,
    currentChips,
    status: "resolved",
    resolveTxHash: resolveTxHash ?? undefined,
  });
}

export function syncArenaSessionAfterClaim(
  meta: StakeSessionMeta | null,
  currentChips: number,
  claimTxHash?: string | null,
  closed = false,
): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  void patchArenaServerSession({
    walletAddress: meta.walletAddress,
    escrowSessionId: meta.escrowSessionId,
    currentChips,
    status: closed ? "closed" : "claimed",
    claimTxHash: claimTxHash ?? undefined,
  });
}
