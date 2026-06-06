/** Clear wagmi / WalletConnect browser storage without touching poker stake keys. */

const PRESERVED_PREFIXES = ["poker-ai-arena"];

function shouldClearStorageKey(key: string): boolean {
  if (PRESERVED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return false;
  }

  const lower = key.toLowerCase();
  return (
    key.startsWith("wagmi") ||
    key.startsWith("wc@2") ||
    key.startsWith("walletconnect") ||
    lower.includes("walletconnect") ||
    key.startsWith("-walletlink") ||
    key.startsWith("metamask") ||
    key.startsWith("WALLETCONNECT") ||
    key.startsWith("rk-")
  );
}

function clearMatchingKeys(storage: Storage): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && shouldClearStorageKey(key)) {
      keys.push(key);
    }
  }
  keys.forEach((key) => storage.removeItem(key));
}

export function clearWagmiWalletStorage(): void {
  if (typeof window === "undefined") return;
  clearMatchingKeys(window.localStorage);
  clearMatchingKeys(window.sessionStorage);
}
