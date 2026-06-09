"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, Wallet } from "lucide-react";
import type { WalletChoice } from "@/lib/onchain/walletConnectors";
import { cn } from "@/lib/utils";

export type WalletMenuPlacement = "anchored" | "centered";

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
  anchorRef?: RefObject<HTMLElement | null>;
  menuRef?: RefObject<HTMLDivElement | null>;
  placement?: WalletMenuPlacement;
};

const MENU_WIDTH_PX = 280;
const VIEWPORT_MARGIN_PX = 12;
const ACTION_BAR_CLEARANCE_PX = 88;

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

function WalletSelectPanel({
  connecting,
  pendingChoice,
  metaMaskAvailable,
  otherWalletAvailable,
  error,
  onSelect,
  className,
  panelRef,
  style,
}: {
  connecting: boolean;
  pendingChoice?: WalletChoice | null;
  metaMaskAvailable: boolean;
  otherWalletAvailable: boolean;
  error?: string | null;
  onSelect: (choice: WalletChoice) => void;
  className?: string;
  panelRef?: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
}) {
  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-select-title"
      style={style}
      className={cn(
        "z-[220] w-[min(100vw-1.5rem,17.5rem)] overflow-hidden rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface)] shadow-2xl shadow-black/50",
        style ? "fixed" : undefined,
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

      <div className="max-h-[min(50vh,16rem)] space-y-2 overflow-y-auto overscroll-contain p-2.5">
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
  anchorRef,
  menuRef,
  placement = "anchored",
}: WalletSelectModalProps) {
  const internalPanelRef = useRef<HTMLDivElement>(null);
  const panelRef = menuRef ?? internalPanelRef;
  const [mounted, setMounted] = useState(false);
  const [anchoredStyle, setAnchoredStyle] = useState<CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useLayoutEffect(() => {
    if (!open || placement !== "anchored" || !anchorRef?.current) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const panelWidth = Math.min(
        MENU_WIDTH_PX,
        window.innerWidth - VIEWPORT_MARGIN_PX * 2,
      );
      const panelHeight = panel?.offsetHeight ?? 260;
      const spaceBelow =
        window.innerHeight - rect.bottom - ACTION_BAR_CLEARANCE_PX;
      const spaceAbove = rect.top - VIEWPORT_MARGIN_PX;
      const openAbove = spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow;

      let top = openAbove
        ? rect.top - panelHeight - 8
        : rect.bottom + 8;
      top = Math.max(
        VIEWPORT_MARGIN_PX,
        Math.min(top, window.innerHeight - panelHeight - VIEWPORT_MARGIN_PX),
      );

      let left = rect.right - panelWidth;
      left = Math.max(
        VIEWPORT_MARGIN_PX,
        Math.min(left, window.innerWidth - panelWidth - VIEWPORT_MARGIN_PX),
      );

      setAnchoredStyle({
        top,
        left,
        width: panelWidth,
      });
    };

    updatePosition();
    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, placement, anchorRef, panelRef, metaMaskAvailable, otherWalletAvailable, error]);

  if (!open || !mounted) return null;

  if (placement === "centered") {
    return createPortal(
      <>
        <button
          type="button"
          aria-label="Close wallet chooser"
          className="fixed inset-0 z-[210] bg-black/55 backdrop-blur-[2px]"
          onClick={() => {
            if (!connecting) onClose();
          }}
        />
        <div className="pointer-events-none fixed inset-0 z-[220] flex items-center justify-center p-4">
          <div className="pointer-events-auto w-full max-w-[17.5rem]">
            <WalletSelectPanel
              connecting={connecting}
              pendingChoice={pendingChoice}
              metaMaskAvailable={metaMaskAvailable}
              otherWalletAvailable={otherWalletAvailable}
              error={error}
              onSelect={onSelect}
              className={className}
              panelRef={panelRef}
            />
          </div>
        </div>
      </>,
      document.body,
    );
  }

  return createPortal(
    <WalletSelectPanel
      connecting={connecting}
      pendingChoice={pendingChoice}
      metaMaskAvailable={metaMaskAvailable}
      otherWalletAvailable={otherWalletAvailable}
      error={error}
      onSelect={onSelect}
      className={className}
      panelRef={panelRef}
      style={anchoredStyle}
    />,
    document.body,
  );
}
