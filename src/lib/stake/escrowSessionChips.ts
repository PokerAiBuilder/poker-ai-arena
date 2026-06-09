import { MAX_CHIP_MULTIPLIER } from "@/lib/arena/arenaSessionValidation";
import {
  findMostRecentActiveWalletBackedSession,
  isWalletBackedLockSettlement,
} from "@/lib/stake/stakeSessionPersistence";
import type { StakeSessionMeta } from "@/lib/stake/stakeSessionStorage";

export type EscrowChipRestoreSource = "server" | "local" | "starting";

export type ResolvedEscrowChips = {
  currentChips: number;
  source: EscrowChipRestoreSource;
};

function sanitizeChipCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function isValidCurrentChips(currentChips: number, startingChips: number): boolean {
  const starting = sanitizeChipCount(startingChips);
  if (starting <= 0) return false;
  const chips = sanitizeChipCount(currentChips);
  return chips <= starting * MAX_CHIP_MULTIPLIER;
}

export function withEscrowCurrentChips(
  meta: StakeSessionMeta,
  currentChips: number,
): StakeSessionMeta {
  return {
    ...meta,
    currentChips: sanitizeChipCount(currentChips),
  };
}

export function ensureEscrowMetaHasCurrentChips(
  meta: StakeSessionMeta,
): StakeSessionMeta {
  if (!isWalletBackedLockSettlement(meta)) return meta;
  if (meta.currentChips != null && Number.isFinite(meta.currentChips)) {
    return withEscrowCurrentChips(meta, meta.currentChips);
  }
  return withEscrowCurrentChips(meta, meta.startingChips);
}

/**
 * Restore priority: server currentChips → local meta.currentChips → startingChips.
 * startingChips always remains the original stake tier amount on meta.
 */
export function resolveEscrowCurrentChips(input: {
  startingChips: number;
  localCurrentChips?: number | null;
  serverCurrentChips?: number | null;
}): ResolvedEscrowChips {
  const startingChips = sanitizeChipCount(input.startingChips);

  if (
    input.serverCurrentChips != null &&
    Number.isFinite(input.serverCurrentChips) &&
    isValidCurrentChips(input.serverCurrentChips, startingChips)
  ) {
    return {
      currentChips: sanitizeChipCount(input.serverCurrentChips),
      source: "server",
    };
  }

  if (
    input.localCurrentChips != null &&
    Number.isFinite(input.localCurrentChips) &&
    isValidCurrentChips(input.localCurrentChips, startingChips)
  ) {
    return {
      currentChips: sanitizeChipCount(input.localCurrentChips),
      source: "local",
    };
  }

  return {
    currentChips: startingChips,
    source: "starting",
  };
}

/** Preserve escrow chip balance before mock session overwrites shared session stacks. */
export function snapshotEscrowChipsBeforeMockSession(
  humanChips: number,
  escrowSessions: StakeSessionMeta[],
): StakeSessionMeta[] {
  const activeEscrow = findMostRecentActiveWalletBackedSession(escrowSessions);
  if (!activeEscrow) return [];

  const chips = sanitizeChipCount(humanChips);
  if (activeEscrow.currentChips === chips) return [];

  return [withEscrowCurrentChips(activeEscrow, chips)];
}
