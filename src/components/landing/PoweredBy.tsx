import { Badge } from "@/components/ui/badge";

const partners = [
  { name: "Base", description: "Base testnet scaffold" },
  { name: "Bankr", description: "Integration-ready" },
  { name: "x402", description: "Mock demo access" },
] as const;

export function PoweredBy() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Built for demo on
      </p>
      <p className="mx-auto mb-6 max-w-xl text-center text-xs leading-relaxed text-muted-foreground">
        Wallet and access layers are scaffolded for Base testnet demos. Bankr/x402
        integration is prepared for future production wiring — no live settlement in
        this MVP.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {partners.map((partner) => (
          <div
            key={partner.name}
            className="glass-panel flex flex-col items-center rounded-xl p-6 text-center transition-colors hover:border-casino-gold/30"
          >
            <Badge variant="default" className="mb-3">
              {partner.name}
            </Badge>
            <p className="text-sm text-muted-foreground">{partner.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
