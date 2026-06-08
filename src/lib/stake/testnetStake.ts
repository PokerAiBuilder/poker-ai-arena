/** Testnet stake catalog — stake tier controls Human vs AI starting chip stack. */
export const TEST_STAKE_TIERS = [
  {
    amount: "0.10",
    usdLabel: "0.00010 ETH",
    testPaymentLabel: "0.00010 ETH",
    testEthAmount: "0.00010",
    chipAmount: 100,
  },
  {
    amount: "0.25",
    usdLabel: "0.00025 ETH",
    testPaymentLabel: "0.00025 ETH",
    testEthAmount: "0.00025",
    chipAmount: 250,
  },
  {
    amount: "0.50",
    usdLabel: "0.00050 ETH",
    testPaymentLabel: "0.00050 ETH",
    testEthAmount: "0.00050",
    chipAmount: 500,
  },
  {
    amount: "1.00",
    usdLabel: "0.00100 ETH",
    testPaymentLabel: "0.00100 ETH",
    testEthAmount: "0.00100",
    chipAmount: 1000,
  },
] as const;

export type TestStakeAmount = (typeof TEST_STAKE_TIERS)[number]["amount"];

export type TestStakeTier = (typeof TEST_STAKE_TIERS)[number];

export const DEFAULT_TEST_STAKE: TestStakeAmount = "0.25";

/** Reference ratio: 1,000 chips ↔ 0.00100 ETH at the top stake tier. */
export const CHIPS_PER_REFERENCE_ETH = 1_000_000;

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
  return `${tier.testEthAmount} ETH stake → ${tier.chipAmount.toLocaleString()} chips`;
}

/** Internal chip ratio used by session cash-out records (chips / 1,000). */
export function chipsToTestBalanceUsd(chips: number): number {
  if (!Number.isFinite(chips)) return 0;
  return Math.max(0, chips) / 1000;
}

/** Alias — chips → internal chip ratio (1000 chips = 1.0). */
export const chipsToTestBalance = chipsToTestBalanceUsd;

export function chipsToTestEth(chips: number): number {
  if (!Number.isFinite(chips)) return 0;
  return Math.max(0, chips) / CHIPS_PER_REFERENCE_ETH;
}

export function formatTestEthFromNumber(eth: number): string {
  if (!Number.isFinite(eth) || eth <= 0) return "0 ETH";
  const str = eth
    .toFixed(8)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "");
  return `${str} ETH`;
}

export function formatChipsAsTestEth(chips: number): string {
  return formatTestEthFromNumber(chipsToTestEth(chips));
}

export function formatEstimatedTestBalance(chips: number): string {
  return `Payout ${formatChipsAsTestEth(chips)}`;
}

/** Formatted payout label for cash-out display from chip count. */
export function formatTestBalance(chips: number): string {
  return formatChipsAsTestEth(chips);
}

/** Formatted payout label from internal chip ratio (chips / 1,000). */
export function formatTestBalanceAmount(chipRatio: number): string {
  if (!Number.isFinite(chipRatio) || chipRatio <= 0) return "0 ETH";
  return formatTestEthFromNumber(chipRatio * 0.001);
}

export const TESTNET_STAKE_DISCLAIMER =
  "Base Sepolia test ETH only · No real-money value";
