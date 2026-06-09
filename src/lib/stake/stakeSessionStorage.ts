import type { TestStakeAmount } from "@/lib/stake/testnetStake";
import {
  isMockLockSettlement,
  isWalletBackedLockSettlement,
  resolveActiveStakeSession,
  walletBackedSessionKey,
} from "@/lib/stake/stakeSessionPersistence";

/** @deprecated Legacy single-session key — migrated into split stores on read. */
export const STAKE_SESSION_STORAGE_KEY = "poker-ai-arena-stake-session-v1";
export const ESCROW_SESSIONS_STORAGE_KEY =
  "poker-ai-arena-escrow-sessions-v2";
export const MOCK_SESSION_STORAGE_KEY = "poker-ai-arena-mock-session-v2";
export const STAKE_SESSION_HISTORY_KEY =
  "poker-ai-arena-stake-session-history-v1";

type EscrowSessionMap = Record<string, StakeSessionMeta>;

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
  /** Live Human vs AI balance for wallet-backed sessions (escrow restore). */
  currentChips?: number;
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

function isValidStakeSessionMeta(parsed: unknown): parsed is StakeSessionMeta {
  if (!parsed || typeof parsed !== "object") return false;
  const meta = parsed as StakeSessionMeta;
  return (
    typeof meta.stakeAmount === "string" &&
    typeof meta.startingChips === "number" &&
    typeof meta.lockedAt === "string"
  );
}

function readEscrowSessionMap(): EscrowSessionMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(ESCROW_SESSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EscrowSessionMap;
    if (!parsed || typeof parsed !== "object") return {};

    const map: EscrowSessionMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isValidStakeSessionMeta(value)) {
        map[key] = normalizeStakeSessionMeta(value);
      }
    }
    return map;
  } catch {
    return {};
  }
}

function writeEscrowSessionMap(map: EscrowSessionMap): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ESCROW_SESSIONS_STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.warn("[stake/stakeSessionStorage] escrow save failed", error);
  }
}

function migrateLegacyStakeSessionIfNeeded(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(STAKE_SESSION_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as StakeSessionMeta;
    if (!isValidStakeSessionMeta(parsed)) {
      window.localStorage.removeItem(STAKE_SESSION_STORAGE_KEY);
      return;
    }

    const meta = normalizeStakeSessionMeta(parsed);
    if (isMockLockSettlement(meta)) {
      saveMockStakeSession(meta);
    } else if (isWalletBackedLockSettlement(meta)) {
      saveEscrowStakeSession(meta);
    }

    window.localStorage.removeItem(STAKE_SESSION_STORAGE_KEY);
  } catch {
    window.localStorage.removeItem(STAKE_SESSION_STORAGE_KEY);
  }
}

export function loadAllEscrowStakeSessions(): StakeSessionMeta[] {
  migrateLegacyStakeSessionIfNeeded();
  return Object.values(readEscrowSessionMap());
}

export function loadMockStakeSession(): StakeSessionMeta | null {
  migrateLegacyStakeSessionIfNeeded();
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(MOCK_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StakeSessionMeta;
    if (!isValidStakeSessionMeta(parsed)) return null;
    return normalizeStakeSessionMeta(parsed);
  } catch {
    return null;
  }
}

export function saveEscrowStakeSession(meta: StakeSessionMeta): void {
  const key = walletBackedSessionKey(meta);
  if (!key) return;

  const map = readEscrowSessionMap();
  map[key] = normalizeStakeSessionMeta(meta);
  writeEscrowSessionMap(map);
}

export function saveMockStakeSession(meta: StakeSessionMeta): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      MOCK_SESSION_STORAGE_KEY,
      JSON.stringify(normalizeStakeSessionMeta(meta)),
    );
  } catch (error) {
    console.warn("[stake/stakeSessionStorage] mock save failed", error);
  }
}

export function clearMockStakeSession(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function clearEscrowStakeSession(meta: StakeSessionMeta): void {
  const key = walletBackedSessionKey(meta);
  if (!key) return;

  const map = readEscrowSessionMap();
  delete map[key];
  writeEscrowSessionMap(map);
}

export function clearAllStakeSessionStores(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STAKE_SESSION_STORAGE_KEY);
    window.localStorage.removeItem(ESCROW_SESSIONS_STORAGE_KEY);
    window.localStorage.removeItem(MOCK_SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function resolveStakeSessionForWallet(
  isConnected: boolean,
  walletAddress?: string | null,
): StakeSessionMeta | null {
  migrateLegacyStakeSessionIfNeeded();
  return resolveActiveStakeSession({
    isConnected,
    walletAddress,
    escrowSessions: loadAllEscrowStakeSessions(),
    mockSession: loadMockStakeSession(),
  });
}

export function loadStakeSessionMeta(
  isConnected = false,
  walletAddress?: string | null,
): StakeSessionMeta | null {
  return resolveStakeSessionForWallet(isConnected, walletAddress);
}

export function saveStakeSessionMeta(meta: StakeSessionMeta): void {
  const normalized = normalizeStakeSessionMeta(meta);
  if (isMockLockSettlement(normalized)) {
    saveMockStakeSession(normalized);
    return;
  }
  if (isWalletBackedLockSettlement(normalized)) {
    saveEscrowStakeSession(normalized);
  }
}

export function clearStakeSessionMeta(meta?: StakeSessionMeta | null): void {
  if (!meta) {
    clearMockStakeSession();
    return;
  }

  if (isMockLockSettlement(meta)) {
    clearMockStakeSession();
    return;
  }

  if (isWalletBackedLockSettlement(meta)) {
    clearEscrowStakeSession(meta);
  }
}

/** @deprecated Use clearAllStakeSessionStores */
export function clearLegacyStakeSessionMeta(): void {
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
