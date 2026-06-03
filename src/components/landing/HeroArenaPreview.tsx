import { cn } from "@/lib/utils";

const spectatorAgents = [
  { id: "pm", label: "PM", name: "PokerMaster", angle: -90 },
  { id: "bb", label: "BB", name: "BluffBot", angle: 0 },
  { id: "rm", label: "RM", name: "RiverMind", angle: 90 },
  { id: "ch", label: "CH", name: "ChipHunter", angle: 180 },
] as const;

function polarToPercent(angleDeg: number, radiusPercent: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + radiusPercent * Math.cos(rad)}%`,
    top: `${50 + radiusPercent * Math.sin(rad)}%`,
  };
}

export function HeroArenaPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "v1-panel v1-glow-border relative overflow-hidden p-3 sm:p-4",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--arena-blue)]/10 via-transparent to-[var(--arena-cyan)]/5" />
      <div className="relative mx-auto aspect-[4/3] min-h-[220px] w-full max-w-md sm:min-h-[260px]">
        {/* Timeline rail */}
        <div className="absolute left-3 right-3 top-2 flex items-center gap-1">
          <span className="v1-badge">Shared timeline</span>
          <div className="flex flex-1 items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= 2
                    ? "bg-gradient-to-r from-[var(--arena-blue)] to-[var(--arena-cyan)]"
                    : "bg-[var(--arena-surface-2)]",
                )}
              />
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="absolute inset-[12%] flex items-center justify-center">
          <div
            className="relative h-[72%] w-[88%] rounded-[50%] border border-[var(--arena-border)] shadow-arena-blue"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(0, 82, 255, 0.35) 0%, rgba(10, 15, 26, 0.95) 55%, #030508 100%)",
            }}
          >
            <div className="absolute inset-[8%] rounded-[50%] border border-[var(--arena-cyan)]/20" />
            <div className="absolute left-1/2 top-[38%] z-10 -translate-x-1/2 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[var(--arena-muted)]">
                Pot
              </p>
              <p className="text-sm font-bold tabular-nums text-[var(--arena-cyan)]">42</p>
              <div className="mt-2 flex justify-center gap-1">
                {["A♠", "K♥", "7♦"].map((c) => (
                  <span
                    key={c}
                    className="rounded border border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--arena-text)]"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent nodes */}
        {spectatorAgents.map((agent, index) => {
          const pos = polarToPercent(agent.angle, 42);
          const active = index === 1;
          return (
            <div
              key={agent.id}
              className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
              style={{ left: pos.left, top: pos.top }}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-[9px] font-bold sm:h-9 sm:w-9",
                  active
                    ? "border-[var(--arena-cyan)] bg-[var(--arena-blue)]/40 text-white shadow-arena-cyan"
                    : "border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 text-[var(--arena-muted)]",
                )}
              >
                {agent.label}
              </div>
              <span className="hidden max-w-[4.5rem] truncate text-[8px] text-[var(--arena-muted)] sm:block">
                {agent.name}
              </span>
            </div>
          );
        })}

        {/* Neural accent lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-40"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1="50"
            y1="50"
            x2="88"
            y2="50"
            stroke="var(--arena-blue)"
            strokeWidth="0.4"
            strokeDasharray="2 2"
          />
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="12"
            stroke="var(--arena-cyan)"
            strokeWidth="0.4"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      <p className="relative mt-2 text-center text-[10px] leading-relaxed text-[var(--arena-muted)]">
        Human vs AI · Shared Agent Battle · Explainable decisions
      </p>
    </div>
  );
}
