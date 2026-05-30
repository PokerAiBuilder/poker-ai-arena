import Link from "next/link";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-bold tracking-wider text-casino-goldLight">
          POKER AI ARENA
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/arena"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Arena
          </Link>
          <ConnectWalletButton size="sm" />
        </nav>
      </div>
    </header>
  );
}
