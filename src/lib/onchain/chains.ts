import { base, baseSepolia } from "viem/chains";

export const DEFAULT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID ?? baseSepolia.id,
);

export const supportedChains = [baseSepolia, base] as const;

export function getTargetChain() {
  return supportedChains.find((chain) => chain.id === DEFAULT_CHAIN_ID) ?? baseSepolia;
}

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Poker AI Arena";
