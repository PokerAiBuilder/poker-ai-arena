import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";

function isStakeSessionActive(meta: StakeSessionMeta | null | undefined): boolean {
  return meta?.status === "active";
}

export function normalizeWalletAddress(
  address?: string | null,
): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function isMockLockSettlement(meta: StakeSessionMeta): boolean {
  return meta.lockSettlement === "mock";
}

export function isWalletBackedLockSettlement(meta: StakeSessionMeta): boolean {
  return (
    meta.lockSettlement === "escrow-deposit" ||
    meta.lockSettlement === "base-sepolia-test-tx"
  );
}

/** Stable storage key for wallet-backed sessions (escrow session id or lock tx hash). */
export function walletBackedSessionKey(meta: StakeSessionMeta): string | null {
  if (!isWalletBackedLockSettlement(meta)) return null;

  const wallet = normalizeWalletAddress(meta.walletAddress);
  if (!wallet) return null;

  const sessionId = meta.escrowSessionId ?? meta.lockTxHash;
  if (!sessionId) return null;

  return `${wallet}:${sessionId}`;
}

export function findActiveEscrowForWallet(
  sessions: StakeSessionMeta[],
  walletAddress?: string | null,
): StakeSessionMeta | null {
  const wallet = normalizeWalletAddress(walletAddress);
  if (!wallet) return null;

  const matches = sessions.filter(
    (meta) =>
      isStakeSessionActive(meta) &&
      isWalletBackedLockSettlement(meta) &&
      normalizeWalletAddress(meta.walletAddress) === wallet,
  );

  if (matches.length === 0) return null;

  return matches.sort((a, b) => b.lockedAt.localeCompare(a.lockedAt))[0];
}

export function findMostRecentActiveWalletBackedSession(
  sessions: StakeSessionMeta[],
): StakeSessionMeta | null {
  const active = sessions.filter(
    (meta) => isStakeSessionActive(meta) && isWalletBackedLockSettlement(meta),
  );
  if (active.length === 0) return null;
  return active.sort((a, b) => b.lockedAt.localeCompare(a.lockedAt))[0];
}

export type StakeSessionResolutionInput = {
  isConnected: boolean;
  walletAddress?: string | null;
  escrowSessions: StakeSessionMeta[];
  mockSession: StakeSessionMeta | null;
};

/**
 * Pick which stake session drives arena UI.
 * Escrow for the connected wallet wins over an active mock session on reconnect.
 */
export function resolveActiveStakeSession(
  input: StakeSessionResolutionInput,
): StakeSessionMeta | null {
  const wallet = normalizeWalletAddress(input.walletAddress);
  const activeMock =
    input.mockSession && isStakeSessionActive(input.mockSession)
      ? input.mockSession
      : null;

  if (input.isConnected && wallet) {
    const walletEscrow = findActiveEscrowForWallet(
      input.escrowSessions,
      wallet,
    );
    if (walletEscrow) return walletEscrow;
    if (activeMock) return activeMock;
    return null;
  }

  if (activeMock) return activeMock;

  return findMostRecentActiveWalletBackedSession(input.escrowSessions);
}

export function canStartMockSessionWhileStored(
  isConnected: boolean,
  walletAddress: string | undefined | null,
  escrowSessions: StakeSessionMeta[],
): boolean {
  if (!isConnected || !walletAddress) return true;
  return !findActiveEscrowForWallet(escrowSessions, walletAddress);
}

export function shouldRestoreEscrowOnReconnect(
  previousMeta: StakeSessionMeta | null | undefined,
  resolvedMeta: StakeSessionMeta | null | undefined,
): boolean {
  if (!resolvedMeta || !isWalletBackedLockSettlement(resolvedMeta)) return false;
  if (!isStakeSessionActive(resolvedMeta)) return false;
  if (!previousMeta || isMockLockSettlement(previousMeta)) return true;
  if (
    isWalletBackedLockSettlement(previousMeta) &&
    walletBackedSessionKey(previousMeta) !== walletBackedSessionKey(resolvedMeta)
  ) {
    return true;
  }
  return false;
}
