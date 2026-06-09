"use client";

import type {
  ArenaServerSession,
  ArenaServerSessionStatus,
} from "@/lib/arena/arenaServerSessionTypes";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";
import { testStakeAmountToWei } from "@/lib/stake/testnetStake";

type RegisterArenaSessionInput = {
  walletAddress: string;
  escrowSessionId: string;
  stakeAmount: string;
  startingChips: number;
  currentChips?: number;
  depositTxHash: string;
};

type PatchArenaSessionInput = {
  walletAddress: string;
  escrowSessionId: string;
  currentChips?: number;
  status?: ArenaServerSessionStatus;
  resolveTxHash?: string;
  claimTxHash?: string;
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
    const data = (await res.json()) as { session: ArenaServerSession };
    return data.session;
  } catch {
    return null;
  }
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
): void {
  if (!isEscrowArenaSessionMeta(meta)) return;

  void patchArenaServerSession({
    walletAddress: meta.walletAddress,
    escrowSessionId: meta.escrowSessionId,
    currentChips,
    status: currentChips <= 0 ? "depleted" : "active",
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
