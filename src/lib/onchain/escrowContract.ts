"use client";

import {
  getPublicClient,
  getWalletClient,
  readContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import {
  decodeEventLog,
  encodeFunctionData,
  isAddress,
  keccak256,
  toBytes,
  type Abi,
  type Address,
  type Hash,
} from "viem";
import { baseSepolia, BASE_SEPOLIA_CHAIN_ID } from "@/lib/onchain/chains";
import { getBaseSepoliaExplorerAddressUrl, getBaseSepoliaExplorerTxUrl } from "@/lib/onchain/baseSepolia";
import { wagmiConfig } from "@/lib/onchain/wagmiConfig";

/** Minimal ABI for TestStakeEscrow (deposit, resolve, claim, read). */
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
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
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

import type { LockStakeTxPhase } from "@/lib/stake/lockTestStakeTx";

export type EscrowDepositTxResult = {
  hash: Hash;
  sessionId: bigint;
};

export type EscrowDepositPhase = LockStakeTxPhase;

export type EscrowSessionStatus = "active" | "resolved" | "claimed" | "refunded";

export type EscrowOnChainSession = {
  player: Address;
  stakeAmount: bigint;
  chipAmount: bigint;
  status: EscrowSessionStatus;
  createdAt: bigint;
  payoutAmount: bigint;
  resultHash: `0x${string}`;
};

export type EscrowResolveTxResult = {
  hash: Hash;
  resultHash: `0x${string}`;
  payoutAmount: bigint;
};

export type EscrowClaimTxResult = {
  hash: Hash;
  claimedAmount: bigint;
};

const ESCROW_STATUS_MAP: Record<number, EscrowSessionStatus> = {
  0: "active",
  1: "resolved",
  2: "claimed",
  3: "refunded",
};

export function getTestnetEscrowAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw;
}

export function isEscrowConfigured(): boolean {
  return getTestnetEscrowAddress() !== null;
}

export function isEscrowDevMode(): boolean {
  return process.env.NODE_ENV === "development";
}

export function getEscrowExplorerUrl(): string | null {
  return getEscrowExplorerAddressUrl();
}

export function getEscrowExplorerAddressUrl(): string | null {
  const address = getTestnetEscrowAddress();
  if (!address) return null;
  return getBaseSepoliaExplorerAddressUrl(address);
}

export function getEscrowTxUrl(hash: string): string {
  return getBaseSepoliaExplorerTxUrl(hash);
}

export function getEscrowStatusLabel(): string {
  return isEscrowConfigured()
    ? "Escrow contract: configured"
    : "Escrow contract: not deployed yet";
}

export function getEscrowLockPathHint(): string {
  return isEscrowConfigured()
    ? "Escrow contract configured · stake deposits go to escrow"
    : "Escrow not configured · treasury test lock fallback";
}

export function buildEscrowResultHash(
  sessionId: string | bigint,
  currentChips: number,
): `0x${string}` {
  return keccak256(
    toBytes(`escrow-session-${sessionId.toString()}-chips-${currentChips}`),
  );
}

function mapEscrowSession(raw: {
  player: Address;
  stakeAmount: bigint;
  chipAmount: bigint;
  status: number;
  createdAt: bigint;
  payoutAmount: bigint;
  resultHash: `0x${string}`;
}): EscrowOnChainSession {
  return {
    player: raw.player,
    stakeAmount: raw.stakeAmount,
    chipAmount: raw.chipAmount,
    status: ESCROW_STATUS_MAP[raw.status] ?? "active",
    createdAt: raw.createdAt,
    payoutAmount: raw.payoutAmount,
    resultHash: raw.resultHash,
  };
}

export async function readEscrowOwner(): Promise<Address | null> {
  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) return null;

  try {
    const owner = await readContract(wagmiConfig, {
      address: escrowAddress,
      abi: TEST_STAKE_ESCROW_ABI,
      functionName: "owner",
      chainId: BASE_SEPOLIA_CHAIN_ID,
    });
    return owner as Address;
  } catch {
    return null;
  }
}

export async function isEscrowContractOwner(account: Address): Promise<boolean> {
  const owner = await readEscrowOwner();
  return owner != null && owner.toLowerCase() === account.toLowerCase();
}

export async function readEscrowContractBalance(): Promise<bigint> {
  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) return BigInt(0);

  const client = getPublicClient(wagmiConfig, {
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });
  if (!client) return BigInt(0);

  return client.getBalance({ address: escrowAddress });
}

export async function readEscrowSession(
  sessionId: string | bigint,
): Promise<EscrowOnChainSession | null> {
  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) return null;

  const id = BigInt(sessionId);
  if (id <= BigInt(0)) return null;

  try {
    const session = await readContract(wagmiConfig, {
      address: escrowAddress,
      abi: TEST_STAKE_ESCROW_ABI,
      functionName: "getSession",
      args: [id],
      chainId: BASE_SEPOLIA_CHAIN_ID,
    });
    return mapEscrowSession(session as Parameters<typeof mapEscrowSession>[0]);
  } catch {
    return null;
  }
}

/**
 * Deposit test ETH into the escrow contract via depositStake(chipAmount).
 */
export async function sendEscrowDepositStakeTx(
  chipAmount: number,
  account: Address,
  chainId: number,
  valueWei: bigint,
  onPhase?: (phase: EscrowDepositPhase) => void,
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

  onPhase?.("submitted");
  onPhase?.("confirming");

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

export async function resolveEscrowSession(
  sessionId: string | bigint,
  resultHash: `0x${string}`,
  payoutAmountWei: bigint,
  account: Address,
): Promise<EscrowResolveTxResult> {
  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) {
    throw new Error("Testnet escrow address is not configured.");
  }

  const id = BigInt(sessionId);
  if (id <= BigInt(0)) {
    throw new Error("Invalid escrow session id.");
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
      functionName: "resolveSession",
      args: [id, resultHash, payoutAmountWei],
    }),
    chain: baseSepolia,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  if (receipt.status !== "success") {
    throw new Error("Escrow resolve transaction failed on Base Sepolia.");
  }

  return { hash, resultHash, payoutAmount: payoutAmountWei };
}

export async function claimEscrowPayout(
  sessionId: string | bigint,
  account: Address,
): Promise<EscrowClaimTxResult> {
  const escrowAddress = getTestnetEscrowAddress();
  if (!escrowAddress) {
    throw new Error("Testnet escrow address is not configured.");
  }

  const id = BigInt(sessionId);
  if (id <= BigInt(0)) {
    throw new Error("Invalid escrow session id.");
  }

  const onChain = await readEscrowSession(id);
  if (!onChain || onChain.status !== "resolved") {
    throw new Error("Escrow session is not resolved yet.");
  }
  if (onChain.payoutAmount <= BigInt(0)) {
    throw new Error("No payout available for this session.");
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
      functionName: "claimPayout",
      args: [id],
    }),
    chain: baseSepolia,
  });

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });

  if (receipt.status !== "success") {
    throw new Error("Escrow claim transaction failed on Base Sepolia.");
  }

  let claimedAmount = onChain.payoutAmount;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== escrowAddress.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: TEST_STAKE_ESCROW_ABI,
        eventName: "PayoutClaimed",
        data: log.data,
        topics: log.topics,
      });
      claimedAmount = decoded.args.amount;
      break;
    } catch {
      // unrelated log
    }
  }

  return { hash, claimedAmount };
}
