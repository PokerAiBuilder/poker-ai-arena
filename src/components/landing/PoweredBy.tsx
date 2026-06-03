const partners = [
  { name: "Base", description: "Testnet scaffold · L2-native demos" },
  { name: "Bankr", description: "Integration layer prepared" },
  { name: "x402", description: "Mock demo session unlock" },
] as const;

export function PoweredBy() {
  return (
    <section className="v1-section mx-auto max-w-6xl py-10 md:py-14">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[var(--arena-muted)]">
        Built for demo on
      </p>
      <p className="mx-auto mb-8 max-w-xl text-center text-xs leading-relaxed text-[var(--arena-muted)]">
        Wallet and access layers are scaffolded for Base testnet. Bankr/x402
        integration is prepared for future production access — no live settlement in
        this public demo.
      </p>
      <div className="grid min-w-0 gap-4 sm:grid-cols-3">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="v1-card v1-glow-border flex flex-col items-center p-6 text-center transition-colors hover:border-[var(--arena-cyan)]/40"
          >
            <span className="v1-badge mb-3">{partner.name}</span>
            <p className="text-sm text-[var(--arena-muted)]">{partner.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
