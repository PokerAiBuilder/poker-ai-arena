import { isBaseSepolia } from "@/lib/onchain/baseSepolia";

export const PUBLIC_TESTER_HOW_TO_STEPS = [
  "Connect wallet",
  "Switch to Base Sepolia",
  "Get free Base Sepolia test ETH",
  "Lock test stake",
  "Play Human vs AI",
  "Prepare payout",
  "Claim payout",
  "Check tx on BaseScan",
] as const;

export type PublicTesterLink = {
  label: string;
  href: string;
};

export const PUBLIC_TESTER_LINKS: readonly PublicTesterLink[] = [
  {
    label: "Base Sepolia faucet",
    href: "https://docs.base.org/base-chain/network-information/network-faucets",
  },
  {
    label: "Base Sepolia explorer",
    href: "https://sepolia.basescan.org",
  },
  {
    label: "GitHub docs",
    href: "https://github.com/PokerAiBuilder/poker-ai-arena",
  },
] as const;

export const PUBLIC_TESTER_WALLET_NOTES = [
  "Rabby is recommended for clearer Base Sepolia test balances.",
  "MetaMask may sometimes not show testnet balances clearly; check BaseScan if needed.",
] as const;

export const PUBLIC_TESTER_DISCLAIMER_ITEMS = [
  "Base Sepolia only",
  "Test ETH only",
  "No mainnet funds",
  "No real-money wagering",
] as const;

export const PUBLIC_TESTER_MOBILE_NOTE =
  "Desktop recommended. Mobile layout is still WIP.";

export const PUBLIC_TESTER_WRONG_NETWORK_MESSAGE =
  "Switch to Base Sepolia to lock test stake.";

export function shouldShowPublicTesterWrongNetwork(
  isWalletConnected: boolean,
  chainId: number | undefined | null,
): boolean {
  return isWalletConnected && !isBaseSepolia(chainId);
}

export function isValidPublicTesterLink(link: PublicTesterLink): boolean {
  try {
    const url = new URL(link.href);
    return url.protocol === "https:" && link.label.trim().length > 0;
  } catch {
    return false;
  }
}
