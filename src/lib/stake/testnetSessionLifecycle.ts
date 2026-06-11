import type { EscrowPayoutUiInfo } from "@/lib/stake/escrowLiquidityPreview";
import {
  isDepletedZeroPayoutEscrowSession,
  shouldRequireEscrowPrepareClaim,
} from "@/lib/stake/depletedEscrowSession";
import {
  isStakeSessionActive,
  isStakeSessionCashedOut,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";
import {
  shouldShowWalletDisconnectedEscrowState,
  shouldShowWalletMismatchEscrowState,
} from "@/lib/stake/walletSessionAccess";

export type TestnetSessionLifecycleStatusKey =
  | "no_session"
  | "wallet_disconnected"
  | "wrong_wallet"
  | "active"
  | "no_chips_left"
  | "prepare_payout"
  | "payout_ready"
  | "claimed"
  | "closed_ready_new";

export type TestnetSessionLifecycleState = {
  statusKey: TestnetSessionLifecycleStatusKey;
  title: string;
  description: string;
  primaryActionLabel?: string;
  disabledReason?: string;
  showPreparePayout: boolean;
  showClaimPayout: boolean;
  showBeginNewStakeSession: boolean;
  canPlay: boolean;
  actionBarDisabledReason?: string;
};

export type TestnetSessionLifecycleInput = {
  paymentSuccess?: boolean;
  isWalletConnected: boolean;
  connectedWalletAddress?: string | null;
  stakeSessionMeta?: StakeSessionMeta | null;
  currentHumanChips: number;
  escrowPayoutUi?: EscrowPayoutUiInfo | null;
  escrowResolved?: boolean;
  handInProgress?: boolean;
};

export const LIFECYCLE_TITLE_ACTIVE = "Active testnet session";
export const LIFECYCLE_TITLE_NO_CHIPS = "No chips left";
export const LIFECYCLE_TITLE_PREPARE = "Prepare payout";
export const LIFECYCLE_TITLE_PAYOUT_READY = "Payout ready";
export const LIFECYCLE_TITLE_CLAIM = "Claim payout";
export const LIFECYCLE_TITLE_CASH_OUT_COMPLETE = "Cash out complete";
export const LIFECYCLE_TITLE_NEW_SESSION = "Start new stake session";
export const LIFECYCLE_TITLE_CONNECT = "Connect wallet to continue";
export const LIFECYCLE_TITLE_WRONG_WALLET =
  "Switch to the wallet used for this session";

export const LIFECYCLE_ACTION_CONNECT = "Connect wallet";
export const LIFECYCLE_ACTION_NO_CHIPS = "No chips left";
export const LIFECYCLE_ACTION_NEW_SESSION = "Start a new stake session";
export const LIFECYCLE_ACTION_CLAIM_FIRST = "Claim payout first";

function chipsFloor(value: number): number {
  return Math.max(0, Math.floor(value));
}

function baseLifecycle(
  statusKey: TestnetSessionLifecycleStatusKey,
  title: string,
  description: string,
  overrides: Partial<TestnetSessionLifecycleState> = {},
): TestnetSessionLifecycleState {
  return {
    statusKey,
    title,
    description,
    showPreparePayout: false,
    showClaimPayout: false,
    showBeginNewStakeSession: false,
    canPlay: false,
    ...overrides,
  };
}

export function resolveTestnetSessionLifecycle(
  input: TestnetSessionLifecycleInput,
): TestnetSessionLifecycleState {
  const meta = input.stakeSessionMeta ?? null;
  const paymentSuccess = input.paymentSuccess === true;
  const isCashedOut = isStakeSessionCashedOut(meta);
  const chips = chipsFloor(input.currentHumanChips);
  const escrowResolved = input.escrowResolved ?? meta?.escrowResolved === true;
  const isEscrow = meta?.lockSettlement === "escrow-deposit";
  const handInProgress = input.handInProgress === true;

  if (isCashedOut) {
    const claimedEth = meta?.cashOut?.claimedEthAmount;
    const description = claimedEth
      ? `Claimed ${claimedEth} ETH. Start new stake session when ready.`
      : "Session closed. Start new stake session when ready.";

    return baseLifecycle("claimed", LIFECYCLE_TITLE_CASH_OUT_COMPLETE, description, {
      primaryActionLabel: LIFECYCLE_TITLE_NEW_SESSION,
      showBeginNewStakeSession: true,
      actionBarDisabledReason: LIFECYCLE_ACTION_NEW_SESSION,
    });
  }

  const walletDisconnected = shouldShowWalletDisconnectedEscrowState(
    meta,
    paymentSuccess,
    input.isWalletConnected,
  );
  if (walletDisconnected) {
    return baseLifecycle(
      "wallet_disconnected",
      LIFECYCLE_TITLE_CONNECT,
      "Connect wallet to continue your testnet session.",
      {
        actionBarDisabledReason: LIFECYCLE_ACTION_CONNECT,
      },
    );
  }

  const walletMismatch = shouldShowWalletMismatchEscrowState(
    meta,
    paymentSuccess,
    input.isWalletConnected,
    input.connectedWalletAddress,
  );
  if (walletMismatch) {
    return baseLifecycle(
      "wrong_wallet",
      LIFECYCLE_TITLE_WRONG_WALLET,
      "This session belongs to another wallet. Connect the deposit wallet to continue.",
      {
        actionBarDisabledReason: LIFECYCLE_ACTION_CONNECT,
      },
    );
  }

  const hasActiveSession =
    paymentSuccess && meta != null && isStakeSessionActive(meta);

  if (!hasActiveSession) {
    return baseLifecycle(
      "no_session",
      "Lock test stake",
      "Choose stake and lock to play Human vs AI.",
      {
        actionBarDisabledReason: "Lock a test stake session to play.",
      },
    );
  }

  const depletedZeroPayout = isDepletedZeroPayoutEscrowSession(
    meta,
    chips,
    input.escrowPayoutUi ?? null,
  );

  if (depletedZeroPayout) {
    return baseLifecycle(
      "no_chips_left",
      LIFECYCLE_TITLE_NO_CHIPS,
      "No payout available. Start new stake session.",
      {
        primaryActionLabel: LIFECYCLE_TITLE_NEW_SESSION,
        showBeginNewStakeSession: !handInProgress,
        actionBarDisabledReason: LIFECYCLE_ACTION_NO_CHIPS,
      },
    );
  }

  const requiresPrepareClaim = shouldRequireEscrowPrepareClaim(
    meta,
    chips,
    input.escrowPayoutUi ?? null,
  );

  if (isEscrow && chips <= 0 && requiresPrepareClaim && !escrowResolved) {
    return baseLifecycle(
      "prepare_payout",
      LIFECYCLE_TITLE_PREPARE,
      "No chips left. Prepare payout, then claim.",
      {
        primaryActionLabel: LIFECYCLE_TITLE_PREPARE,
        showPreparePayout: !handInProgress,
        showClaimPayout: false,
        canPlay: false,
        actionBarDisabledReason: LIFECYCLE_ACTION_CLAIM_FIRST,
      },
    );
  }

  if (isEscrow && chips <= 0 && requiresPrepareClaim && escrowResolved) {
    return baseLifecycle(
      "payout_ready",
      LIFECYCLE_TITLE_PAYOUT_READY,
      "Payout ready. Claim to your wallet.",
      {
        primaryActionLabel: LIFECYCLE_TITLE_CLAIM,
        showClaimPayout: !handInProgress,
        canPlay: false,
        actionBarDisabledReason: LIFECYCLE_ACTION_CLAIM_FIRST,
      },
    );
  }

  if (!isEscrow && chips <= 0) {
    return baseLifecycle(
      "closed_ready_new",
      LIFECYCLE_TITLE_NO_CHIPS,
      "Start new stake session to play again.",
      {
        primaryActionLabel: LIFECYCLE_TITLE_NEW_SESSION,
        showBeginNewStakeSession: !handInProgress,
        actionBarDisabledReason: LIFECYCLE_ACTION_NEW_SESSION,
      },
    );
  }

  return baseLifecycle(
    "active",
    LIFECYCLE_TITLE_ACTIVE,
    chips <= 0
      ? "No chips left in this hand."
      : "Play Human vs AI with your session chips.",
    {
      canPlay: chips > 0,
      showPreparePayout:
        isEscrow && requiresPrepareClaim && !escrowResolved && !handInProgress,
      showClaimPayout:
        isEscrow && requiresPrepareClaim && escrowResolved && !handInProgress,
      actionBarDisabledReason: chips <= 0 ? LIFECYCLE_ACTION_NO_CHIPS : undefined,
    },
  );
}

export function resolveTestnetSessionActionBarReason(
  lifecycle: TestnetSessionLifecycleState,
  options: {
    isArenaUnlocked: boolean;
    headsUpStackDepleted: boolean;
  },
): string | undefined {
  if (lifecycle.actionBarDisabledReason) {
    return lifecycle.actionBarDisabledReason;
  }

  if (!options.isArenaUnlocked) {
    return lifecycle.statusKey === "no_session"
      ? "Lock a test stake session to play."
      : LIFECYCLE_ACTION_CONNECT;
  }

  if (options.headsUpStackDepleted) {
    if (
      lifecycle.statusKey === "prepare_payout" ||
      lifecycle.statusKey === "payout_ready"
    ) {
      return LIFECYCLE_ACTION_CLAIM_FIRST;
    }
    return LIFECYCLE_ACTION_NO_CHIPS;
  }

  return undefined;
}

export function shouldBlockGameplayForLifecycle(
  lifecycle: TestnetSessionLifecycleState,
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
    (lifecycle.statusKey === "prepare_payout" ||
      lifecycle.statusKey === "payout_ready")
  ) {
    return true;
  }
  if (headsUpStackDepleted && lifecycle.statusKey === "active") {
    return true;
  }
  return false;
}
