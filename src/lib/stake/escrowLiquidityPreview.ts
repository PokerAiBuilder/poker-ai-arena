"use client";

import {
  readEscrowContractBalance,
  readEscrowSession,
} from "@/lib/onchain/escrowContract";
import {
  computeEscrowPayoutLiquidity,
  formatEscrowPayoutEth,
} from "@/lib/stake/escrowPayout";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";

export type EscrowPayoutPreview = {
  estimatedPayoutWei: string;
  cappedPayoutWei: string;
  wasPayoutCapped: boolean;
  escrowBalanceWei: string;
};

export type EscrowPayoutUiInfo = {
  expectedPayoutEth: string;
  claimablePayoutEth: string;
  escrowLiquidityEth: string;
  wasPayoutCapped: boolean;
};

export function escrowPayoutPreviewToUi(
  preview: EscrowPayoutPreview,
): EscrowPayoutUiInfo {
  return {
    expectedPayoutEth: formatEscrowPayoutEth(BigInt(preview.estimatedPayoutWei)),
    claimablePayoutEth: formatEscrowPayoutEth(BigInt(preview.cappedPayoutWei)),
    escrowLiquidityEth: formatEscrowPayoutEth(BigInt(preview.escrowBalanceWei)),
    wasPayoutCapped: preview.wasPayoutCapped,
  };
}

export function escrowLiquidityFromMeta(
  meta: StakeSessionMeta,
): EscrowPayoutUiInfo | null {
  const cappedWei =
    meta.escrowCappedPayoutWei ?? meta.escrowPayoutAmount ?? null;
  const estimatedWei = meta.escrowEstimatedPayoutWei ?? null;
  const balanceWei = meta.escrowBalanceWei ?? null;

  if (!cappedWei && !estimatedWei) return null;

  return {
    expectedPayoutEth: formatEscrowPayoutEth(
      BigInt(estimatedWei ?? cappedWei ?? "0"),
    ),
    claimablePayoutEth: formatEscrowPayoutEth(BigInt(cappedWei ?? "0")),
    escrowLiquidityEth: balanceWei
      ? formatEscrowPayoutEth(BigInt(balanceWei))
      : "—",
    wasPayoutCapped: meta.escrowPayoutWasCapped === true,
  };
}

export async function fetchEscrowPayoutPreview(
  sessionId: string,
  currentChips: number,
  startingChips: number,
): Promise<EscrowPayoutPreview | null> {
  const onChain = await readEscrowSession(sessionId);
  if (!onChain) return null;

  const escrowBalanceWei = await readEscrowContractBalance();
  const liquidity = computeEscrowPayoutLiquidity(
    currentChips,
    startingChips,
    onChain.stakeAmount,
    escrowBalanceWei,
  );

  return {
    estimatedPayoutWei: liquidity.estimatedPayoutWei.toString(),
    cappedPayoutWei: liquidity.cappedPayoutWei.toString(),
    wasPayoutCapped: liquidity.wasPayoutCapped,
    escrowBalanceWei: liquidity.escrowBalanceWei.toString(),
  };
}

export function applyEscrowLiquidityToMeta(
  meta: StakeSessionMeta,
  liquidity: EscrowPayoutPreview,
): StakeSessionMeta {
  return {
    ...meta,
    escrowEstimatedPayoutWei: liquidity.estimatedPayoutWei,
    escrowCappedPayoutWei: liquidity.cappedPayoutWei,
    escrowPayoutAmount: liquidity.cappedPayoutWei,
    escrowPayoutWasCapped: liquidity.wasPayoutCapped,
    escrowBalanceWei: liquidity.escrowBalanceWei,
  };
}
