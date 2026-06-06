import { isAddress, type Address } from "viem";
import { base } from "viem/chains";
import {
  BASE_SEPOLIA_CHAIN_ID,
  baseSepolia,
} from "@/lib/onchain/chains";

export { BASE_SEPOLIA_CHAIN_ID };

/** Re-export chain display metadata from the single chains.ts definition. */
export const BASE_SEPOLIA_CONFIG = {
  chainId: baseSepolia.id,
  name: baseSepolia.name,
  nativeCurrency: baseSepolia.nativeCurrency,
  blockExplorerUrl: baseSepolia.blockExplorers.default.url,
} as const;

export function isBaseSepolia(chainId?: number | null): boolean {
  return chainId === BASE_SEPOLIA_CHAIN_ID;
}

export function isMainnetChain(chainId?: number | null): boolean {
  return chainId === base.id;
}

/** Never send test stake lock txs on mainnet. */
export function isAllowedLockTxChain(chainId?: number | null): boolean {
  return isBaseSepolia(chainId);
}

export function getShortAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatTxHash(hash: string, head = 8, tail = 6): string {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function getBaseSepoliaExplorerTxUrl(hash: string): string {
  return `${BASE_SEPOLIA_CONFIG.blockExplorerUrl}/tx/${hash}`;
}

export function getBaseSepoliaExplorerAddressUrl(address: string): string {
  return `${BASE_SEPOLIA_CONFIG.blockExplorerUrl}/address/${address}`;
}

/**
 * Treasury / escrow recipient for test stake lock txs.
 * Disabled when env is missing or invalid.
 */
export function getTestnetTreasuryAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_TESTNET_TREASURY_ADDRESS?.trim();
  if (!raw || !isAddress(raw)) return null;
  return raw;
}

export function isTestnetTreasuryConfigured(): boolean {
  return getTestnetTreasuryAddress() !== null;
}

export function getLockSettlementLabel(
  settlement?: "mock" | "base-sepolia-test-tx",
): string {
  if (settlement === "base-sepolia-test-tx") return "Base Sepolia test tx";
  return "Mock test stake lock";
}
