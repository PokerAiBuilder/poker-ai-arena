"use client";

import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { DEFAULT_CHAIN_ID, supportedChains } from "@/lib/onchain/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL;

const transports = Object.fromEntries(
  supportedChains.map((chain) => [
    chain.id,
    http(rpcUrl || undefined, { batch: true }),
  ]),
) as Record<number, ReturnType<typeof http>>;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({ shimDisconnect: true }),
    ...(projectId
      ? [walletConnect({ projectId, showQrModal: true })]
      : []),
  ],
  transports,
  ssr: true,
});

export { DEFAULT_CHAIN_ID };
