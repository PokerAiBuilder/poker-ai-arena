"use client";

import { getWalletClient, waitForTransactionReceipt } from "@wagmi/core";
import {
  decodeEventLog,
  encodeFunctionData,
  isAddress,
  type Abi,
  type Address,
  type Hash,
} from "viem";
import { baseSepolia, BASE_SEPOLIA_CHAIN_ID } from "@/lib/onchain/chains";
import { getBaseSepoliaExplorerAddressUrl } from "@/lib/onchain/baseSepolia";
import { wagmiConfig } from "@/lib/onchain/wagmiConfig";

/** Minimal ABI for v1.2.0-a escrow scaffold (deposit + read session). */
export const TEST_STAKE_ESCROW_ABI = [
  {
    type: "function",
    name: "depositStake",
    inputs: [{ name: "chipAmount", type: "uint256" }],
    outputs: [{ name: "sessionId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getSession",
    inputs: [{ name: "sessionId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "player", type: "address" },
          { name: "stakeAmount", type: "uint256" },
          { name: "chipAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "payoutAmount", type: "uint256" },
          { name: "resultHash", type: "bytes32" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimPayout",
    inputs: [{ name: "sessionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveSession",
    inputs: [
      { name: "sessionId", type: "uint256" },
      { name: "result", type: "bytes32" },
      { name: "payoutAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "StakeDeposited",
    inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "chips", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SessionResolved",
    inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "result", type: "bytes32", indexed: false },
      { name: "payout", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PayoutClaimed",
    inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Refunded",
    inputs: [
      { name: "sessionId", type: "uint256", indexed: true },
      { name: "player", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

export type EscrowDepositTxResult = {
  hash: Hash;
  sessionId: bigint;
};

export function getTestnetEscrowAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw;
}

export function isEscrowConfigured(): boolean {
  return getTestnetEscrowAddress() !== null;
}

export function getEscrowExplorerAddressUrl(): string | null {
  const address = getTestnetEscrowAddress();
  if (!address) return null;
  return getBaseSepoliaExplorerAddressUrl(address);
}

export function getEscrowStatusLabel(): string {
  return isEscrowConfigured()
    ? "Escrow contract: configured"
    : "Escrow contract: not deployed yet";
}

/**
 * Deposit test ETH into the escrow contract (v1.2 scaffold — not wired as primary lock path yet).
 * Treasury direct transfer remains the active lock flow until escrow integration lands.
 */
export async function sendEscrowDepositStakeTx(
  chipAmount: number,
  account: Address,
  chainId: number,
  valueWei: bigint,
): Promise<EscrowDepositTxResult> {
  if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
    throw new Error("Escrow deposits are only allowed on Base Sepolia.");
  }

  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) {
    throw new Error("Testnet escrow address is not configured.");
  }

  if (chipAmount <= 0) {
    throw new Error("Chip amount must be greater than zero.");
  }

  if (valueWei <= BigInt(0)) {
    throw new Error("Stake amount must be greater than zero.");
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[escrowContract] depositStake preflight", {
      chainId,
      escrowAddress,
      chipAmount,
      valueWei: valueWei.toString(),
    });
  }

  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });
  if (!walletClient) {
    throw new Error("Wallet not connected.");
  }

  const hash = await walletClient.sendTransaction({
    account,
    to: escrowAddress,
    data: encodeFunctionData({
      abi: TEST_STAKE_ESCROW_ABI,
      functionName: "depositStake",
      args: [BigInt(chipAmount)],
    }),
    value: valueWei,
    chain: baseSepolia,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  if (receipt.status !== "success") {
    throw new Error("Escrow deposit transaction failed on Base Sepolia.");
  }

  let sessionId = BigInt(0);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: TEST_STAKE_ESCROW_ABI,
        eventName: "StakeDeposited",
        data: log.data,
        topics: log.topics,
      });
      sessionId = decoded.args.sessionId;
      break;
    } catch {
      // unrelated log
    }
  }

  return { hash, sessionId };
}
