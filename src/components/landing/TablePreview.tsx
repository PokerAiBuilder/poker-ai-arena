import { PlayingCard } from "@/components/arena/PlayingCard";
import { cn } from "@/lib/utils";

const boardCards = [
  { rank: "A", suit: "spades" as const },
  { rank: "K", suit: "hearts" as const },
  { rank: "7", suit: "diamonds" as const },
  { rank: "Q", suit: "clubs" as const },
  { rank: "2", suit: "spades" as const },
];

const previewAgents = [
  {
    name: "PokerMaster",
    initials: "PM",
    position: "top",
    stack: 1240,
    holeCards: null,
    active: false,
  },
  {
    name: "You",
    initials: "YO",
    position: "bottom",
    stack: 1500,
    holeCards: [
      { rank: "J", suit: "spades" as const },
      { rank: "10", suit: "spades" as const },
    ],
    active: true,
  },
] as const;

function seatPosition(position: (typeof previewAgents)[number]["position"]) {
  switch (position) {
    case "top":
      return "left-1/2 top-[8%] -translate-x-1/2";
    case "bottom":
      return "bottom-[6%] left-1/2 -translate-x-1/2";
    default:
      return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  }
}

export function TablePreview() {
  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 md:pb-20">
      <div className="mb-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Live arena preview
        </p>
        <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
          The same table you will use in the arena
        </h2>
      </div>

      <div className="v1-panel v1-glow-border relative overflow-hidden p-3 sm:p-4">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[60%] w-[65%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0, 82, 255, 0.25) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto aspect-[16/10] min-h-[260px] w-full max-w-4xl sm:min-h-[320px]">
          <div className="hero-preview-table-rim absolute inset-[2%] rounded-[50%]" />

          <div className="hero-preview-table-felt absolute inset-[5.5%] overflow-hidden rounded-[50%]">
            <div className="hero-preview-felt-texture absolute inset-0 opacity-[0.12]" />
            <div className="absolute inset-[10%] rounded-[50%] border border-[var(--arena-cyan)]/10" />
          </div>

          <div className="absolute left-1/2 top-[40%] z-[15] flex w-[min(92%,20rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <div className="hero-preview-pot-pill mb-2 flex items-center gap-1.5">
              <span className="flex -space-x-0.5" aria-hidden>
                <span className="hero-preview-chip hero-preview-chip-red" />
                <span className="hero-preview-chip hero-preview-chip-blue" />
              </span>
              <span className="text-[8px] font-semibold uppercase tracking-wider text-white/45">
                Pot
              </span>
              <span className="text-sm font-bold tabular-nums text-[var(--arena-cyan)]">42</span>
            </div>
            <div className="flex items-end justify-center">
              {boardCards.map((card, index) => (
                <PlayingCard
                  key={`preview-board-${card.rank}-${card.suit}-${index}`}
                  rank={card.rank}
                  suit={card.suit}
                  size="sm"
                  animate={false}
                  className={cn("relative shadow-md", index > 0 && "-ml-2.5")}
                />
              ))}
            </div>
            <p className="mt-2 text-[8px] uppercase tracking-wider text-[var(--arena-muted)]/70">
              Flop · Turn · River
            </p>
          </div>

          {previewAgents.map((agent) => (
            <div
              key={agent.name}
              className={cn(
                "absolute z-[20] flex flex-col items-center gap-1",
                seatPosition(agent.position),
              )}
            >
              {agent.holeCards ? (
                <div className="mb-0.5 flex -space-x-2">
                  {agent.holeCards.map((card, i) => (
                    <PlayingCard
                      key={`${agent.name}-hole-${i}`}
                      rank={card.rank}
                      suit={card.suit}
                      size="xs"
                      animate={false}
                      className="relative shadow-sm"
                    />
                  ))}
                </div>
              ) : null}
              <div
                className={cn(
                  "hero-preview-agent flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold sm:h-10 sm:w-10",
                  agent.active ? "hero-preview-agent-active" : "hero-preview-agent-idle",
                )}
              >
                {agent.initials}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  agent.active ? "text-[var(--arena-cyan)]" : "text-white/75",
                )}
              >
                {agent.name}
              </span>
              <span className="text-[10px] tabular-nums text-[var(--arena-muted)]">
                {agent.stack.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="relative mt-3 rounded-xl border border-[var(--arena-border)] bg-[var(--arena-surface-2)]/60 px-4 py-3 text-center text-xs leading-relaxed text-[var(--arena-muted)]">
          Live Human vs AI · Shared Agent Battle · Base testnet stake flow · Test
          tokens only · No mainnet funds
        </div>
      </div>
    </section>
  );
}
