import { expect } from "chai";

type StatusKey =
  | "no_session"
  | "wallet_disconnected"
  | "wrong_wallet"
  | "active"
  | "no_chips_left"
  | "prepare_payout"
  | "payout_ready"
  | "claimed"
  | "closed_ready_new";

type Meta = {
  status: "active" | "cashed_out";
  lockSettlement?: "escrow-deposit" | "mock";
  walletAddress?: string;
  escrowResolved?: boolean;
  cashOut?: { claimedEthAmount?: string };
};

function isStakeSessionCashedOut(meta: Meta | null): boolean {
  return meta?.status === "cashed_out";
}

function isStakeSessionActive(meta: Meta | null): boolean {
  return meta?.status === "active";
}

function isZeroClaimable(currentChips: number, claimable: string | null): boolean {
  const chips = Math.max(0, Math.floor(currentChips));
  if (!claimable) return chips <= 0;
  return claimable === "0" || /^0\.0*$/.test(claimable);
}

function shouldShowWalletDisconnected(
  meta: Meta | null,
  paymentSuccess: boolean,
  isConnected: boolean,
): boolean {
  return (
    Boolean(meta && paymentSuccess && isStakeSessionActive(meta)) &&
    meta?.lockSettlement === "escrow-deposit" &&
    !isConnected
  );
}

function shouldShowWalletMismatch(
  meta: Meta | null,
  paymentSuccess: boolean,
  isConnected: boolean,
  wallet?: string | null,
): boolean {
  if (!meta || !paymentSuccess || !isStakeSessionActive(meta)) return false;
  if (meta.lockSettlement !== "escrow-deposit") return false;
  if (!isConnected) return false;
  return (meta.walletAddress ?? "").toLowerCase() !== (wallet ?? "").toLowerCase();
}

function resolveLifecycle(input: {
  paymentSuccess?: boolean;
  isWalletConnected: boolean;
  connectedWalletAddress?: string | null;
  stakeSessionMeta?: Meta | null;
  currentHumanChips: number;
  claimablePayoutEth?: string | null;
  escrowResolved?: boolean;
  handInProgress?: boolean;
}): { statusKey: StatusKey; canPlay: boolean; actionBarDisabledReason?: string } {
  const meta = input.stakeSessionMeta ?? null;
  const chips = Math.max(0, Math.floor(input.currentHumanChips));
  const paymentSuccess = input.paymentSuccess === true;

  if (isStakeSessionCashedOut(meta)) {
    return {
      statusKey: "claimed",
      canPlay: false,
      actionBarDisabledReason: "Start a new stake session",
    };
  }

  if (shouldShowWalletDisconnected(meta, paymentSuccess, input.isWalletConnected)) {
    return { statusKey: "wallet_disconnected", canPlay: false, actionBarDisabledReason: "Connect wallet" };
  }

  if (
    shouldShowWalletMismatch(
      meta,
      paymentSuccess,
      input.isWalletConnected,
      input.connectedWalletAddress,
    )
  ) {
    return { statusKey: "wrong_wallet", canPlay: false, actionBarDisabledReason: "Connect wallet" };
  }

  if (!paymentSuccess || !meta || !isStakeSessionActive(meta)) {
    return { statusKey: "no_session", canPlay: false };
  }

  const depletedZero =
    meta.lockSettlement === "escrow-deposit" &&
    isZeroClaimable(chips, input.claimablePayoutEth ?? null);
  if (depletedZero) {
    return {
      statusKey: "no_chips_left",
      canPlay: false,
      actionBarDisabledReason: "No chips left",
    };
  }

  const requiresClaim =
    meta.lockSettlement === "escrow-deposit" && !depletedZero;
  const resolved = input.escrowResolved ?? meta.escrowResolved === true;

  if (chips <= 0 && requiresClaim && !resolved) {
    return {
      statusKey: "prepare_payout",
      canPlay: chips > 0,
      actionBarDisabledReason: chips <= 0 ? "Claim payout first" : undefined,
    };
  }

  if (chips <= 0 && requiresClaim && resolved) {
    return {
      statusKey: "payout_ready",
      canPlay: chips > 0,
      actionBarDisabledReason: chips <= 0 ? "Claim payout first" : undefined,
    };
  }

  if (meta.lockSettlement !== "escrow-deposit" && chips <= 0) {
    return {
      statusKey: "closed_ready_new",
      canPlay: false,
      actionBarDisabledReason: "Start a new stake session",
    };
  }

  return {
    statusKey: "active",
    canPlay: chips > 0,
    actionBarDisabledReason: chips <= 0 ? "No chips left" : undefined,
  };
}

function shouldBlockGameplay(
  lifecycle: { statusKey: StatusKey; actionBarDisabledReason?: string },
  isArenaUnlocked: boolean,
  headsUpStackDepleted: boolean,
): boolean {
  if (!isArenaUnlocked) return true;
  if (
    lifecycle.statusKey === "claimed" ||
    lifecycle.statusKey === "no_chips_left" ||
    lifecycle.statusKey === "closed_ready_new"
  ) {
    return true;
  }
  if (
    headsUpStackDepleted &&
    (lifecycle.statusKey === "prepare_payout" || lifecycle.statusKey === "payout_ready")
  ) {
    return true;
  }
  if (headsUpStackDepleted && lifecycle.statusKey === "active") {
    return true;
  }
  return false;
}

const walletA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const walletB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

describe("testnet session lifecycle helpers", function () {
  it("returns active session state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      connectedWalletAddress: walletA,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
      },
      currentHumanChips: 850,
      claimablePayoutEth: "0.00085",
    });
    expect(state.statusKey).to.equal("active");
    expect(state.canPlay).to.equal(true);
  });

  it("returns disconnected state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: false,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
      },
      currentHumanChips: 500,
    });
    expect(state.statusKey).to.equal("wallet_disconnected");
    expect(state.actionBarDisabledReason).to.equal("Connect wallet");
  });

  it("returns wallet mismatch state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      connectedWalletAddress: walletB,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
      },
      currentHumanChips: 500,
    });
    expect(state.statusKey).to.equal("wrong_wallet");
  });

  it("returns zero chips / zero payout state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      connectedWalletAddress: walletA,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
      },
      currentHumanChips: 0,
      claimablePayoutEth: "0",
    });
    expect(state.statusKey).to.equal("no_chips_left");
    expect(state.actionBarDisabledReason).to.equal("No chips left");
  });

  it("returns zero chips / positive payout state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      connectedWalletAddress: walletA,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
      },
      currentHumanChips: 0,
      claimablePayoutEth: "0.0005",
      escrowResolved: false,
    });
    expect(state.statusKey).to.equal("prepare_payout");
    expect(state.actionBarDisabledReason).to.equal("Claim payout first");
  });

  it("returns claimed state", function () {
    const state = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      stakeSessionMeta: {
        status: "cashed_out",
        lockSettlement: "escrow-deposit",
        cashOut: { claimedEthAmount: "0.0009" },
      },
      currentHumanChips: 0,
    });
    expect(state.statusKey).to.equal("claimed");
    expect(state.actionBarDisabledReason).to.equal("Start a new stake session");
  });

  it("blocks action bar for claim-first lifecycle", function () {
    const lifecycle = resolveLifecycle({
      paymentSuccess: true,
      isWalletConnected: true,
      connectedWalletAddress: walletA,
      stakeSessionMeta: {
        status: "active",
        lockSettlement: "escrow-deposit",
        walletAddress: walletA,
        escrowResolved: true,
      },
      currentHumanChips: 0,
      claimablePayoutEth: "0.0004",
      escrowResolved: true,
    });
    expect(lifecycle.statusKey).to.equal("payout_ready");
    expect(
      shouldBlockGameplay(lifecycle, true, true),
    ).to.equal(true);
  });
});
