"use client";

import { useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import {
  isBaseSepolia,
  isTestnetTreasuryConfigured,
} from "@/lib/onchain/baseSepolia";
import { isEscrowConfigured } from "@/lib/onchain/escrowContract";
import { isLockStakePathConfigured } from "@/lib/stake/lockTestStakeTx";
import { switchToBaseSepoliaWithAddChain } from "@/lib/onchain/switchBaseSepolia";

export function useTestnetStakeNetwork() {
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const chainId = chain?.id;
  const onBaseSepolia = isBaseSepolia(chainId);
  const wrongNetwork = isConnected && !onBaseSepolia;
  const treasuryConfigured = isTestnetTreasuryConfigured();
  const escrowConfigured = isEscrowConfigured();
  const lockPathConfigured = isLockStakePathConfigured();
  const canSendLockTx =
    isConnected && onBaseSepolia && lockPathConfigured && Boolean(address);

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
    escrowConfigured,
    lockPathConfigured,
    canSendLockTx,
    switchToBaseSepolia,
    isSwitching,
  };
}
