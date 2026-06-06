"use client";

import { useEffect } from "react";
import { Loader2, Wallet } from "lucide-react";
import type { WalletChoice } from "@/lib/onchain/walletConnectors";
import { cn } from "@/lib/utils";

type WalletSelectModalProps = {
  open: boolean;
  connecting: boolean;
  pendingChoice?: WalletChoice | null;
  metaMaskAvailable: boolean;
  otherWalletAvailable: boolean;
  error?: string | null;
  onClose: () => void;
  onSelect: (choice: WalletChoice) => void;
  className?: string;
};

function WalletOption({
  title,
  subtitle,
  disabled,
  unavailableLabel,
  pending,
  onClick,
}: {
  title: string;
  subtitle: string;
  disabled?: boolean;
  unavailableLabel?: string;
  pending?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || pending}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-white/5 bg-black/15 opacity-60"
          : "border-white/10 bg-black/25 hover:border-[var(--arena-cyan)]/35 hover:bg-[var(--arena-blue)]/10",
        pending && !disabled && "border-[var(--arena-cyan)]/40 bg-[var(--arena-blue)]/10",
      )}
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[var(--arena-surface-2)]">
          <Wallet className="h-3.5 w-3.5 text-[var(--arena-cyan)]" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-[var(--arena-text)]">
            {title}
          </span>
          <span className="block text-[11px] leading-snug text-muted-foreground">
            {unavailableLabel ?? subtitle}
          </span>
        </span>
      </span>
      {pending ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--arena-cyan)]" />
      ) : null}
    </button>
  );
}

export function WalletSelectModal({
  open,
  connecting,
  pendingChoice = null,
  metaMaskAvailable,
  otherWalletAvailable,
  error = null,
  onClose,
  onSelect,
  className,
}: WalletSelectModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !connecting) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, connecting, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-select-title"
      className={cn(
        "absolute right-0 top-[calc(100%+0.35rem)] z-[60] w-[min(100vw-1rem,17.5rem)] overflow-hidden rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] shadow-xl",
        className,
      )}
    >
      <div className="border-b border-white/10 px-3.5 py-2.5">
        <h2
          id="wallet-select-title"
          className="text-sm font-semibold text-[var(--arena-text)]"
        >
          Choose wallet
        </h2>
      </div>

      <div className="space-y-2 p-2.5">
        <WalletOption
          title="MetaMask"
          subtitle="Recommended for Base Sepolia test stake flow"
          unavailableLabel={
            metaMaskAvailable ? undefined : "MetaMask not detected"
          }
          disabled={connecting || !metaMaskAvailable}
          pending={pendingChoice === "metamask"}
          onClick={() => onSelect("metamask")}
        />

        <WalletOption
          title="Other Wallet"
          subtitle="Rabby, OKX, Coinbase, or browser wallet"
          unavailableLabel={
            otherWalletAvailable ? undefined : "No browser wallet detected"
          }
          disabled={connecting || !otherWalletAvailable}
          pending={pendingChoice === "other"}
          onClick={() => onSelect("other")}
        />
      </div>

      <div className="border-t border-white/10 px-3.5 py-2">
        {error ? (
          <p className="mb-1.5 text-[10px] leading-relaxed text-red-400">{error}</p>
        ) : null}
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Base Sepolia test stake flow · disconnect to switch accounts
        </p>
      </div>
    </div>
  );
}
