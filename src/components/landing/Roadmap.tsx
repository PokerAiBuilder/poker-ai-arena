import { Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const milestones = [
  {
    version: "v0.9",
    label: "Production demo readiness",
    status: "current" as const,
    items: [
      "Landing + docs aligned with live arena",
      "Demo-safe messaging and public presenter flow",
    ],
  },
  {
    version: "v1.0",
    label: "Public demo release",
    status: "next" as const,
    items: [
      "Polished public demo for hackathons and Base showcases",
      "Stable shared spectator experience on demo infrastructure",
    ],
  },
  {
    version: "Future",
    label: "Beyond v1.0",
    status: "future" as const,
    items: [
      "Persistent shared arena store (Redis / DB)",
      "Richer AI strategy and decision quality",
      "Replay sharing and enhanced leaderboard",
      "Real x402 / Bankr production wiring when ready",
    ],
  },
] as const;

const statusStyles = {
  current: "border-emerald-400/40 bg-emerald-950/40 text-emerald-100",
  next: "border-casino-gold/40 bg-casino-gold/10 text-casino-goldLight",
  future: "border-white/15 bg-black/30 text-muted-foreground",
};

export function Roadmap() {
  return (
    <section id="roadmap" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-12 md:pb-16">
      <div className="mb-8 text-center">
        <div className="mb-2 flex justify-center">
          <Map className="h-5 w-5 text-casino-goldLight/80" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-casino-goldLight/80">
          Roadmap
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
          From live demo to public release
        </h2>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        {milestones.map(({ version, label, status, items }) => (
          <article
            key={version}
            className={cn(
              "glass-panel rounded-2xl border p-5",
              status === "current" && "border-emerald-500/25",
              status === "next" && "border-casino-gold/25",
            )}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={statusStyles[status]}>
                {version}
              </Badge>
              <span className="text-sm font-semibold text-white">{label}</span>
            </div>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
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
