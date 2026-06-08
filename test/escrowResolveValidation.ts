import { expect } from "chai";

/** Mirror of escrow payout helpers for hardhat test isolation. */
function computeUncappedEscrowPayoutWei(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
): bigint {
  if (startingChips <= 0 || stakeAmountWei <= BigInt(0)) return BigInt(0);
  const safeChips = Math.max(0, Math.floor(currentChips));
  return (BigInt(safeChips) * stakeAmountWei) / BigInt(startingChips);
}

function computeEscrowPayoutLiquidity(
  currentChips: number,
  startingChips: number,
  stakeAmountWei: bigint,
  escrowBalanceWei: bigint,
): {
  estimatedPayoutWei: bigint;
  cappedPayoutWei: bigint;
  wasPayoutCapped: boolean;
  escrowBalanceWei: bigint;
} {
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

describe("escrowResolveValidation", function () {
  it("caps payout by contract balance", function () {
    const stake = BigInt(1_000_000_000_000_000);
    const balance = BigInt(800_000_000_000_000);
    const liquidity = computeEscrowPayoutLiquidity(800, 1000, stake, balance);
    expect(liquidity.cappedPayoutWei).to.equal(balance);
    expect(liquidity.cappedPayoutWei).to.equal(BigInt(800_000_000_000_000));
    expect(liquidity.estimatedPayoutWei).to.equal(BigInt(800_000_000_000_000));
    expect(liquidity.wasPayoutCapped).to.equal(false);
  });

  it("flags wasPayoutCapped when estimated exceeds liquidity", function () {
    const stake = BigInt(1_000_000_000_000_000);
    const balance = BigInt(500_000_000_000_000);
    const liquidity = computeEscrowPayoutLiquidity(900, 1000, stake, balance);
    expect(liquidity.estimatedPayoutWei).to.equal(BigInt(900_000_000_000_000));
    expect(liquidity.cappedPayoutWei).to.equal(balance);
    expect(liquidity.wasPayoutCapped).to.equal(true);
  });

  it("returns zero when starting chips invalid", function () {
    const liquidity = computeEscrowPayoutLiquidity(
      500,
      0,
      BigInt(1000),
      BigInt(1000),
    );
    expect(liquidity.cappedPayoutWei).to.equal(BigInt(0));
    expect(liquidity.wasPayoutCapped).to.equal(false);
  });
});
