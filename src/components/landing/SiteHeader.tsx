import Link from "next/link";
import { BrandMark } from "@/components/brand/BrandMark";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--arena-border)] bg-[var(--arena-bg)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-sm font-bold tracking-wider text-[var(--arena-text)] transition-opacity hover:opacity-90"
        >
          <BrandMark size={32} />
          <span className="bg-gradient-to-r from-[var(--arena-text)] via-[var(--arena-cyan)] to-[var(--arena-blue-bright)] bg-clip-text text-transparent">
            Poker AI
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/arena"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Arena
          </Link>
          <Link
            href="#roadmap"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Roadmap
          </Link>
          <ConnectWalletButton size="sm" />
        </nav>
      </div>
    </header>
  );
}
