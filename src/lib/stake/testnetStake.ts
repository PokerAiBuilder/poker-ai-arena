/** Testnet stake catalog — stake tier controls Human vs AI starting chip stack. */
export const TEST_STAKE_TIERS = [
  {
    amount: "0.10",
    usdLabel: "$0.10 test",
    testPaymentLabel: "0.00010 test ETH",
    testEthAmount: "0.00010",
    chipAmount: 100,
  },
  {
    amount: "0.25",
    usdLabel: "$0.25 test",
    testPaymentLabel: "0.00025 test ETH",
    testEthAmount: "0.00025",
    chipAmount: 250,
  },
  {
    amount: "0.50",
    usdLabel: "$0.50 test",
    testPaymentLabel: "0.00050 test ETH",
    testEthAmount: "0.00050",
    chipAmount: 500,
  },
  {
    amount: "1.00",
    usdLabel: "$1.00 test",
    testPaymentLabel: "0.00100 test ETH",
    testEthAmount: "0.00100",
    chipAmount: 1000,
  },
] as const;

export type TestStakeAmount = (typeof TEST_STAKE_TIERS)[number]["amount"];

export type TestStakeTier = (typeof TEST_STAKE_TIERS)[number];

export const DEFAULT_TEST_STAKE: TestStakeAmount = "0.25";

/** @deprecated Use TEST_STAKE_TIERS — kept for picker compatibility. */
export const TEST_STAKE_OPTIONS = TEST_STAKE_TIERS.map((tier) => ({
  amount: tier.amount,
  label: tier.usdLabel,
  chipAmount: tier.chipAmount,
}));

export function getTestStakeTier(amount: string | undefined): TestStakeTier {
  const match = TEST_STAKE_TIERS.find((tier) => tier.amount === amount);
  return match ?? TEST_STAKE_TIERS[1];
}

export function isValidTestStakeAmount(amount: string): amount is TestStakeAmount {
  return TEST_STAKE_TIERS.some((tier) => tier.amount === amount);
}

export function resolveTestStakeAmount(amount: string | undefined): TestStakeAmount {
  if (amount && isValidTestStakeAmount(amount)) return amount;
  return DEFAULT_TEST_STAKE;
}

export function formatTestStakeLabel(amount: string): string {
  return getTestStakeTier(amount).usdLabel;
}

export function formatStakeToChipsLine(amount: string): string {
  const tier = getTestStakeTier(amount);
  return `${tier.usdLabel} stake → ${tier.chipAmount.toLocaleString()} chips`;
}

/** 1000 chips = $1.00 test balance */
export function chipsToTestBalanceUsd(chips: number): number {
  if (!Number.isFinite(chips)) return 0;
  return Math.max(0, chips) / 1000;
}

/** Alias — chips → test USD balance (1000 chips = $1.00). */
export const chipsToTestBalance = chipsToTestBalanceUsd;

export function formatEstimatedTestBalance(chips: number): string {
  const usd = chipsToTestBalanceUsd(chips);
  return `$${usd.toFixed(3)} test balance`;
}

/** Formatted test balance label for cash-out display. */
export function formatTestBalance(chips: number): string {
  return formatEstimatedTestBalance(chips);
}

export function formatTestBalanceAmount(usd: number): string {
  return `$${usd.toFixed(3)} test`;
}
