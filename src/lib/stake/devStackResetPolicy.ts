import type { LockSettlement } from "@/lib/stake/stakeSessionStorage";
import {
  resetHeadsUpDemoStacks,
  type SessionStacksState,
} from "@/lib/analytics/sessionStacks";

export function isEscrowBackedStakeSession(
  lockSettlement?: LockSettlement | string | null,
): boolean {
  return lockSettlement === "escrow-deposit";
}

/** Dev-only stack reset is never offered in an active escrow-backed session. */
export function shouldShowDevStackReset(options: {
  isDevelopment: boolean;
  lockSettlement?: LockSettlement | string | null;
  playerBusted: boolean;
}): boolean {
  if (!options.isDevelopment || !options.playerBusted) return false;
  if (isEscrowBackedStakeSession(options.lockSettlement)) return false;
  return true;
}

/**
 * Dev-only helper — restores mock/local demo stacks.
 * Returns null for escrow-backed sessions so player chips cannot be refilled
 * without a new deposit.
 */
export function devResetHeadsUpStacks(
  stacks: SessionStacksState,
  startingChips: number,
  lockSettlement?: LockSettlement | string | null,
): SessionStacksState | null {
  if (isEscrowBackedStakeSession(lockSettlement)) return null;
  return resetHeadsUpDemoStacks(stacks, startingChips);
}

/** Player at 0 chips must start a new stake session (deposit/mock) for more chips. */
export function requiresNewStakeSessionForChips(humanChips: number): boolean {
  return humanChips <= 0;
}
