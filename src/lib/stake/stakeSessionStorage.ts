import type { TestStakeAmount } from "@/lib/stake/testnetStake";

export const STAKE_SESSION_STORAGE_KEY = "poker-ai-arena-stake-session-v1";
export const STAKE_SESSION_HISTORY_KEY =
  "poker-ai-arena-stake-session-history-v1";

export type StakeSessionStatus = "active" | "cashed_out";

export type LockTxStatus = "pending" | "confirmed" | "failed" | "mock";

export type LockSettlement = "mock" | "base-sepolia-test-tx" | "escrow-deposit";

export type ClaimStatus =
  | "none"
  | "pending"
  | "confirmed"
  | "failed"
  | "not-applicable";

export type CashOutSettlement =
  | "mock withdrawal"
  | "escrow-claim"
  | "escrow-zero-payout"
  | "treasury-record";

export type StakeCashOutRecord = {
  cashedOutAt: string;
  cashOutChips: number;
  cashOutTestBalance: number;
  mockWithdrawalId?: string;
  walletAddress?: string;
  network: "base-sepolia";
  settlement: CashOutSettlement;
  claimTxHash?: string;
  claimExplorerUrl?: string;
  claimedEthAmount?: string;
};

export type StakeSessionMeta = {
  stakeAmount: TestStakeAmount;
  startingChips: number;
  lockedAt: string;
  status: StakeSessionStatus;
  cashOut?: StakeCashOutRecord;
  lockTxHash?: string;
  lockTxStatus?: LockTxStatus;
  lockSettlement?: LockSettlement;
  treasuryAddress?: string;
  escrowAddress?: string;
  escrowSessionId?: string;
  walletAddress?: string;
  explorerUrl?: string;
  escrowResolved?: boolean;
  escrowResult?: string;
  escrowPayoutAmount?: string;
  escrowEstimatedPayoutWei?: string;
  escrowCappedPayoutWei?: string;
  escrowPayoutWasCapped?: boolean;
  escrowBalanceWei?: string;
  escrowResolveTxHash?: string;
  escrowClaimTxHash?: string;
  claimStatus?: ClaimStatus;
};

function generateMockWithdrawalId(): string {
  return `mock_wd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createMockCashOutRecord(
  chips: number,
  testBalance: number,
  walletAddress?: string,
): StakeCashOutRecord {
  return {
    cashedOutAt: new Date().toISOString(),
    cashOutChips: chips,
    cashOutTestBalance: testBalance,
    mockWithdrawalId: generateMockWithdrawalId(),
    walletAddress,
    network: "base-sepolia",
    settlement: "mock withdrawal",
  };
}

export function createTreasuryCashOutRecord(
  chips: number,
  testBalance: number,
  walletAddress?: string,
): StakeCashOutRecord {
  return {
    cashedOutAt: new Date().toISOString(),
    cashOutChips: chips,
    cashOutTestBalance: testBalance,
    walletAddress,
    network: "base-sepolia",
    settlement: "treasury-record",
  };
}

export function createEscrowCashOutRecord(
  chips: number,
  testBalance: number,
  walletAddress: string | undefined,
  options: {
    claimTxHash?: string;
    claimExplorerUrl?: string;
    claimedEthAmount?: string;
    zeroPayout?: boolean;
  },
): StakeCashOutRecord {
  return {
    cashedOutAt: new Date().toISOString(),
    cashOutChips: chips,
    cashOutTestBalance: testBalance,
    walletAddress,
    network: "base-sepolia",
    settlement: options.zeroPayout ? "escrow-zero-payout" : "escrow-claim",
    claimTxHash: options.claimTxHash,
    claimExplorerUrl: options.claimExplorerUrl,
    claimedEthAmount: options.claimedEthAmount,
  };
}

function normalizeStakeSessionMeta(raw: StakeSessionMeta): StakeSessionMeta {
  return {
    ...raw,
    status: raw.status ?? "active",
    lockTxStatus:
      raw.lockTxStatus ??
      (raw.lockSettlement === "base-sepolia-test-tx" ||
      raw.lockSettlement === "escrow-deposit"
        ? "pending"
        : "mock"),
    lockSettlement: raw.lockSettlement ?? "mock",
    claimStatus: raw.claimStatus ?? "none",
  };
}

export function loadStakeSessionMeta(): StakeSessionMeta | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STAKE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StakeSessionMeta;
    if (
      !parsed ||
      typeof parsed.stakeAmount !== "string" ||
      typeof parsed.startingChips !== "number" ||
      typeof parsed.lockedAt !== "string"
    ) {
      return null;
    }
    return normalizeStakeSessionMeta(parsed);
  } catch {
    return null;
  }
}

export function saveStakeSessionMeta(meta: StakeSessionMeta): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STAKE_SESSION_STORAGE_KEY,
      JSON.stringify(normalizeStakeSessionMeta(meta)),
    );
  } catch (error) {
    console.warn("[stake/stakeSessionStorage] save failed", error);
  }
}

export function clearStakeSessionMeta(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STAKE_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadStakeSessionHistory(): StakeSessionMeta[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STAKE_SESSION_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StakeSessionMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Preserve closed session metadata before starting a new deposit. */
export function appendStakeSessionHistory(meta: StakeSessionMeta): void {
  if (typeof window === "undefined") return;

  try {
    const history = loadStakeSessionHistory();
    history.unshift(normalizeStakeSessionMeta(meta));
    window.localStorage.setItem(
      STAKE_SESSION_HISTORY_KEY,
      JSON.stringify(history.slice(0, 20)),
    );
  } catch (error) {
    console.warn("[stake/stakeSessionStorage] history append failed", error);
  }
}

export function isStakeSessionActive(meta: StakeSessionMeta | null): boolean {
  return meta?.status === "active";
}

export function isStakeSessionCashedOut(meta: StakeSessionMeta | null): boolean {
  return meta?.status === "cashed_out";
}
