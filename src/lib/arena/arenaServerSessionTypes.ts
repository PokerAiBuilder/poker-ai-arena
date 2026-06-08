export type ArenaServerSessionStatus =
  | "active"
  | "depleted"
  | "resolved"
  | "claimed"
  | "closed";

export type ArenaServerSession = {
  walletAddress: string;
  escrowSessionId: string;
  stakeAmountWei: string;
  startingChips: number;
  currentChips: number;
  lockSettlement: "escrow-deposit";
  depositTxHash: string;
  resolveTxHash?: string;
  claimTxHash?: string;
  status: ArenaServerSessionStatus;
  createdAt: string;
  updatedAt: string;
};

export const ARENA_SERVER_SESSION_STATUSES: ArenaServerSessionStatus[] = [
  "active",
  "depleted",
  "resolved",
  "claimed",
  "closed",
];

/** Shown in API responses — in-memory store is temporary for demo/Vercel. */
export const ARENA_SERVER_SESSION_STORE_NOTE =
  "Temporary in-memory arena session store. Replace with DB/Prisma for production.";
