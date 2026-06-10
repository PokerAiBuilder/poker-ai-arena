export type ArenaServerSessionStatus =
  | "active"
  | "depleted"
  | "resolved"
  | "claimed"
  | "closed";

export type ArenaServerHandWinner = "human" | "ai";

export type ArenaServerHandRecord = {
  handId: string;
  walletAddress: string;
  escrowSessionId: string;
  mode: "human-vs-ai";
  winner: ArenaServerHandWinner;
  pot: number;
  chipDelta: number;
  finalChips: number;
  resultLabel?: string;
  completedAt: string;
};

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
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
  recentHands?: ArenaServerHandRecord[];
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
  "Temporary in-memory arena session store (includes recent hand history). TODO: persist with DB/Prisma/Supabase/Neon.";
