import type { EscrowPayoutUiInfo } from "@/lib/stake/escrowLiquidityPreview";
import {
  createEscrowCashOutRecord,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";
import { chipsToTestBalance } from "@/lib/stake/testnetStake";

/** Claimable escrow payout is zero (preview shows 0 ETH). */
export function isZeroClaimableEscrowPayout(
  currentChips: number,
  escrowPayoutUi: EscrowPayoutUiInfo | null,
): boolean {
  const chips = Math.max(0, Math.floor(currentChips));
  if (!escrowPayoutUi) return chips <= 0;
  const claimable = escrowPayoutUi.claimablePayoutEth.trim();
  return claimable === "0" || /^0\.0*$/.test(claimable);
}

/** Active escrow session with no chips and nothing to claim. */
export function isDepletedZeroPayoutEscrowSession(
  meta: StakeSessionMeta | null,
  currentChips: number,
  escrowPayoutUi: EscrowPayoutUiInfo | null,
): boolean {
  if (!meta || meta.status !== "active") return false;
  if (meta.lockSettlement !== "escrow-deposit") return false;
  return isZeroClaimableEscrowPayout(currentChips, escrowPayoutUi);
}

/** Positive payout still requires Prepare → Claim before a new deposit. */
export function shouldRequireEscrowPrepareClaim(
  meta: StakeSessionMeta | null,
  currentChips: number,
  escrowPayoutUi: EscrowPayoutUiInfo | null,
): boolean {
  if (!meta || meta.status !== "active") return false;
  if (meta.lockSettlement !== "escrow-deposit") return false;
  return !isZeroClaimableEscrowPayout(currentChips, escrowPayoutUi);
}

/** Locally close a busted escrow session with zero on-chain payout. */
export function closeDepletedZeroPayoutEscrowSession(
  meta: StakeSessionMeta,
  currentChips: number,
  walletAddress?: string,
): StakeSessionMeta {
  const chips = Math.max(0, Math.floor(currentChips));
  const testBalance = chipsToTestBalance(chips);
  const cashOut = createEscrowCashOutRecord(chips, testBalance, walletAddress, {
    zeroPayout: true,
  });

  return {
    ...meta,
    status: "cashed_out",
    cashOut,
    claimStatus: "not-applicable",
  };
}
