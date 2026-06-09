"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { ChevronDown, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  WalletSelectModal,
  type WalletMenuPlacement,
} from "@/components/wallet/WalletSelectModal";
import { DEFAULT_CHAIN_ID, getUserChainLabel } from "@/lib/onchain/chains";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_CONFIG,
  getShortAddress,
  isBaseSepolia,
} from "@/lib/onchain/baseSepolia";
import { switchToBaseSepoliaWithAddChain } from "@/lib/onchain/switchBaseSepolia";
import {
  getConnectorDisplayName,
  isMetaMaskBrowserAvailable,
  isOtherWalletAvailable,
  resolveWalletChoiceConnector,
  type WalletChoice,
} from "@/lib/onchain/walletConnectors";
import { clearWagmiWalletStorage } from "@/lib/onchain/walletStorage";
import { cn } from "@/lib/utils";

type ConnectWalletButtonProps = {
  className?: string;
  size?: "default" | "sm" | "lg";
  /** Show optional-demo hint under the connect button */
  showDemoHint?: boolean;
  /** Center overlay for table lock card; anchored portal elsewhere */
  menuPlacement?: WalletMenuPlacement;
};

function networkPillLabel(chainId?: number): string {
  if (chainId === undefined) return "Unknown network";
  if (isBaseSepolia(chainId)) return BASE_SEPOLIA_CONFIG.name;
  if (chainId === DEFAULT_CHAIN_ID) {
    return DEFAULT_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID
      ? BASE_SEPOLIA_CONFIG.name
      : getUserChainLabel(chainId);
  }
  return "Wrong network";
}

export function ConnectWalletButton({
  className,
  size = "default",
  showDemoHint = true,
  menuPlacement = "anchored",
}: ConnectWalletButtonProps) {
  const { address, isConnected, chain, connector, status } = useAccount();
  const { connectAsync, connectors, isPending, error: connectError } = useConnect();
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const [connectErrorLocal, setConnectErrorLocal] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<WalletChoice | null>(null);
  const [isForgetting, setIsForgetting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const wrongNetwork = isConnected && chain?.id !== DEFAULT_CHAIN_ID;
  const shortAddress = address ? getShortAddress(address) : null;
  const networkLabel = networkPillLabel(chain?.id);
  const connecting = isPending || status === "connecting";
  const metaMaskAvailable = isMetaMaskBrowserAvailable();
  const otherWalletAvailable = isOtherWalletAvailable();

  useEffect(() => {
    if (!accountMenuOpen && !walletMenuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        walletMenuRef.current?.contains(target)
      ) {
        return;
      }
      setAccountMenuOpen(false);
      setWalletMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountMenuOpen, walletMenuOpen]);

  useEffect(() => {
    if (!isConnected) {
      setAccountMenuOpen(false);
      setSwitchError(null);
    }
  }, [isConnected, address]);

  const handleConnectChoice = useCallback(
    async (choice: WalletChoice) => {
      setConnectErrorLocal(null);
      setSwitchError(null);
      setPendingChoice(choice);

      const target = resolveWalletChoiceConnector(connectors, choice);
      if (!target) {
        setConnectErrorLocal(
          choice === "metamask"
            ? "MetaMask not detected."
            : "No browser wallet available.",
        );
        setPendingChoice(null);
        return;
      }

      try {
        await connectAsync({ connector: target, chainId: DEFAULT_CHAIN_ID });
        setWalletMenuOpen(false);
        setConnectErrorLocal(null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not connect wallet.";
        setConnectErrorLocal(message);
      } finally {
        setPendingChoice(null);
      }
    },
    [connectAsync, connectors],
  );

  const handleDisconnect = useCallback(async () => {
    setSwitchError(null);
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } finally {
      setAccountMenuOpen(false);
    }
  }, [connector, disconnectAsync]);

  const handleForgetLocally = useCallback(async () => {
    setIsForgetting(true);
    setSwitchError(null);
    try {
      await disconnectAsync();
    } catch {
      // still clear local wagmi cache
    } finally {
      clearWagmiWalletStorage();
      setAccountMenuOpen(false);
      setIsForgetting(false);
      window.location.reload();
    }
  }, [disconnectAsync]);

  const handleSwitchNetwork = useCallback(async () => {
    setSwitchError(null);
    try {
      if (DEFAULT_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID) {
        await switchToBaseSepoliaWithAddChain(switchChainAsync);
      } else {
        await switchChainAsync({ chainId: DEFAULT_CHAIN_ID });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not switch network.";
      setSwitchError(message);
    }
  }, [switchChainAsync]);

  if (isConnected && address) {
    return (
      <div ref={rootRef} className={cn("relative inline-flex", className)}>
        <Button
          type="button"
          variant="secondary"
          size={size}
          aria-expanded={accountMenuOpen}
          aria-haspopup="menu"
          className="gap-1.5 px-2.5 sm:px-3"
          onClick={() => setAccountMenuOpen((open) => !open)}
        >
          <span
            className={cn(
              "hidden rounded-full border px-2 py-0.5 text-[10px] font-medium sm:inline",
              wrongNetwork
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : "border-white/10 bg-white/5 text-muted-foreground",
            )}
          >
            {networkLabel}
          </span>
          <span className="font-mono text-xs">{shortAddress}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
              accountMenuOpen && "rotate-180",
            )}
          />
        </Button>

        {accountMenuOpen ? (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+0.35rem)] z-[60] min-w-[15.5rem] overflow-hidden rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] p-2 shadow-xl"
          >
            <div className="space-y-2 px-1 py-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Connected wallet
                </p>
                <p
                  className="mt-0.5 break-all font-mono text-[11px] text-[var(--arena-text)]"
                  title={address}
                >
                  {address}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  via {getConnectorDisplayName(connector)}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Network
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs",
                    wrongNetwork ? "text-red-300" : "text-[var(--arena-text)]",
                  )}
                >
                  {networkLabel}
                  {wrongNetwork ? " — switch required for test stake lock" : null}
                </p>
              </div>

              {wrongNetwork ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  disabled={isSwitching}
                  onClick={() => void handleSwitchNetwork()}
                >
                  {isSwitching ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Switching…
                    </>
                  ) : DEFAULT_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID ? (
                    `Switch to ${BASE_SEPOLIA_CONFIG.name}`
                  ) : (
                    `Switch to ${getUserChainLabel(DEFAULT_CHAIN_ID)}`
                  )}
                </Button>
              ) : null}

              {switchError ? (
                <p className="text-[10px] leading-relaxed text-red-400">{switchError}</p>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-white/15"
                disabled={isDisconnecting || isForgetting}
                onClick={() => void handleDisconnect()}
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Disconnecting…
                  </>
                ) : (
                  "Disconnect Wallet"
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-amber-200/90 hover:bg-amber-500/10 hover:text-amber-100"
                disabled={isForgetting || isDisconnecting}
                onClick={() => void handleForgetLocally()}
              >
                {isForgetting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Forgetting…
                  </>
                ) : (
                  "Forget Wallet Locally"
                )}
              </Button>

              <p className="text-[10px] leading-relaxed text-muted-foreground">
                To switch accounts, disconnect first, then connect again and choose
                a wallet.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative flex flex-col items-stretch gap-0.5", className)}>
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={connecting}
        aria-expanded={walletMenuOpen}
        aria-haspopup="dialog"
        title="Choose MetaMask or another wallet for Base Sepolia"
        onClick={() => {
          setConnectErrorLocal(null);
          setWalletMenuOpen((open) => !open);
        }}
      >
        {connecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect Wallet
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
            walletMenuOpen && "rotate-180",
          )}
        />
      </Button>

      <WalletSelectModal
        open={walletMenuOpen}
        connecting={connecting}
        pendingChoice={pendingChoice}
        metaMaskAvailable={metaMaskAvailable}
        otherWalletAvailable={otherWalletAvailable}
        error={connectErrorLocal ?? connectError?.message ?? null}
        anchorRef={rootRef}
        menuRef={walletMenuRef}
        placement={menuPlacement}
        onClose={() => {
          if (!connecting) {
            setWalletMenuOpen(false);
            setConnectErrorLocal(null);
          }
        }}
        onSelect={(choice) => void handleConnectChoice(choice)}
      />

      {showDemoHint ? (
        <p className="hidden text-center text-[9px] leading-snug text-muted-foreground lg:block">
          Base Sepolia · MetaMask or other wallet
        </p>
      ) : null}
      {!walletMenuOpen && connectErrorLocal ? (
        <p className="text-center text-xs text-red-400">{connectErrorLocal}</p>
      ) : null}
      {!walletMenuOpen && connectError ? (
        <p className="text-center text-xs text-red-400">{connectError.message}</p>
      ) : null}
    </div>
  );
}
