"use client";

import { getAccount, getWalletClient, waitForTransactionReceipt } from "@wagmi/core";
import { isAddress, parseEther, type Address, type Hash } from "viem";
import { getTestnetTreasuryAddress } from "@/lib/onchain/baseSepolia";
import { baseSepolia, BASE_SEPOLIA_CHAIN_ID } from "@/lib/onchain/chains";
import {
  getTestnetEscrowAddress,
  isEscrowConfigured,
  sendEscrowDepositStakeTx,
} from "@/lib/onchain/escrowContract";
import { wagmiConfig } from "@/lib/onchain/wagmiConfig";
import {
  getTestStakeTier,
  isValidTestStakeAmount,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import type { LockSettlement, LockTxStatus } from "@/lib/stake/stakeSessionStorage";

export type LockStakeTxPhase = "awaiting_wallet" | "submitted" | "confirming";

export type LockTestStakeTxResult = {
  hash: Hash;
  lockTxStatus: Extract<LockTxStatus, "confirmed">;
  lockSettlement: Extract<LockSettlement, "escrow-deposit" | "base-sepolia-test-tx">;
  treasuryAddress?: Address;
  escrowAddress?: Address;
  escrowSessionId?: string;
};

function logLockStakePreflight(info: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug("[lockTestStakeTx] preflight", info);
}

async function sendTreasuryLockTestStakeTx(
  stakeAmount: TestStakeAmount,
  account: Address,
  chainId: number,
  onPhase?: (phase: LockStakeTxPhase) => void,
): Promise<LockTestStakeTxResult> {
  const treasury = getTestnetTreasuryAddress();
  if (!treasury || !isAddress(treasury)) {
    throw new Error(
      "Treasury address not configured — cannot send testnet stake transaction.",
    );
  }

  const tier = getTestStakeTier(stakeAmount);
  const value = parseEther(tier.testEthAmount);
  if (value <= BigInt(0)) {
    throw new Error("Stake amount must be greater than zero.");
  }

  const { connector } = getAccount(wagmiConfig);
  logLockStakePreflight({
    path: "treasury",
    chainId,
    treasuryAddress: treasury,
    valueWei: value.toString(),
    stakeTier: stakeAmount,
    connectorName: connector?.name ?? connector?.id ?? "unknown",
  });

  onPhase?.("awaiting_wallet");

  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });
  if (!walletClient) {
    throw new Error("Wallet not connected.");
  }

  const hash = await walletClient.sendTransaction({
    account,
    to: treasury,
    value,
    chain: baseSepolia,
  });

  onPhase?.("submitted");
  onPhase?.("confirming");

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  if (receipt.status !== "success") {
    throw new Error("Test stake transaction failed on Base Sepolia.");
  }

  return {
    hash,
    lockTxStatus: "confirmed",
    lockSettlement: "base-sepolia-test-tx",
    treasuryAddress: treasury,
  };
}

/**
 * Lock a test stake on Base Sepolia — escrow deposit when configured, else treasury transfer.
 */
export async function sendLockTestStakeTx(
  stakeAmount: TestStakeAmount,
  account: Address,
  chainId: number,
  onPhase?: (phase: LockStakeTxPhase) => void,
): Promise<LockTestStakeTxResult> {
  if (!account || !isAddress(account)) {
    throw new Error("Wallet account is invalid.");
  }

  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error("Switch to Base Sepolia to lock a test stake.");
  }

  if (!isValidTestStakeAmount(stakeAmount)) {
    throw new Error("Invalid stake tier selected.");
  }

  const tier = getTestStakeTier(stakeAmount);
  const value = parseEther(tier.testEthAmount);
  if (value <= BigInt(0)) {
    throw new Error("Stake amount must be greater than zero.");
  }

  if (isEscrowConfigured()) {
    const escrowAddress = getTestnetEscrowAddress();
    if (!escrowAddress) {
      throw new Error("Testnet escrow address is not configured.");
    }

    const { connector } = getAccount(wagmiConfig);
    logLockStakePreflight({
      path: "escrow",
      chainId,
      escrowAddress,
      chipAmount: tier.chipAmount,
      valueWei: value.toString(),
      stakeTier: stakeAmount,
      connectorName: connector?.name ?? connector?.id ?? "unknown",
    });

    onPhase?.("awaiting_wallet");

    const { hash, sessionId } = await sendEscrowDepositStakeTx(
      tier.chipAmount,
      account,
      chainId,
      value,
      onPhase,
    );

    return {
      hash,
      lockTxStatus: "confirmed",
      lockSettlement: "escrow-deposit",
      escrowAddress,
      escrowSessionId: sessionId > BigInt(0) ? sessionId.toString() : undefined,
    };
  }

  return sendTreasuryLockTestStakeTx(stakeAmount, account, chainId, onPhase);
}

export function isLockStakePathConfigured(): boolean {
  return isEscrowConfigured() || Boolean(getTestnetTreasuryAddress());
}
