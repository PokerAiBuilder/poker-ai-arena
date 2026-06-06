import type { TestStakeAmount } from "@/lib/stake/testnetStake";

export const STAKE_SESSION_STORAGE_KEY = "poker-ai-arena-stake-session-v1";

export type StakeSessionStatus = "active" | "cashed_out";

export type LockTxStatus = "pending" | "confirmed" | "failed" | "mock";

export type LockSettlement = "mock" | "base-sepolia-test-tx";

export type StakeCashOutRecord = {
  cashedOutAt: string;
  cashOutChips: number;
  cashOutTestBalance: number;
  mockWithdrawalId: string;
  walletAddress?: string;
  network: "base-sepolia";
  settlement: "mock withdrawal";
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
  explorerUrl?: string;
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

function normalizeStakeSessionMeta(raw: StakeSessionMeta): StakeSessionMeta {
  return {
    ...raw,
    status: raw.status ?? "active",
    lockTxStatus: raw.lockTxStatus ?? (raw.lockSettlement === "base-sepolia-test-tx" ? "pending" : "mock"),
    lockSettlement: raw.lockSettlement ?? "mock",
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

export function isStakeSessionActive(meta: StakeSessionMeta | null): boolean {
  return meta?.status === "active";
}

export function isStakeSessionCashedOut(meta: StakeSessionMeta | null): boolean {
  return meta?.status === "cashed_out";
}
