import { Map } from "lucide-react";
import { cn } from "@/lib/utils";

const milestones = [
  {
    version: "v1.0",
    label: "Public demo polish",
    status: "current" as const,
    items: [
      "Premium Base-style landing and arena identity",
      "Production QA checklist and demo-safe messaging",
      "Shared spectator on demo infrastructure",
    ],
  },
  {
    version: "v1.1",
    label: "x402 / Bankr access prototype",
    status: "next" as const,
    items: [
      "Real x402-style access prototype on testnet",
      "Bankr/x402 layer wired for production access experiments",
      "Still demo-first — no live mainnet settlement claims",
    ],
  },
  {
    version: "v1.2",
    label: "Real AI agent layer",
    status: "future" as const,
    items: [
      "LLM-powered agent decisions via Bankr skills",
      "Richer reasoning and strategy profiles",
    ],
  },
  {
    version: "v1.3",
    label: "Persistent shared arena",
    status: "future" as const,
    items: [
      "Redis / DB backed shared hand store",
      "Multi-instance sync and durable spectator state",
    ],
  },
] as const;

const statusStyles = {
  current:
    "border-[var(--arena-cyan)]/50 bg-[var(--arena-blue)]/15 text-[var(--arena-cyan)]",
  next: "border-[var(--arena-blue-bright)]/40 bg-[var(--arena-surface-2)] text-[var(--arena-text)]",
  future: "border-[var(--arena-border)] bg-[var(--arena-bg)]/60 text-[var(--arena-muted)]",
};

export function Roadmap() {
  return (
    <section
      id="roadmap"
      className="v1-section mx-auto max-w-6xl scroll-mt-24 py-12 md:py-16"
    >
      <div className="mb-8 text-center">
        <div className="mb-2 flex justify-center">
          <Map className="h-5 w-5 text-[var(--arena-cyan)]" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--arena-cyan)]">
          Roadmap
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--arena-text)] md:text-3xl">
          From public demo to production arena
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--arena-muted)]">
          Bankr/x402 layer prepared for future production access — not live payments
          in the current demo.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {milestones.map(({ version, label, status, items }) => (
          <article
            key={version}
            className={cn(
              "v1-card v1-glow-border flex min-w-0 flex-col p-5",
              status === "current" && "ring-1 ring-[var(--arena-cyan)]/30",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={cn("v1-badge border", statusStyles[status])}>{version}</span>
              <span className="text-sm font-semibold text-[var(--arena-text)]">{label}</span>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-[var(--arena-muted)]">
              {items.map((item) => (
                <li key={item} className="break-words">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
