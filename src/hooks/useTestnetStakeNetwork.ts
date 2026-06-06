"use client";

import { useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import {
  isBaseSepolia,
  isTestnetTreasuryConfigured,
} from "@/lib/onchain/baseSepolia";
import { switchToBaseSepoliaWithAddChain } from "@/lib/onchain/switchBaseSepolia";

export function useTestnetStakeNetwork() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const chainId = chain?.id;
  const onBaseSepolia = isBaseSepolia(chainId);
  const wrongNetwork = isConnected && !onBaseSepolia;
  const treasuryConfigured = isTestnetTreasuryConfigured();
  const canSendLockTx =
    isConnected && onBaseSepolia && treasuryConfigured && Boolean(address);

  const switchToBaseSepolia = useCallback(async () => {
    await switchToBaseSepoliaWithAddChain(switchChainAsync);
  }, [switchChainAsync]);

  return {
    address,
    isConnected,
    chainId,
    onBaseSepolia,
    wrongNetwork,
    treasuryConfigured,
    canSendLockTx,
    switchToBaseSepolia,
    isSwitching,
  };
}
