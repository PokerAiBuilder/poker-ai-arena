"use client";

import type { Address } from "viem";
import { isBaseSepolia } from "@/lib/onchain/baseSepolia";
import {
  buildEscrowResultHash,
  claimEscrowPayout,
  isEscrowContractOwner,
  isEscrowDevMode,
  readEscrowContractBalance,
  readEscrowSession,
  resolveEscrowSession,
  getEscrowTxUrl,
} from "@/lib/onchain/escrowContract";
import {
  applyEscrowLiquidityToMeta,
  fetchEscrowPayoutPreview,
} from "@/lib/stake/escrowLiquidityPreview";
import {
  computeEscrowPayoutLiquidity,
  formatEscrowPayoutEth,
} from "@/lib/stake/escrowPayout";
import {
  applyEscrowResolveApiToMeta,
  callEscrowResolveApi,
} from "@/lib/stake/escrowResolveApi";
import {
  createEscrowCashOutRecord,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";
import { chipsToTestBalance } from "@/lib/stake/testnetStake";

export type EscrowCashOutPhase = "preparing" | "claiming";

export type EscrowCashOutResult = {
  meta: StakeSessionMeta;
  logMessage: string;
};

function finalizeEscrowCashOutMeta(
  base: StakeSessionMeta,
  chips: number,
  testBalance: number,
  walletAddress: Address | undefined,
  options: {
    claimTxHash?: string;
    claimedEthAmount?: string;
    zeroPayout?: boolean;
    resolveTxHash?: string;
    resultHash?: string;
    payoutAmountWei?: bigint;
    claimStatus: StakeSessionMeta["claimStatus"];
  },
): StakeSessionMeta {
  const cashOut = createEscrowCashOutRecord(chips, testBalance, walletAddress, {
    claimTxHash: options.claimTxHash,
    claimExplorerUrl: options.claimTxHash
      ? getEscrowTxUrl(options.claimTxHash)
      : undefined,
    claimedEthAmount: options.claimedEthAmount,
    zeroPayout: options.zeroPayout,
  });

  return {
    ...base,
    status: "cashed_out",
    cashOut,
    escrowResolved: true,
    escrowResult: options.resultHash ?? base.escrowResult,
    escrowPayoutAmount:
      options.payoutAmountWei != null
        ? options.payoutAmountWei.toString()
        : base.escrowPayoutAmount,
    escrowResolveTxHash: options.resolveTxHash ?? base.escrowResolveTxHash,
    escrowClaimTxHash: options.claimTxHash ?? base.escrowClaimTxHash,
    claimStatus: options.claimStatus,
  };
}

async function resolveActiveEscrowSessionDev(
  meta: StakeSessionMeta,
  sessionId: string,
  currentChips: number,
  startingChips: number,
  account: Address,
): Promise<{
  resolveTxHash: string;
  resultHash: `0x${string}`;
  payoutAmountWei: bigint;
}> {
  const onChain = await readEscrowSession(sessionId);
  if (!onChain) {
    throw new Error("Escrow session not found on Base Sepolia.");
  }

  const contractBalance = await readEscrowContractBalance();
  const liquidity = computeEscrowPayoutLiquidity(
    currentChips,
    startingChips,
    onChain.stakeAmount,
    contractBalance,
  );
  const payoutAmountWei = liquidity.cappedPayoutWei;
  const resultHash = buildEscrowResultHash(sessionId, currentChips);

  const { hash } = await resolveEscrowSession(
    sessionId,
    resultHash,
    payoutAmountWei,
    account,
  );

  return { resolveTxHash: hash, resultHash, payoutAmountWei };
}

/**
 * Server API resolver — prepares escrow payout without dev wallet switching.
 */
export async function prepareEscrowPayoutViaApi(
  meta: StakeSessionMeta,
  currentChips: number,
  startingChips: number,
  account: Address,
): Promise<StakeSessionMeta> {
  if (!meta.escrowSessionId) {
    throw new Error("Escrow session id is missing from stake metadata.");
  }

  const sessionId = meta.escrowSessionId;
  const chips = Math.max(0, Math.floor(currentChips));

  let onChain = await readEscrowSession(sessionId);
  if (!onChain) {
    throw new Error("Escrow session not found on Base Sepolia.");
  }

  if (onChain.status === "resolved" || onChain.status === "claimed") {
    const preview = await fetchEscrowPayoutPreview(
      sessionId,
      chips,
      startingChips,
    );
    const base: StakeSessionMeta = {
      ...meta,
      escrowResolved: true,
      escrowResult: onChain.resultHash,
      escrowPayoutAmount: onChain.payoutAmount.toString(),
      escrowCappedPayoutWei: onChain.payoutAmount.toString(),
      claimStatus:
        onChain.payoutAmount > BigInt(0) ? "none" : "not-applicable",
    };
    if (preview) {
      return applyEscrowLiquidityToMeta(base, {
        ...preview,
        cappedPayoutWei: onChain.payoutAmount.toString(),
        wasPayoutCapped:
          BigInt(preview.estimatedPayoutWei) > onChain.payoutAmount,
      });
    }
    return base;
  }

  if (onChain.player.toLowerCase() !== account.toLowerCase()) {
    throw new Error("Switch to player wallet to prepare payout.");
  }

  const response = await callEscrowResolveApi({
    sessionId,
    walletAddress: account,
    currentChips: chips,
    startingChips,
    lockSettlement: "escrow-deposit",
  });

  onChain = await readEscrowSession(sessionId);
  if (!onChain || onChain.status !== "resolved") {
    throw new Error("Escrow session was not resolved on-chain.");
  }

  return applyEscrowResolveApiToMeta(meta, response);
}

/**
 * Claim escrow payout after session is resolved (player wallet).
 */
export async function performEscrowClaimPayout(
  meta: StakeSessionMeta,
  currentChips: number,
  account: Address | undefined,
  chainId: number | undefined,
  onPhase?: (phase: EscrowCashOutPhase) => void,
): Promise<EscrowCashOutResult> {
  if (!meta.escrowSessionId) {
    throw new Error("Escrow session id is missing from stake metadata.");
  }

  if (!account) {
    throw new Error("Connect wallet to claim escrow payout on Base Sepolia.");
  }

  if (!isBaseSepolia(chainId)) {
    throw new Error("Switch to Base Sepolia to claim escrow payout.");
  }

  const sessionId = meta.escrowSessionId;
  const chips = Math.max(0, Math.floor(currentChips));
  const testBalance = chipsToTestBalance(chips);

  const onChain = await readEscrowSession(sessionId);
  if (!onChain) {
    throw new Error("Escrow session not found on Base Sepolia.");
  }

  if (onChain.status === "active") {
    throw new Error("Prepare payout first — escrow session is not resolved yet.");
  }

  if (onChain.status === "claimed") {
    const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
      claimTxHash: meta.escrowClaimTxHash,
      claimedEthAmount: meta.escrowPayoutAmount
        ? formatEscrowPayoutEth(BigInt(meta.escrowPayoutAmount))
        : undefined,
      resolveTxHash: meta.escrowResolveTxHash,
      resultHash: meta.escrowResult as `0x${string}` | undefined,
      payoutAmountWei:
        meta.escrowPayoutAmount != null
          ? BigInt(meta.escrowPayoutAmount)
          : onChain.payoutAmount,
      claimStatus: "confirmed",
    });
    return {
      meta: updated,
      logMessage: "Escrow payout already claimed on-chain.",
    };
  }

  const effectivePayout = onChain.payoutAmount;

  if (effectivePayout <= BigInt(0)) {
    const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
      resolveTxHash: meta.escrowResolveTxHash,
      resultHash: meta.escrowResult as `0x${string}` | undefined,
      payoutAmountWei: BigInt(0),
      zeroPayout: true,
      claimStatus: "not-applicable",
    });
    return {
      meta: updated,
      logMessage: `Escrow session closed — no payout available (${chips.toLocaleString()} chips).`,
    };
  }

  if (onChain.player.toLowerCase() !== account.toLowerCase()) {
    throw new Error("Switch to player wallet to claim.");
  }

  onPhase?.("claiming");
  const { hash, claimedAmount } = await claimEscrowPayout(sessionId, account);

  const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
    claimTxHash: hash,
    claimedEthAmount: formatEscrowPayoutEth(claimedAmount),
    resolveTxHash: meta.escrowResolveTxHash,
    resultHash: meta.escrowResult as `0x${string}` | undefined,
    payoutAmountWei: claimedAmount,
    claimStatus: "confirmed",
  });

  return {
    meta: updated,
    logMessage: `Escrow payout claimed — ${formatEscrowPayoutEth(claimedAmount)} test ETH to wallet. Tx ${hash.slice(0, 10)}…`,
  };
}

/** @deprecated Use prepareEscrowPayoutViaApi + performEscrowClaimPayout */
export async function performEscrowCashOut(
  meta: StakeSessionMeta,
  currentChips: number,
  startingChips: number,
  account: Address | undefined,
  chainId: number | undefined,
  onPhase?: (phase: EscrowCashOutPhase) => void,
): Promise<EscrowCashOutResult> {
  if (!meta.escrowSessionId) {
    throw new Error("Escrow session id is missing from stake metadata.");
  }

  let workingMeta = meta;
  const onChain = await readEscrowSession(meta.escrowSessionId);

  if (onChain?.status === "active") {
    if (!account) {
      throw new Error("Connect wallet to prepare escrow payout.");
    }
    onPhase?.("preparing");
    workingMeta = await prepareEscrowPayoutViaApi(
      meta,
      currentChips,
      startingChips,
      account,
    );
  }

  return performEscrowClaimPayout(
    workingMeta,
    currentChips,
    account,
    chainId,
    onPhase,
  );
}

/**
 * Dev-only: resolve an active escrow session without claiming (owner wallet).
 */
export async function performEscrowResolveOnly(
  meta: StakeSessionMeta,
  currentChips: number,
  startingChips: number,
  account: Address,
): Promise<StakeSessionMeta> {
  if (!isEscrowDevMode()) {
    throw new Error("Escrow resolve controls are only available in development.");
  }

  if (!meta.escrowSessionId) {
    throw new Error("Escrow session id is missing.");
  }

  const isOwner = await isEscrowContractOwner(account);
  if (!isOwner) {
    throw new Error("Only the escrow contract owner can resolve sessions.");
  }

  const onChain = await readEscrowSession(meta.escrowSessionId);
  if (!onChain) {
    throw new Error("Escrow session not found on Base Sepolia.");
  }
  if (onChain.status !== "active") {
    throw new Error("Escrow session is already resolved or closed.");
  }

  const { resolveTxHash, resultHash, payoutAmountWei } =
    await resolveActiveEscrowSessionDev(
      meta,
      meta.escrowSessionId,
      currentChips,
      startingChips,
      account,
    );

  const preview = await fetchEscrowPayoutPreview(
    meta.escrowSessionId,
    currentChips,
    startingChips,
  );
  const base: StakeSessionMeta = {
    ...meta,
    escrowResolved: true,
    escrowResult: resultHash,
    escrowPayoutAmount: payoutAmountWei.toString(),
    escrowResolveTxHash: resolveTxHash,
    claimStatus: payoutAmountWei > BigInt(0) ? "none" : "not-applicable",
  };
  if (preview) {
    return applyEscrowLiquidityToMeta(base, preview);
  }
  return base;
}
