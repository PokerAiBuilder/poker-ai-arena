import { isAddress, keccak256, toBytes, type Abi, type Address } from "viem";

/** Minimal ABI for TestStakeEscrow (shared client + server). */
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

export type EscrowSessionStatus = "active" | "resolved" | "claimed" | "refunded";

export const ESCROW_STATUS_MAP: Record<number, EscrowSessionStatus> = {
  0: "active",
  1: "resolved",
  2: "claimed",
  3: "refunded",
};

export type EscrowOnChainSession = {
  player: Address;
  stakeAmount: bigint;
  chipAmount: bigint;
  status: EscrowSessionStatus;
  createdAt: bigint;
  payoutAmount: bigint;
  resultHash: `0x${string}`;
};

export function mapEscrowSession(raw: {
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

export function getEscrowContractAddress(): Address | null {
  const raw =
    process.env.TESTNET_ESCROW_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw;
}

export function buildEscrowResultHash(
  sessionId: string | bigint,
  currentChips: number,
): `0x${string}` {
  return keccak256(
    toBytes(`escrow-session-${sessionId.toString()}-chips-${currentChips}`),
  );
}
