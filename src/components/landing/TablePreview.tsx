import { PlayingCard } from "@/components/arena/PlayingCard";
import { ChipStack } from "@/components/arena/ChipStack";
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
    active: true,
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
      return "left-1/2 top-[6%] -translate-x-1/2";
    case "bottom":
      return "bottom-[5%] left-1/2 -translate-x-1/2";
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

      <div className="relative overflow-hidden rounded-[2rem] border border-casino-gold/25 bg-[#050508] p-3 shadow-[0_32px_80px_rgba(0,0,0,0.65)] sm:p-4">
        <div className="relative mx-auto aspect-[16/10] min-h-[260px] w-full max-w-4xl sm:min-h-[320px]">
          <div className="absolute inset-[2%] rounded-[50%] border-4 border-[#3d2817] bg-gradient-to-b from-[#5c3d1e] to-[#2a1a0e] shadow-inner" />

          <div
            className="absolute inset-[5%] overflow-hidden rounded-[50%] border-2 border-casino-gold/40 shadow-glow-green"
            style={{
              background:
                "radial-gradient(ellipse 75% 60% at 50% 42%, #1fa864 0%, #0d5c36 42%, #063d24 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
              }}
            />
            <div className="absolute inset-[12%] rounded-[50%] border border-white/10" />
          </div>

          <div className="absolute left-1/2 top-[28%] z-[15] flex w-[min(92%,20rem)] -translate-x-1/2 flex-col items-center">
            <ChipStack amount={42} size="md" label="Pot" className="mb-2 justify-center" />
            <div className="flex items-end justify-center gap-1 sm:gap-1.5">
              {boardCards.map((card, i) => (
                <PlayingCard
                  key={`preview-board-${card.rank}-${card.suit}-${i}`}
                  rank={card.rank}
                  suit={card.suit}
                  size="sm"
                  animate={false}
                  className="relative z-[2]"
                />
              ))}
            </div>
            <p className="mt-1.5 text-[8px] uppercase tracking-wider text-white/45">
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
                      className="relative"
                    />
                  ))}
                </div>
              ) : null}
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-bold sm:h-10 sm:w-10",
                  agent.active
                    ? "border-emerald-400/60 bg-emerald-950/80 text-emerald-100 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "border-white/20 bg-black/50 text-white/70",
                )}
              >
                {agent.initials}
              </div>
              <span className="text-[10px] font-medium text-white/85">{agent.name}</span>
              <span className="text-[10px] text-casino-goldLight">
                {agent.stack.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
          Live Human vs AI · Shared Agent Battle · Testnet stake flow · Test
          tokens only · No mainnet funds
        </div>
      </div>
    </section>
  );
}
