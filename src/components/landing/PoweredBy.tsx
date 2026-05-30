import { Badge } from "@/components/ui/badge";

const partners = [
  { name: "Base", description: "L2 settlement" },
  { name: "Bankr", description: "Skills & payments" },
  { name: "x402", description: "Demo session access" },
];

export function PoweredBy() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Powered by
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
