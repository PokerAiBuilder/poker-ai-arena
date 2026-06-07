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
  computeEscrowPayoutWei,
  formatEscrowPayoutEth,
} from "@/lib/stake/escrowPayout";
import {
  createEscrowCashOutRecord,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";
import { chipsToTestBalance } from "@/lib/stake/testnetStake";

export type EscrowCashOutPhase = "resolving" | "claiming";

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

async function resolveActiveEscrowSession(
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
  const payoutAmountWei = computeEscrowPayoutWei(
    currentChips,
    startingChips,
    onChain.stakeAmount,
    contractBalance,
  );
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
 * Resolve (dev owner) and/or claim escrow payout for an active Human vs AI session.
 */
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

  if (!account) {
    throw new Error("Connect wallet to claim escrow payout on Base Sepolia.");
  }

  if (!isBaseSepolia(chainId)) {
    throw new Error("Switch to Base Sepolia to claim escrow payout.");
  }

  const sessionId = meta.escrowSessionId;
  const chips = Math.max(0, Math.floor(currentChips));
  const testBalance = chipsToTestBalance(chips);

  let onChain = await readEscrowSession(sessionId);
  if (!onChain) {
    throw new Error("Escrow session not found on Base Sepolia.");
  }

  let resolveTxHash = meta.escrowResolveTxHash;
  let resultHash = meta.escrowResult as `0x${string}` | undefined;
  let payoutAmountWei =
    meta.escrowPayoutAmount != null
      ? BigInt(meta.escrowPayoutAmount)
      : undefined;

  if (onChain.status === "active") {
    const canAutoResolve =
      isEscrowDevMode() && (await isEscrowContractOwner(account));

    if (!canAutoResolve) {
      if (isEscrowDevMode()) {
        throw new Error(
          "Resolve test session first — use dev owner resolve or connect the contract owner wallet.",
        );
      }
      throw new Error(
        "Escrow session is not resolved yet. Payout will be available after admin resolution.",
      );
    }

    onPhase?.("resolving");
    const resolved = await resolveActiveEscrowSession(
      meta,
      sessionId,
      chips,
      startingChips,
      account,
    );
    resolveTxHash = resolved.resolveTxHash;
    resultHash = resolved.resultHash;
    payoutAmountWei = resolved.payoutAmountWei;
    onChain = await readEscrowSession(sessionId);
  }

  if (!onChain) {
    throw new Error("Failed to read escrow session after resolve.");
  }

  if (onChain.status === "claimed") {
    const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
      claimTxHash: meta.escrowClaimTxHash,
      claimedEthAmount: meta.escrowPayoutAmount
        ? formatEscrowPayoutEth(BigInt(meta.escrowPayoutAmount))
        : undefined,
      resolveTxHash,
      resultHash,
      payoutAmountWei: payoutAmountWei ?? onChain.payoutAmount,
      claimStatus: "confirmed",
    });
    return {
      meta: updated,
      logMessage: "Escrow payout already claimed on-chain.",
    };
  }

  const effectivePayout =
    onChain.status === "resolved"
      ? onChain.payoutAmount
      : (payoutAmountWei ?? BigInt(0));

  if (effectivePayout <= BigInt(0)) {
    const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
      resolveTxHash,
      resultHash,
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
    throw new Error("Connected wallet is not the escrow session player.");
  }

  onPhase?.("claiming");
  const { hash, claimedAmount } = await claimEscrowPayout(sessionId, account);

  const updated = finalizeEscrowCashOutMeta(meta, chips, testBalance, account, {
    claimTxHash: hash,
    claimedEthAmount: formatEscrowPayoutEth(claimedAmount),
    resolveTxHash,
    resultHash,
    payoutAmountWei: claimedAmount,
    claimStatus: "confirmed",
  });

  return {
    meta: updated,
    logMessage: `Escrow payout claimed — ${formatEscrowPayoutEth(claimedAmount)} test ETH to wallet. Tx ${hash.slice(0, 10)}…`,
  };
}

/**
 * Dev-only: resolve an active escrow session without claiming.
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
    await resolveActiveEscrowSession(
      meta,
      meta.escrowSessionId,
      currentChips,
      startingChips,
      account,
    );

  return {
    ...meta,
    escrowResolved: true,
    escrowResult: resultHash,
    escrowPayoutAmount: payoutAmountWei.toString(),
    escrowResolveTxHash: resolveTxHash,
    claimStatus: payoutAmountWei > BigInt(0) ? "none" : "not-applicable",
  };
}
