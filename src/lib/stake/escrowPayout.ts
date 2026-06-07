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
export function computeEscrowPayoutWei(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
  contractBalanceWei: bigint,
): bigint {
  if (startingChips <= 0 || stakeAmountWei <= BigInt(0)) {
    return BigInt(0);
  }

  const safeChips = Math.max(0, Math.floor(currentChips));
  const payout =
    (BigInt(safeChips) * stakeAmountWei) / BigInt(startingChips);

  if (contractBalanceWei <= BigInt(0)) {
    return BigInt(0);
  }

  return payout > contractBalanceWei ? contractBalanceWei : payout;
}

export function formatEscrowPayoutEth(payoutWei: bigint): string {
  const whole = payoutWei / BigInt(10 ** 18);
  const frac = payoutWei % BigInt(10 ** 18);
  const fracStr = frac.toString().padStart(18, "0").replace(/0+$/, "");
  return fracStr.length > 0 ? `${whole}.${fracStr}` : whole.toString();
}
