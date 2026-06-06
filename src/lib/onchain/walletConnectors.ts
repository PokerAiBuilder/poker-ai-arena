"use client";

import {
  injected,
  metaMask,
  walletConnect,
} from "wagmi/connectors";
import type { CreateConnectorFn } from "wagmi";
import type { Connector } from "wagmi";
import type { EIP1193Provider } from "viem";
import { APP_NAME } from "@/lib/onchain/chains";

export const METAMASK_CONNECTOR_ID = "metaMaskSDK";
export const BROWSER_WALLET_CONNECTOR_ID = "injectedBrowser";
export const WALLET_CONNECT_CONNECTOR_ID = "walletConnect";

export type WalletChoice = "metamask" | "other";

type WindowWithEthereum = Window & { ethereum?: EIP1193Provider };

export function isWalletConnectConnectorId(id: string): boolean {
  return id === WALLET_CONNECT_CONNECTOR_ID || id.toLowerCase().includes("walletconnect");
}

export function isMetaMaskBrowserAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const eth = (window as WindowWithEthereum).ethereum as
    | (EIP1193Provider & { isMetaMask?: boolean; providers?: EIP1193Provider[] })
    | undefined;
  if (!eth) return false;
  if (eth.isMetaMask) return true;
  return Boolean(
    eth.providers?.some(
      (provider) => (provider as { isMetaMask?: boolean }).isMetaMask,
    ),
  );
}

export function isOtherWalletAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as WindowWithEthereum).ethereum);
}

export function resolveMetaMaskConnector(
  connectors: readonly Connector[],
): Connector | undefined {
  return connectors.find(
    (connector) =>
      connector.type === "metaMask" || connector.id === METAMASK_CONNECTOR_ID,
  );
}

/** Browser injected first; WalletConnect fallback when configured. */
export function resolveOtherWalletConnector(
  connectors: readonly Connector[],
): Connector | undefined {
  const browser = connectors.find(
    (connector) => connector.id === BROWSER_WALLET_CONNECTOR_ID,
  );
  if (browser && browser.ready !== false) return browser;

  const walletConnectConnector = connectors.find((connector) =>
    isWalletConnectConnectorId(connector.id),
  );
  if (walletConnectConnector && walletConnectConnector.ready !== false) {
    return walletConnectConnector;
  }

  return browser ?? walletConnectConnector;
}

export function resolveWalletChoiceConnector(
  connectors: readonly Connector[],
  choice: WalletChoice,
): Connector | undefined {
  if (choice === "metamask") return resolveMetaMaskConnector(connectors);
  return resolveOtherWalletConnector(connectors);
}

export function getConnectorDisplayName(connector?: Connector): string {
  if (!connector) return "Wallet";
  if (connector.type === "metaMask" || connector.id === METAMASK_CONNECTOR_ID) {
    return "MetaMask";
  }
  if (isWalletConnectConnectorId(connector.id)) {
    return "WalletConnect";
  }
  if (connector.id === BROWSER_WALLET_CONNECTOR_ID) {
    return "Other Wallet";
  }
  const name = connector.name.toLowerCase();
  if (name.includes("rabby")) return "Rabby Wallet";
  if (name.includes("okx")) return "OKX Wallet";
  if (name.includes("coinbase")) return "Coinbase Wallet";
  return connector.name;
}

export function createWalletConnectors(projectId: string): CreateConnectorFn[] {
  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const connectors: CreateConnectorFn[] = [
    metaMask({
      dappMetadata: {
        name: APP_NAME,
        url: siteOrigin,
      },
    }),
    injected({
      target: () => {
        if (typeof window === "undefined") return undefined;
        const provider = (window as WindowWithEthereum).ethereum;
        if (!provider) return undefined;
        return {
          id: BROWSER_WALLET_CONNECTOR_ID,
          name: "Browser Wallet",
          provider,
        };
      },
      shimDisconnect: true,
    }),
  ];

  if (projectId) {
    connectors.push(
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: APP_NAME,
          description: "Poker AI Arena testnet stake flow",
          url: siteOrigin,
          icons: [],
        },
      }),
    );
  }

  return connectors;
}
