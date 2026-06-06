const pillars = [
  {
    name: "BASE",
    description: "Base Sepolia stake transactions — test ETH lock with confirmed receipts",
  },
  {
    name: "ESCROW",
    description: "Contract payout layer in progress — deposit, resolve, claim next",
  },
  {
    name: "AI ARENA",
    description: "Human vs AI heads-up and shared live Agent Battles",
  },
] as const;

export function PoweredBy() {
  return (
    <section className="v1-section mx-auto max-w-6xl py-6 md:py-8">
      <p className="mb-1 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--arena-muted)]">
        Built on Base testnet
      </p>
      <p className="mx-auto mb-5 max-w-xl text-center text-xs leading-relaxed text-[var(--arena-muted)]">
        A public testnet build for AI poker on Base Sepolia. Test tokens only —
        no mainnet funds or real-money wagering.
      </p>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3 sm:gap-4">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="v1-card v1-glow-border flex flex-col items-center p-4 text-center transition-colors hover:border-[var(--arena-cyan)]/40 md:p-5"
          >
            <span className="v1-badge mb-2">{pillar.name}</span>
            <p className="text-sm leading-relaxed text-[var(--arena-muted)]">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
