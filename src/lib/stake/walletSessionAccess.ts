import {
  isStakeSessionActive,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";

export const WALLET_DISCONNECTED_TITLE = "Wallet disconnected";
export const WALLET_DISCONNECTED_BODY =
  "Connect wallet to continue your test stake session.";
export const WALLET_MISMATCH_BODY =
  "This test stake session belongs to another wallet. Connect the deposit wallet to continue.";
export const CONNECT_WALLET_TO_CONTINUE = "Connect wallet to continue.";

export function normalizeWalletAddress(
  address?: string | null,
): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function isEscrowDepositSession(
  meta: StakeSessionMeta | null | undefined,
): boolean {
  return meta?.lockSettlement === "escrow-deposit";
}

export function doesWalletOwnSession(
  meta: StakeSessionMeta | null | undefined,
  walletAddress?: string | null,
): boolean {
  if (!meta) return false;
  if (!isEscrowDepositSession(meta)) return true;

  const owner = normalizeWalletAddress(meta.walletAddress);
  const wallet = normalizeWalletAddress(walletAddress);
  return Boolean(owner && wallet && owner === wallet);
}

export function canAccessEscrowSession(
  isConnected: boolean,
  walletAddress: string | undefined | null,
  meta: StakeSessionMeta | null | undefined,
): boolean {
  if (!isConnected || !walletAddress) return false;
  if (!isEscrowDepositSession(meta)) return true;
  return doesWalletOwnSession(meta, walletAddress);
}

export function hasStoredActiveStakeSession(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
): boolean {
  return Boolean(meta && paymentSuccess && isStakeSessionActive(meta));
}

export function shouldShowWalletDisconnectedEscrowState(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
  isConnected: boolean,
): boolean {
  return (
    hasStoredActiveStakeSession(meta, paymentSuccess) &&
    isEscrowDepositSession(meta) &&
    !isConnected
  );
}

export function shouldShowWalletMismatchEscrowState(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
  isConnected: boolean,
  walletAddress?: string | null,
): boolean {
  return (
    hasStoredActiveStakeSession(meta, paymentSuccess) &&
    isEscrowDepositSession(meta) &&
    isConnected &&
    !doesWalletOwnSession(meta, walletAddress)
  );
}

export function isEscrowSessionUiActive(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
  isConnected: boolean,
  walletAddress?: string | null,
): boolean {
  if (!hasStoredActiveStakeSession(meta, paymentSuccess)) return false;
  if (!isEscrowDepositSession(meta)) return true;
  return canAccessEscrowSession(isConnected, walletAddress ?? undefined, meta);
}

export function canUseEscrowPayoutActions(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
  isConnected: boolean,
  walletAddress?: string | null,
): boolean {
  return isEscrowSessionUiActive(meta, paymentSuccess, isConnected, walletAddress);
}

export function canPlayEscrowSession(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean | undefined,
  isConnected: boolean,
  walletAddress?: string | null,
): boolean {
  return isEscrowSessionUiActive(meta, paymentSuccess, isConnected, walletAddress);
}
