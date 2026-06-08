import { expect } from "chai";

const POKER_MASTER_ID = "poker-master";

/** Mirror of prepareHeadsUpHandStacks for hardhat test isolation. */
function prepareHeadsUpHandStacks(
  stacks: Record<string, number>,
  houseRefillChips = 1000,
): Record<string, number> | null {
  const human = Math.max(0, Math.floor(stacks.human ?? 0));
  if (human <= 0) return null;

  const bot = Math.max(0, Math.floor(stacks[POKER_MASTER_ID] ?? 0));
  if (bot > 0) {
    return { ...stacks, human, [POKER_MASTER_ID]: bot };
  }

  return {
    ...stacks,
    human,
    [POKER_MASTER_ID]: Math.max(0, Math.floor(houseRefillChips)),
  };
}

describe("sessionStacks persistence", function () {
  it("keeps human chips when bot is busted", function () {
    const stacks = { human: 1840, [POKER_MASTER_ID]: 0 };
    const prepared = prepareHeadsUpHandStacks(stacks, 1000);
    expect(prepared).to.not.equal(null);
    expect(prepared!.human).to.equal(1840);
    expect(prepared![POKER_MASTER_ID]).to.equal(1000);
  });

  it("does not change human chips on new hand prep", function () {
    const stacks = { human: 535, [POKER_MASTER_ID]: 420 };
    const prepared = prepareHeadsUpHandStacks(stacks, 1000);
    expect(prepared!.human).to.equal(535);
    expect(prepared![POKER_MASTER_ID]).to.equal(420);
  });

  it("blocks new hand when player is busted", function () {
    const prepared = prepareHeadsUpHandStacks(
      { human: 0, [POKER_MASTER_ID]: 0 },
      1000,
    );
    expect(prepared).to.equal(null);
  });
});
