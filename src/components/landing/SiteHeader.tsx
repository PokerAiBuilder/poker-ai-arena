import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--arena-border)] bg-[var(--arena-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <BrandMark size={32} />
          <span className="truncate text-sm font-bold tracking-wider text-gradient-arena">
            Poker AI Arena
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/arena"
            className="v1-button-primary hidden px-3 py-1.5 text-xs sm:inline-flex"
          >
            Enter Arena
          </Link>
          <Link
            href="#roadmap"
            className="hidden text-sm text-[var(--arena-muted)] transition-colors hover:text-[var(--arena-text)] md:inline"
          >
            Roadmap
          </Link>
          <ConnectWalletButton size="sm" showDemoHint={false} />
        </nav>
      </div>
    </header>
  );
}
