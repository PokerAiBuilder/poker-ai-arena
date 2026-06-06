import { PlayingCard } from "@/components/arena/PlayingCard";
import { cn } from "@/lib/utils";

const spectatorAgents = [
  { id: "pm", label: "PM", name: "PokerMaster", angle: -90 },
  { id: "bb", label: "BB", name: "BluffBot", angle: 0 },
  { id: "rm", label: "RM", name: "RiverMind", angle: 90 },
  { id: "ch", label: "CH", name: "ChipHunter", angle: 180 },
] as const;

const timelineSteps = [
  { id: "preflop", label: "Pre" },
  { id: "flop", label: "Flop" },
  { id: "turn", label: "Turn" },
  { id: "river", label: "River" },
  { id: "done", label: "Result" },
] as const;

const boardCards = [
  { rank: "A", suit: "spades" as const },
  { rank: "K", suit: "hearts" as const },
  { rank: "7", suit: "diamonds" as const },
];

function polarToPercent(angleDeg: number, radiusPercent: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + radiusPercent * Math.cos(rad)}%`,
    top: `${50 + radiusPercent * 0.72 * Math.sin(rad) + 4}%`,
  };
}

export function HeroArenaPreview({ className }: { className?: string }) {
  const timelineProgress = 2;

  return (
    <div
      className={cn(
        "v1-panel v1-glow-border relative overflow-hidden p-3 sm:p-4",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--arena-blue)]/12 via-transparent to-[var(--arena-cyan)]/6" />
      <div
        className="pointer-events-none absolute left-1/2 top-[55%] h-[58%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-60 blur-2xl"
        style={{
          background:
            "radial-gradient(ellipse, rgba(0, 82, 255, 0.32) 0%, rgba(34, 211, 238, 0.12) 45%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto aspect-[4/3] min-h-[220px] w-full max-w-md sm:min-h-[280px]">
        {/* Shared timeline HUD */}
        <div className="hero-preview-hud relative z-30 mx-0.5">
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-md border border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--arena-cyan)]">
              Shared timeline
            </span>
            <div className="flex min-w-0 flex-1 gap-1">
              {timelineSteps.map((step, index) => {
                const active = index <= timelineProgress;
                return (
                  <div key={step.id} className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        active
                          ? "bg-gradient-to-r from-[var(--arena-blue)] to-[var(--arena-cyan)] shadow-[0_0_10px_rgba(34,211,238,0.35)]"
                          : "bg-[var(--arena-surface-2)]/90",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-center text-[7px] font-semibold uppercase tracking-wide",
                        active ? "text-[var(--arena-cyan)]/90" : "text-[var(--arena-muted)]/55",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table stage */}
        <div className="absolute inset-x-[2%] bottom-[4%] top-[14%] flex items-center justify-center">
          <div className="relative h-full w-full max-w-[92%]">
            {/* Outer rim + glow */}
            <div className="hero-preview-table-rim absolute inset-[2%] rounded-[50%]" />

            {/* Felt surface */}
            <div className="hero-preview-table-felt absolute inset-[5.5%] overflow-hidden rounded-[50%]">
              <div className="hero-preview-felt-texture absolute inset-0 opacity-[0.14]" />
              <div className="absolute inset-[9%] rounded-[50%] border border-[var(--arena-cyan)]/12" />
              <div
                className="pointer-events-none absolute inset-0 rounded-[50%]"
                style={{
                  background:
                    "radial-gradient(ellipse 55% 40% at 50% 32%, rgba(34, 211, 238, 0.12) 0%, transparent 65%)",
                }}
              />
            </div>

            {/* Center: pot + board */}
            <div className="absolute left-1/2 top-[44%] z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
              <div className="hero-preview-pot-pill mb-2 flex items-center gap-1.5">
                <span className="flex -space-x-0.5" aria-hidden>
                  <span className="hero-preview-chip hero-preview-chip-red" />
                  <span className="hero-preview-chip hero-preview-chip-blue" />
                  <span className="hero-preview-chip hero-preview-chip-cyan" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Pot
                </span>
                <span className="text-sm font-bold tabular-nums text-[var(--arena-cyan)]">
                  42
                </span>
              </div>

              <div className="flex items-end justify-center">
                {boardCards.map((card, index) => (
                  <PlayingCard
                    key={`hero-board-${card.rank}-${card.suit}`}
                    rank={card.rank}
                    suit={card.suit}
                    size="xs"
                    animate={false}
                    className={cn(
                      "relative shadow-md",
                      index > 0 && "-ml-2",
                      index === 1 && "z-[2]",
                      index === 2 && "z-[3]",
                    )}
                  />
                ))}
                <PlayingCard
                  size="xs"
                  locked
                  lockedLabel="Turn"
                  animate={false}
                  className="relative z-[1] -ml-2 opacity-80"
                />
                <PlayingCard
                  size="xs"
                  locked
                  lockedLabel="River"
                  animate={false}
                  className="relative -ml-2 opacity-70"
                />
              </div>
            </div>

            {/* Agent nodes */}
            {spectatorAgents.map((agent, index) => {
              const pos = polarToPercent(agent.angle, 46);
              const active = index === 1;
              return (
                <div
                  key={agent.id}
                  className="absolute z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div
                    className={cn(
                      "hero-preview-agent relative flex h-9 w-9 items-center justify-center rounded-full text-[9px] font-bold sm:h-10 sm:w-10",
                      active ? "hero-preview-agent-active" : "hero-preview-agent-idle",
                    )}
                  >
                    {agent.label}
                    {active ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[var(--arena-bg)] bg-[var(--arena-cyan)] shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <span
                    className={cn(
                      "max-w-[4.5rem] truncate text-[9px] font-semibold",
                      active ? "text-[var(--arena-cyan)]" : "text-white/65",
                    )}
                  >
                    {agent.name}
                  </span>
                  <span className="text-[8px] tabular-nums text-[var(--arena-muted)]/80">
                    {(1200 + index * 80).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="relative mt-2 text-center text-[10px] leading-relaxed text-[var(--arena-muted)]">
        Human vs AI · Shared Agent Battle · Base Sepolia testnet · Test tokens only
      </p>
    </div>
  );
}
