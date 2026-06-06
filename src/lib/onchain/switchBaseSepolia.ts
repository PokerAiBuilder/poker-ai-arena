"use client";

import { getWalletClient } from "@wagmi/core";
import {
  BASE_SEPOLIA_CHAIN_ID,
  getMetaMaskBaseSepoliaAddChainParams,
} from "@/lib/onchain/chains";
import { wagmiConfig } from "@/lib/onchain/wagmiConfig";

function isChainNotAddedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: number; message?: string };
  return (
    candidate.code === 4902 ||
    /unrecognized chain|chain not added|not been added/i.test(candidate.message ?? "")
  );
}

/**
 * Switch the connected wallet to Base Sepolia.
 * Adds the network with MetaMask-compatible params when missing (4902).
 */
export async function ensureWalletOnBaseSepolia(): Promise<void> {
  const walletClient = await getWalletClient(wagmiConfig, {
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });
  if (!walletClient) {
    throw new Error("Wallet not connected.");
  }

  try {
    await walletClient.switchChain({ id: BASE_SEPOLIA_CHAIN_ID });
  } catch (error) {
    if (!isChainNotAddedError(error)) throw error;
    await walletClient.request({
      method: "wallet_addEthereumChain",
      params: [getMetaMaskBaseSepoliaAddChainParams()],
    });
    await walletClient.switchChain({ id: BASE_SEPOLIA_CHAIN_ID });
  }
}

/** switchChain wrapper — falls back to wallet_addEthereumChain on 4902. */
export async function switchToBaseSepoliaWithAddChain(
  switchChainAsync: (args: { chainId: number }) => Promise<unknown>,
): Promise<void> {
  try {
    await switchChainAsync({ chainId: BASE_SEPOLIA_CHAIN_ID });
  } catch (error) {
    if (!isChainNotAddedError(error)) throw error;
    await ensureWalletOnBaseSepolia();
  }
}
