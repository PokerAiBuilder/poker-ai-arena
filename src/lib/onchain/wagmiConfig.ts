"use client";

import { createConfig, http } from "wagmi";
import {
  baseSepolia,
  DEFAULT_CHAIN_ID,
  supportedChains,
} from "@/lib/onchain/chains";
import { createWalletConnectors } from "@/lib/onchain/walletConnectors";
import { base } from "viem/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ??
  baseSepolia.rpcUrls.default.http[0];
const mainnetRpc =
  process.env.NEXT_PUBLIC_BASE_RPC_URL ?? base.rpcUrls.default.http[0];

const transports = {
  [baseSepolia.id]: http(sepoliaRpc, { batch: true }),
  [base.id]: http(mainnetRpc, { batch: true }),
} as Record<number, ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: createWalletConnectors(projectId),
  transports,
  ssr: true,
});

export { DEFAULT_CHAIN_ID };
