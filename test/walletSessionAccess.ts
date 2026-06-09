import { expect } from "chai";

/** Mirrors walletSessionAccess helpers for hardhat tests. */
type StakeSessionMeta = {
  status: "active" | "cashed_out";
  lockSettlement?: "mock" | "base-sepolia-test-tx" | "escrow-deposit";
  walletAddress?: string;
};

function normalizeWalletAddress(address?: string | null): string | null {
  const trimmed = address?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function isEscrowDepositSession(meta: StakeSessionMeta | null | undefined): boolean {
  return meta?.lockSettlement === "escrow-deposit";
}

function doesWalletOwnSession(
  meta: StakeSessionMeta | null | undefined,
  walletAddress?: string | null,
): boolean {
  if (!meta) return false;
  if (!isEscrowDepositSession(meta)) return true;
  const owner = normalizeWalletAddress(meta.walletAddress);
  const wallet = normalizeWalletAddress(walletAddress);
  return Boolean(owner && wallet && owner === wallet);
}

function canAccessEscrowSession(
  isConnected: boolean,
  walletAddress: string | undefined | null,
  meta: StakeSessionMeta | null | undefined,
): boolean {
  if (!isConnected || !walletAddress) return false;
  if (!isEscrowDepositSession(meta)) return true;
  return doesWalletOwnSession(meta, walletAddress);
}

function canUseEscrowPayoutActions(
  meta: StakeSessionMeta | null | undefined,
  paymentSuccess: boolean,
  isConnected: boolean,
  walletAddress?: string | null,
): boolean {
  if (!meta || !paymentSuccess || meta.status !== "active") return false;
  if (!isEscrowDepositSession(meta)) return true;
  return canAccessEscrowSession(isConnected, walletAddress, meta);
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const escrowMeta: StakeSessionMeta = {
  status: "active",
  lockSettlement: "escrow-deposit",
  walletAddress: walletA,
};

describe("wallet session access helpers", function () {
  it("disconnected wallet does not expose payout actions", function () {
    expect(canUseEscrowPayoutActions(escrowMeta, true, false, walletA)).to.equal(
      false,
    );
    expect(canAccessEscrowSession(false, walletA, escrowMeta)).to.equal(false);
  });

  it("wallet B does not see wallet A active session", function () {
    expect(canAccessEscrowSession(true, walletB, escrowMeta)).to.equal(false);
    expect(doesWalletOwnSession(escrowMeta, walletB)).to.equal(false);
    expect(canUseEscrowPayoutActions(escrowMeta, true, true, walletB)).to.equal(
      false,
    );
  });

  it("reconnecting wallet A restores wallet A session access", function () {
    expect(canAccessEscrowSession(true, walletA, escrowMeta)).to.equal(true);
    expect(canUseEscrowPayoutActions(escrowMeta, true, true, walletA)).to.equal(
      true,
    );
  });

  it("mock session remains accessible without wallet match", function () {
    const mockMeta: StakeSessionMeta = {
      status: "active",
      lockSettlement: "mock",
    };
    expect(canUseEscrowPayoutActions(mockMeta, true, false, undefined)).to.equal(
      true,
    );
  });

  it("escrow gameplay actions require matching connected wallet", function () {
    expect(canAccessEscrowSession(true, walletA, escrowMeta)).to.equal(true);
    expect(canAccessEscrowSession(true, undefined, escrowMeta)).to.equal(false);
  });

  it("local session memory remains when wallet disconnects", function () {
    expect(escrowMeta.status).to.equal("active");
    expect(canAccessEscrowSession(false, walletA, escrowMeta)).to.equal(false);
    expect(doesWalletOwnSession(escrowMeta, walletA)).to.equal(true);
  });
});
