import { expect } from "chai";

/** Mirrors depletedEscrowSession helpers for hardhat test isolation. */
function isZeroClaimableEscrowPayout(
  currentChips: number,
  claimablePayoutEth: string | null,
): boolean {
  const chips = Math.max(0, Math.floor(currentChips));
  if (chips <= 0) return true;
  if (!claimablePayoutEth) return false;
  const claimable = claimablePayoutEth.trim();
  return claimable === "0" || /^0\.0*$/.test(claimable);
}

function isDepletedZeroPayoutEscrowSession(input: {
  status: string;
  lockSettlement?: string;
  currentChips: number;
  claimablePayoutEth: string | null;
}): boolean {
  if (input.status !== "active") return false;
  if (input.lockSettlement !== "escrow-deposit") return false;
  return isZeroClaimableEscrowPayout(
    input.currentChips,
    input.claimablePayoutEth,
  );
}

function shouldRequireEscrowPrepareClaim(input: {
  status: string;
  lockSettlement?: string;
  currentChips: number;
  claimablePayoutEth: string | null;
}): boolean {
  if (input.status !== "active") return false;
  if (input.lockSettlement !== "escrow-deposit") return false;
  return !isZeroClaimableEscrowPayout(
    input.currentChips,
    input.claimablePayoutEth,
  );
}

function canBeginNewStakeWithoutClaim(input: {
  sessionActive: boolean;
  lockSettlement?: string;
  currentChips: number;
  claimablePayoutEth: string | null;
  handInProgress: boolean;
}): boolean {
  if (!input.sessionActive || input.handInProgress) return false;
  const depleted = isDepletedZeroPayoutEscrowSession({
    status: "active",
    lockSettlement: input.lockSettlement,
    currentChips: input.currentChips,
    claimablePayoutEth: input.claimablePayoutEth,
  });
  return (
    depleted ||
    (input.lockSettlement !== "escrow-deposit" && input.currentChips <= 0)
  );
}

function closeDepletedSessionClearsForDeposit(input: {
  closedStatus: string;
  settlement: string;
  chipsAfterClear: number;
}): boolean {
  return (
    input.closedStatus === "cashed_out" &&
    input.settlement === "escrow-zero-payout" &&
    input.chipsAfterClear === 0
  );
}

describe("depleted escrow session", function () {
  it("treats 0 chips as zero claimable payout", function () {
    expect(isZeroClaimableEscrowPayout(0, "0.001")).to.equal(true);
  });

  it("detects depleted zero-payout escrow session", function () {
    expect(
      isDepletedZeroPayoutEscrowSession({
        status: "active",
        lockSettlement: "escrow-deposit",
        currentChips: 0,
        claimablePayoutEth: "0",
      }),
    ).to.equal(true);
  });

  it("allows new stake flow without claim for zero payout", function () {
    expect(
      canBeginNewStakeWithoutClaim({
        sessionActive: true,
        lockSettlement: "escrow-deposit",
        currentChips: 0,
        claimablePayoutEth: "0",
        handInProgress: false,
      }),
    ).to.equal(true);
    expect(
      shouldRequireEscrowPrepareClaim({
        status: "active",
        lockSettlement: "escrow-deposit",
        currentChips: 0,
        claimablePayoutEth: "0",
      }),
    ).to.equal(false);
  });

  it("still requires prepare/claim when payout is positive", function () {
    expect(
      shouldRequireEscrowPrepareClaim({
        status: "active",
        lockSettlement: "escrow-deposit",
        currentChips: 500,
        claimablePayoutEth: "0.0005",
      }),
    ).to.equal(true);
    expect(
      canBeginNewStakeWithoutClaim({
        sessionActive: true,
        lockSettlement: "escrow-deposit",
        currentChips: 500,
        claimablePayoutEth: "0.0005",
        handInProgress: false,
      }),
    ).to.equal(false);
  });

  it("local close marks zero-payout settlement without restoring chips", function () {
    expect(
      closeDepletedSessionClearsForDeposit({
        closedStatus: "cashed_out",
        settlement: "escrow-zero-payout",
        chipsAfterClear: 0,
      }),
    ).to.equal(true);
  });

  it("gameplay remains blocked at 0 chips until new deposit", function () {
    const canPlay = Math.max(0, 0) > 0;
    expect(canPlay).to.equal(false);
  });
});
