import type { Address } from "viem";
import type { EscrowOnChainSession } from "@/lib/onchain/escrowAbi";
import { buildEscrowResultHash } from "@/lib/onchain/escrowAbi";
import { computeEscrowPayoutLiquidity } from "@/lib/stake/escrowPayout";

export type EscrowResolveRequestBody = {
  sessionId: string;
  walletAddress: string;
  currentChips: number;
  startingChips: number;
  lockSettlement?: string;
};

export type EscrowResolveValidationResult =
  | {
      ok: true;
      sessionId: bigint;
      walletAddress: Address;
      currentChips: number;
      startingChips: number;
      onChain: EscrowOnChainSession;
      payoutAmountWei: bigint;
      estimatedPayoutWei: bigint;
      cappedPayoutWei: bigint;
      wasPayoutCapped: boolean;
      escrowBalanceWei: bigint;
      resultHash: `0x${string}`;
      alreadyResolved: boolean;
    }
  | { ok: false; status: number; error: string };

const MAX_CHIP_MULTIPLIER = 10;

/**
 * Server-side validation for /api/escrow/resolve.
 *
 * TODO(v1.2.2+): persist signed session results server-side; verify wallet
 * signature over {sessionId, currentChips, startingChips} instead of trusting
 * client-reported chip counts.
 */
export function validateEscrowResolveRequest(
  body: EscrowResolveRequestBody,
  onChain: EscrowOnChainSession | null,
  contractBalanceWei: bigint,
): EscrowResolveValidationResult {
  if (!onChain) {
    return { ok: false, status: 404, error: "Escrow session not found on-chain." };
  }

  if (body.lockSettlement && body.lockSettlement !== "escrow-deposit") {
    return {
      ok: false,
      status: 400,
      error: "Session settlement must be escrow-deposit.",
    };
  }

  let sessionId: bigint;
  try {
    sessionId = BigInt(body.sessionId);
    if (sessionId <= BigInt(0)) throw new Error("invalid");
  } catch {
    return { ok: false, status: 400, error: "Invalid escrow session id." };
  }

  const wallet = body.walletAddress?.trim();
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return { ok: false, status: 400, error: "Invalid wallet address." };
  }

  if (onChain.player.toLowerCase() !== wallet.toLowerCase()) {
    return {
      ok: false,
      status: 403,
      error: "Wallet address does not match escrow session player.",
    };
  }

  const currentChips = Math.floor(Number(body.currentChips));
  const startingChips = Math.floor(Number(body.startingChips));

  if (!Number.isFinite(currentChips) || currentChips < 0) {
    return { ok: false, status: 400, error: "Invalid current chips." };
  }

  if (!Number.isFinite(startingChips) || startingChips <= 0) {
    return { ok: false, status: 400, error: "Invalid starting chips." };
  }

  const onChainStarting = Number(onChain.chipAmount);
  if (onChainStarting > 0 && startingChips !== onChainStarting) {
    return {
      ok: false,
      status: 400,
      error: "Starting chips do not match on-chain escrow session.",
    };
  }

  if (currentChips > startingChips * MAX_CHIP_MULTIPLIER) {
    return {
      ok: false,
      status: 400,
      error: "Current chips exceed allowed session range.",
    };
  }

  if (onChain.status === "claimed" || onChain.status === "refunded") {
    return {
      ok: false,
      status: 409,
      error: `Escrow session is already ${onChain.status}.`,
    };
  }

  if (onChain.status === "resolved") {
    const liquidity = computeEscrowPayoutLiquidity(
      currentChips,
      startingChips,
      onChain.stakeAmount,
      contractBalanceWei,
    );
    const wasCapped =
      liquidity.estimatedPayoutWei > onChain.payoutAmount &&
      liquidity.estimatedPayoutWei > BigInt(0);

    return {
      ok: true,
      sessionId,
      walletAddress: wallet as Address,
      currentChips,
      startingChips,
      onChain,
      payoutAmountWei: onChain.payoutAmount,
      estimatedPayoutWei: liquidity.estimatedPayoutWei,
      cappedPayoutWei: onChain.payoutAmount,
      wasPayoutCapped: wasCapped,
      escrowBalanceWei: contractBalanceWei,
      resultHash: onChain.resultHash,
      alreadyResolved: true,
    };
  }

  const liquidity = computeEscrowPayoutLiquidity(
    currentChips,
    startingChips,
    onChain.stakeAmount,
    contractBalanceWei,
  );
  const resultHash = buildEscrowResultHash(sessionId, currentChips);

  return {
    ok: true,
    sessionId,
    walletAddress: wallet as Address,
    currentChips,
    startingChips,
    onChain,
    payoutAmountWei: liquidity.cappedPayoutWei,
    estimatedPayoutWei: liquidity.estimatedPayoutWei,
    cappedPayoutWei: liquidity.cappedPayoutWei,
    wasPayoutCapped: liquidity.wasPayoutCapped,
    escrowBalanceWei: liquidity.escrowBalanceWei,
    resultHash,
    alreadyResolved: false,
  };
}
