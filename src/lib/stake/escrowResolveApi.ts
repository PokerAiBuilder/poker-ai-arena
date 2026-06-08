"use client";

import type { Address } from "viem";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";

export type EscrowResolveApiResponse = {
  sessionId: string;
  txHash: string | null;
  payoutAmountWei: string;
  estimatedPayoutWei: string;
  cappedPayoutWei: string;
  wasPayoutCapped: boolean;
  escrowBalanceWei: string;
  resultHash: string;
  status: "resolved";
  alreadyResolved?: boolean;
};

export type EscrowResolverStatus = {
  configured: boolean;
};

export async function fetchEscrowResolverStatus(): Promise<EscrowResolverStatus> {
  try {
    const res = await fetch("/api/escrow/resolve", { method: "GET" });
    if (!res.ok) return { configured: false };
    const data = (await res.json()) as { configured?: boolean };
    return { configured: data.configured === true };
  } catch {
    return { configured: false };
  }
}

export async function callEscrowResolveApi(input: {
  sessionId: string;
  walletAddress: Address;
  currentChips: number;
  startingChips: number;
  lockSettlement: "escrow-deposit";
}): Promise<EscrowResolveApiResponse> {
  const res = await fetch("/api/escrow/resolve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as EscrowResolveApiResponse & { error?: string };

  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("Resolver not configured");
    }
    throw new Error(data.error ?? "Escrow resolve request failed.");
  }

  return data;
}

export function applyEscrowResolveApiToMeta(
  meta: StakeSessionMeta,
  response: EscrowResolveApiResponse,
): StakeSessionMeta {
  const cappedWei = response.cappedPayoutWei ?? response.payoutAmountWei;
  const payout = BigInt(cappedWei);
  return {
    ...meta,
    escrowResolved: true,
    escrowResult: response.resultHash,
    escrowPayoutAmount: cappedWei,
    escrowEstimatedPayoutWei: response.estimatedPayoutWei,
    escrowCappedPayoutWei: cappedWei,
    escrowPayoutWasCapped: response.wasPayoutCapped,
    escrowBalanceWei: response.escrowBalanceWei,
    escrowResolveTxHash: response.txHash ?? meta.escrowResolveTxHash,
    claimStatus: payout > BigInt(0) ? "none" : "not-applicable",
  };
}
