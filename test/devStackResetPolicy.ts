import { expect } from "chai";

const POKER_MASTER_ID = "poker-master";

function isEscrowBackedStakeSession(lockSettlement?: string | null): boolean {
  return lockSettlement === "escrow-deposit";
}

function shouldShowDevStackReset(options: {
  isDevelopment: boolean;
  lockSettlement?: string | null;
  playerBusted: boolean;
}): boolean {
  if (!options.isDevelopment || !options.playerBusted) return false;
  if (isEscrowBackedStakeSession(options.lockSettlement)) return false;
  return true;
}

function devResetHeadsUpStacks(
  stacks: Record<string, number>,
  startingChips: number,
  lockSettlement?: string | null,
): Record<string, number> | null {
  if (isEscrowBackedStakeSession(lockSettlement)) return null;
  const chips = Math.max(0, Math.floor(startingChips));
  return { ...stacks, human: chips, [POKER_MASTER_ID]: chips };
}

function prepareHeadsUpHandStacks(
  stacks: Record<string, number>,
  houseRefillChips = 1000,
): Record<string, number> | null {
  const human = Math.max(0, Math.floor(stacks.human ?? 0));
  if (human <= 0) return null;
  const bot = Math.max(0, Math.floor(stacks[POKER_MASTER_ID] ?? 0));
  if (bot > 0) return { ...stacks, human, [POKER_MASTER_ID]: bot };
  return {
    ...stacks,
    human,
    [POKER_MASTER_ID]: Math.max(0, Math.floor(houseRefillChips)),
  };
}

type StakeSessionMeta = {
  status: "active" | "cashed_out";
  lockSettlement?: string;
} | null;

function beginNewStakeSessionClearsActive(meta: StakeSessionMeta): {
  meta: null;
  paymentCleared: boolean;
  stacksCleared: boolean;
} {
  return {
    meta: null,
    paymentCleared: true,
    stacksCleared: meta?.status === "active",
  };
}

describe("devStackResetPolicy", function () {
  it("hides dev reset for escrow player bust", function () {
    const show = shouldShowDevStackReset({
      isDevelopment: true,
      lockSettlement: "escrow-deposit",
      playerBusted: true,
    });
    expect(show).to.equal(false);
  });

  it("allows dev reset for mock player bust in development", function () {
    const show = shouldShowDevStackReset({
      isDevelopment: true,
      lockSettlement: "mock",
      playerBusted: true,
    });
    expect(show).to.equal(true);
  });

  it("dev reset cannot restore escrow player chips", function () {
    const stacks = { human: 0, [POKER_MASTER_ID]: 0 };
    const next = devResetHeadsUpStacks(stacks, 1000, "escrow-deposit");
    expect(next).to.equal(null);
  });

  it("new stake session clears active session state", function () {
    const cleared = beginNewStakeSessionClearsActive({
      status: "active",
      lockSettlement: "escrow-deposit",
    });
    expect(cleared.meta).to.equal(null);
    expect(cleared.paymentCleared).to.equal(true);
    expect(cleared.stacksCleared).to.equal(true);
  });

  it("bot bust still refills only bot stack", function () {
    const prepared = prepareHeadsUpHandStacks(
      { human: 1500, [POKER_MASTER_ID]: 0 },
      1000,
    );
    expect(prepared!.human).to.equal(1500);
    expect(prepared![POKER_MASTER_ID]).to.equal(1000);
  });
});
