/**
 * Escrow payout for v1.2.0-d testnet — proportional to chip performance.
 *
 * Formula:
 *   payoutWei = floor(currentChips / startingChips * stakeAmountWei)
 *
 * Capped to the escrow contract's available native balance so claims never
 * exceed on-chain funds. Starting/ current chips come from Human vs AI session
 * state; stakeAmountWei comes from the on-chain escrow session deposit.
 */

export type EscrowPayoutLiquidity = {
  estimatedPayoutWei: bigint;
  cappedPayoutWei: bigint;
  wasPayoutCapped: boolean;
  escrowBalanceWei: bigint;
};

/** Chip-proportional payout before escrow liquidity cap. */
export function computeUncappedEscrowPayoutWei(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
): bigint {
  if (startingChips <= 0 || stakeAmountWei <= BigInt(0)) {
    return BigInt(0);
  }

  const safeChips = Math.max(0, Math.floor(currentChips));
  return (BigInt(safeChips) * stakeAmountWei) / BigInt(startingChips);
}

export function computeEscrowPayoutLiquidity(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
  escrowBalanceWei: bigint,
): EscrowPayoutLiquidity {
  const estimatedPayoutWei = computeUncappedEscrowPayoutWei(
    currentChips,
    startingChips,
    stakeAmountWei,
  );

  let cappedPayoutWei: bigint;
  if (escrowBalanceWei <= BigInt(0)) {
    cappedPayoutWei = BigInt(0);
  } else {
    cappedPayoutWei =
      estimatedPayoutWei > escrowBalanceWei
        ? escrowBalanceWei
        : estimatedPayoutWei;
  }

  const wasPayoutCapped =
    estimatedPayoutWei > cappedPayoutWei && estimatedPayoutWei > BigInt(0);

  return {
    estimatedPayoutWei,
    cappedPayoutWei,
    wasPayoutCapped,
    escrowBalanceWei,
  };
}

export function computeEscrowPayoutWei(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
  contractBalanceWei: bigint,
): bigint {
  return computeEscrowPayoutLiquidity(
    currentChips,
    startingChips,
    stakeAmountWei,
    contractBalanceWei,
  ).cappedPayoutWei;
}

export function formatEscrowPayoutEth(payoutWei: bigint): string {
  const whole = payoutWei / BigInt(10 ** 18);
  const frac = payoutWei % BigInt(10 ** 18);
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
}
