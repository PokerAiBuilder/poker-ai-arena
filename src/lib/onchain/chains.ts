import { defineChain } from "viem";
import { base, baseSepolia as viemBaseSepolia } from "viem/chains";
import type { AddEthereumChainParameter } from "viem";

/**
 * Single wagmi/viem chain definition for Base Sepolia.
 * MetaMask's registry expects "Base Sepolia Testnet" and native currency "Ether"
 * (viem defaults to "Base Sepolia" / "Sepolia Ether", which triggers review alerts).
 */
export const baseSepolia = defineChain({
  ...viemBaseSepolia,
  name: "Base Sepolia Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
});

export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id,
);

export const supportedChains = [baseSepolia, base] as const;

export function getTargetChain() {
  return (
    supportedChains.find((chain) => chain.id === DEFAULT_CHAIN_ID) ?? baseSepolia
  );
}

/** Params for wallet_addEthereumChain — must match MetaMask's Base Sepolia registry. */
export function getMetaMaskBaseSepoliaAddChainParams(): AddEthereumChainParameter {
  return {
    chainId: "0x14a34",
    chainName: baseSepolia.name,
    nativeCurrency: baseSepolia.nativeCurrency,
    rpcUrls: baseSepolia.rpcUrls.default.http,
    blockExplorerUrls: [baseSepolia.blockExplorers.default.url],
  };
}

/** User-facing chain label (wallet button, session cards) */
export function getUserChainLabel(chainId?: number): string {
  if (chainId === base.id) return "Base mainnet";
  return "Base Sepolia";
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Poker AI Arena";
