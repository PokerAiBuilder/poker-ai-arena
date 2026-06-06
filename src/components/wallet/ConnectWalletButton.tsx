"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_CHAIN_ID, getTargetChain, getUserChainLabel } from "@/lib/onchain/chains";
import { cn } from "@/lib/utils";

type ConnectWalletButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg";
  /** Show optional-demo hint under the connect button */
  showDemoHint?: boolean;
};

export function ConnectWalletButton({
  className,
  size = "default",
  showDemoHint = true,
}: ConnectWalletButtonProps) {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const targetChain = getTargetChain();
  const wrongNetwork = isConnected && chain?.id !== DEFAULT_CHAIN_ID;

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  if (isConnected && wrongNetwork) {
    return (
      <Button
        type="button"
        variant="destructive"
        size={size}
        className={cn(className)}
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: DEFAULT_CHAIN_ID })}
      >
        {isSwitching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          `Switch to ${getUserChainLabel(DEFAULT_CHAIN_ID)}`
        )}
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground sm:inline">
          {getUserChainLabel(chain?.id) ?? getUserChainLabel(DEFAULT_CHAIN_ID)}
        </span>
        <Button
          type="button"
          variant="secondary"
          size={size}
          onClick={() => disconnect()}
        >
          {shortAddress}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-0.5">
      <Button
        type="button"
        variant="outline"
        size={size}
        className={cn(className)}
        disabled={isPending}
        title="Connect wallet for testnet stake flow on Base Sepolia"
        onClick={() => connect({ connector: injected() })}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect Wallet
      </Button>
      {showDemoHint ? (
        <p className="hidden text-center text-[9px] leading-snug text-muted-foreground lg:block">
          Base Sepolia · testnet stake flow
        </p>
      ) : null}
      {connectError ? (
        <p className="text-center text-xs text-red-400">{connectError.message}</p>
      ) : null}
    </div>
  );
}
