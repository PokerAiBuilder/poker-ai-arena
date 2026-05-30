import { PlayingCard } from "@/components/arena/PlayingCard";
import { AgentAvatar, type AgentStatus } from "@/components/arena/AgentAvatar";
import { ChipStack } from "@/components/arena/ChipStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { HandResultDisplayType } from "@/lib/arena/simulationDisplay";
import type { Card } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

export type TableSeat = {
  id: string;
  name: string;
  avatar: string;
  strategy?: string;
  stack: number;
  holeCards: Card[];
  status: AgentStatus;
  position: "top" | "bottom" | "left" | "right";
  revealCards?: boolean;
};

type PokerTableProps = {
  pot: number | null;
  communityCards: Card[];
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType?: HandResultDisplayType;
  locked?: boolean;
  /** Tighter seat spacing when four agents are active at the table */
  fourPlayerLayout?: boolean;
  /** Agent Battle: all hole cards shown for spectators */
  spectatorMode?: boolean;
  /** Step-by-step Human vs AI demo */
  stepDemoMode?: boolean;
  /** Fill parent height for poker-room viewport layout */
  roomLayout?: boolean;
  onPayEntryFee?: () => void;
  payingEntryFee?: boolean;
  paymentError?: string | null;
  className?: string;
};

type CardSize = "xs" | "sm" | "md";

const seatPositionClasses: Record<
  TableSeat["position"],
  { default: string; compact: string; roomHeadsUp: string }
> = {
  top: {
    default: "left-1/2 top-[4%] -translate-x-1/2",
    compact: "left-1/2 top-[2%] -translate-x-1/2",
    roomHeadsUp: "left-1/2 top-0 -translate-x-1/2",
  },
  bottom: {
    default: "left-1/2 bottom-[5%] -translate-x-1/2",
    compact: "left-1/2 bottom-[2%] -translate-x-1/2",
    roomHeadsUp: "left-1/2 bottom-[4%] -translate-x-1/2",
  },
  left: {
    default: "left-[3%] top-[48%] -translate-y-1/2 sm:left-[5%]",
    compact: "left-[1%] top-[46%] -translate-y-1/2",
    roomHeadsUp: "left-[1%] top-[50%] -translate-y-1/2",
  },
  right: {
    default: "right-[3%] top-[48%] -translate-y-1/2 sm:right-[5%]",
    compact: "right-[1%] top-[46%] -translate-y-1/2",
    roomHeadsUp: "right-[1%] top-[50%] -translate-y-1/2",
  },
};

type SeatLayoutMode = "default" | "compact" | "roomHeadsUp";

function resolveSeatLayoutMode(
  fourPlayerLayout: boolean,
  roomLayout: boolean,
): SeatLayoutMode {
  if (fourPlayerLayout) return "compact";
  if (roomLayout) return "roomHeadsUp";
  return "default";
}

function resolveBoardCardSize(layoutMode: SeatLayoutMode): CardSize {
  if (layoutMode === "compact") return "xs";
  if (layoutMode === "roomHeadsUp") return "sm";
  return "sm";
}

function holeCardSize(
  seat: TableSeat,
  layoutMode: SeatLayoutMode,
): CardSize {
  if (layoutMode === "compact") return "xs";
  if (layoutMode === "roomHeadsUp") {
    if (seat.position === "bottom") return "sm";
    if (seat.position === "top") return "xs";
    return "xs";
  }
  if (seat.status === "folded") return "xs";
  return seat.position === "bottom" ? "md" : "sm";
}

function CommunityBoard({
  flopCards,
  cardSize,
}: {
  flopCards: Card[];
  cardSize: CardSize;
}) {
  const flopSlots: (Card | null)[] = [0, 1, 2].map((i) => flopCards[i] ?? null);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        {flopSlots.map((card, i) =>
          card ? (
            <PlayingCard
              key={`flop-${card.rank}-${card.suit}-${i}`}
              rank={card.rank}
              suit={card.suit}
              size={cardSize}
              animate
              className="relative z-[2]"
            />
          ) : (
            <PlayingCard
              key={`flop-empty-${i}`}
              faceDown
              size={cardSize}
              animate={false}
              className="relative z-[2]"
            />
          ),
        )}
        <PlayingCard
          locked
          lockedLabel="Turn"
          size={cardSize}
          className="relative z-[2]"
        />
        <PlayingCard
          locked
          lockedLabel="River"
          size={cardSize}
          className="relative z-[2]"
        />
      </div>
      <p className="text-[8px] uppercase tracking-wider text-white/45">
        MVP: Pre-flop + Flop only
      </p>
    </div>
  );
}

type StepDemoBoardSlotKind = "flop" | "turn" | "river";

function StepDemoBoardSlot({
  card,
  kind,
  slotIndex,
  cardSize,
  roomLayout = false,
}: {
  card: Card | null;
  kind: StepDemoBoardSlotKind;
  slotIndex: number;
  cardSize: CardSize;
  roomLayout?: boolean;
}) {
  const caption =
    kind === "flop" ? "Flop" : kind === "turn" ? "Turn" : "River";

  return (
    <div className="flex flex-col items-center gap-0.5">
      {card ? (
        <PlayingCard
          rank={card.rank}
          suit={card.suit}
          size={cardSize}
          animate
          className="relative z-[2]"
        />
      ) : (
        <PlayingCard
          locked
          lockedLabel={kind === "flop" ? String(slotIndex + 1) : caption}
          size={cardSize}
          className={cn(
            "relative z-[2]",
            kind === "flop"
              ? "border-emerald-500/25 bg-emerald-950/25 text-emerald-200/50"
              : "border-amber-500/20 bg-amber-950/20 text-amber-200/45",
          )}
        />
      )}
      <span
        className={cn(
          "text-[6px] font-medium uppercase leading-none tracking-wider",
          card ? "text-transparent" : "text-white/40",
          roomLayout && "hidden",
        )}
        aria-hidden={card != null || roomLayout}
      >
        {caption}
      </span>
    </div>
  );
}

function StepDemoCommunityBoard({
  communityCards,
  cardSize,
  roomLayout = false,
}: {
  communityCards: Card[];
  cardSize: CardSize;
  roomLayout?: boolean;
}) {
  const slots: { kind: StepDemoBoardSlotKind; index: number }[] = [
    { kind: "flop", index: 0 },
    { kind: "flop", index: 1 },
    { kind: "flop", index: 2 },
    { kind: "turn", index: 3 },
    { kind: "river", index: 4 },
  ];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-end justify-center gap-1.5 sm:gap-2">
        {slots.map(({ kind, index }) => (
          <StepDemoBoardSlot
            key={`step-slot-${kind}-${index}`}
            card={communityCards[index] ?? null}
            kind={kind}
            slotIndex={index}
            cardSize={cardSize}
            roomLayout={roomLayout}
          />
        ))}
      </div>
      {roomLayout ? null : (
        <p className="text-[8px] uppercase tracking-wider text-white/45">
          Step Demo: Preflop → Flop → Turn → River
        </p>
      )}
    </div>
  );
}

function WinnerBanner({
  winnerName,
  resultType,
  winningHand,
  pot,
  compact = false,
  ultraCompact = false,
}: {
  winnerName: string;
  resultType: HandResultDisplayType;
  winningHand?: string;
  pot: number | null;
  compact?: boolean;
  ultraCompact?: boolean;
}) {
  const isFoldWin = resultType === "fold";

  if (ultraCompact) {
    return (
      <div
        className={cn(
          "relative z-[30] w-full max-w-[min(100%,16rem)] rounded-lg border border-casino-gold/60",
          "arena-table-glow bg-black/85 px-2.5 py-1.5 text-center backdrop-blur-md animate-fade-in",
        )}
      >
        <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-casino-gold/80">
          Hand result
        </p>
        <p className="text-sm font-bold leading-tight text-gradient-gold">
          {winnerName}
        </p>
        <p className="text-[10px] text-white/75">
          {isFoldWin ? "Win by fold" : (winningHand ?? "Showdown")}
        </p>
        {pot != null ? (
          <p className="text-[10px] font-semibold text-casino-goldLight">
            Pot: {pot.toLocaleString()}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[30] w-full max-w-[min(100%,18rem)] rounded-xl border-2 border-casino-gold/70",
        "arena-table-glow bg-gradient-to-b from-black/90 to-black/75 text-center backdrop-blur-md animate-fade-in",
        compact ? "px-2.5 py-2" : "mt-2 px-3 py-3 sm:px-4",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-casino-gold/90">
        Hand result
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/60">Winner</p>
      <p className="text-base font-bold leading-tight text-gradient-gold sm:text-lg">
        {winnerName}
      </p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/50">
        Result type
      </p>
      <p className="text-[11px] font-medium text-white/85">
        {isFoldWin ? "Win by fold" : "Showdown"}
      </p>
      {!isFoldWin && winningHand ? (
        <p className="mt-1 text-xs font-medium leading-snug text-casino-goldLight sm:text-sm">
          {winningHand}
        </p>
      ) : null}
      {isFoldWin ? (
        <p className="mt-0.5 text-[10px] text-white/45">
          No hand ranking — opponent folded.
        </p>
      ) : null}
      {pot != null ? (
        <p className="mt-1.5 text-xs font-semibold text-casino-goldLight">
          Pot won: {pot.toLocaleString()} chips
        </p>
      ) : null}
    </div>
  );
}

function SeatHoleCards({
  seat,
  cardSize,
}: {
  seat: TableSeat;
  cardSize: CardSize;
}) {
  const dimmed = seat.status === "folded" || seat.status === "idle";

  if (seat.revealCards && seat.holeCards.length > 0) {
    return (
      <>
        {seat.holeCards.map((card, i) => (
          <PlayingCard
            key={`${seat.id}-${card.rank}-${card.suit}-${i}`}
            rank={card.rank}
            suit={card.suit}
            size={cardSize}
            animate
            dimmed={seat.status === "folded"}
            className="relative z-[25] shrink-0"
          />
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: 2 }).map((_, i) => (
        <PlayingCard
          key={`${seat.id}-hidden-${i}`}
          faceDown
          size={cardSize}
          animate={false}
          dimmed={dimmed}
          className="relative z-[25] shrink-0"
        />
      ))}
    </>
  );
}

function RoomHeadsUpTableLayout({
  pot,
  communityCards,
  seats,
  winnerName,
  winningHand,
  resultType,
  stepDemoMode,
  boardCardSize,
  layoutMode,
}: {
  pot: number | null;
  communityCards: Card[];
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
  stepDemoMode: boolean;
  boardCardSize: CardSize;
  layoutMode: SeatLayoutMode;
}) {
  const topSeat = seats.find((s) => s.position === "top");
  const bottomSeat = seats.find((s) => s.position === "bottom");
  const sideSeats = seats.filter(
    (s) => s.position === "left" || s.position === "right",
  );

  return (
    <>
      <div className="absolute inset-[5%] z-10 flex flex-col items-stretch overflow-hidden">
        {/* Top seat zone — PokerMaster avatar + hole cards */}
        <div className="flex h-[18%] max-h-[6.5rem] shrink-0 items-end justify-center pb-0.5">
          {topSeat ? (
            <TableSeatCluster
              seat={topSeat}
              layoutMode={layoutMode}
              inZone
            />
          ) : null}
        </div>

        {/* Board zone — pot + community cards */}
        <div className="flex h-[28%] max-h-[10.5rem] shrink-0 flex-col items-center justify-center gap-0.5">
          <ChipStack
            amount={pot ?? "\u2014"}
            size="md"
            label="Pot"
            className="mb-1 justify-center"
          />
          {stepDemoMode ? (
            <StepDemoCommunityBoard
              communityCards={communityCards}
              cardSize={boardCardSize}
              roomLayout
            />
          ) : (
            <CommunityBoard flopCards={communityCards} cardSize={boardCardSize} />
          )}
        </div>

        {/* Result banner zone — reserved height, no layout shift */}
        <div className="flex h-[10%] max-h-[4.25rem] shrink-0 items-center justify-center px-2">
          {winnerName ? (
            <WinnerBanner
              winnerName={winnerName}
              resultType={resultType}
              winningHand={winningHand}
              pot={pot}
              ultraCompact
            />
          ) : (
            <div className="h-px w-full max-w-[8rem] opacity-0" aria-hidden />
          )}
        </div>

        {/* Human hole cards zone */}
        <div className="flex h-[13%] max-h-[5rem] shrink-0 items-end justify-center">
          {bottomSeat ? (
            <TableSeatCluster
              seat={bottomSeat}
              layoutMode={layoutMode}
              part="cards"
            />
          ) : null}
        </div>

        {/* Human avatar zone */}
        <div className="flex min-h-[3.5rem] flex-1 items-start justify-center pt-0.5">
          {bottomSeat ? (
            <TableSeatCluster
              seat={bottomSeat}
              layoutMode={layoutMode}
              part="avatar"
            />
          ) : null}
        </div>
      </div>

      {sideSeats.map((seat) => (
        <TableSeatCluster key={seat.id} seat={seat} layoutMode={layoutMode} />
      ))}
    </>
  );
}

function TableSeatCluster({
  seat,
  layoutMode,
  part = "full",
  inZone = false,
}: {
  seat: TableSeat;
  layoutMode: SeatLayoutMode;
  part?: "full" | "cards" | "avatar";
  inZone?: boolean;
}) {
  const cardSize = holeCardSize(seat, layoutMode);
  const isFolded = seat.status === "folded";
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  const cards = (
    <div
      className={cn(
        "flex shrink-0 gap-0.5",
        layoutMode === "roomHeadsUp" && seat.position === "top" && "scale-[0.92] origin-top",
      )}
    >
      <SeatHoleCards seat={seat} cardSize={cardSize} />
    </div>
  );

  const avatar = (
    <AgentAvatar
      name={seat.name}
      avatar={seat.avatar}
      strategy={seat.strategy}
      stack={seat.stack}
      status={seat.status}
      compact={
        layoutMode !== "default" ||
        seat.position === "left" ||
        seat.position === "right"
      }
      className={cn(isSpectator && "scale-90 opacity-70")}
    />
  );

  const positionClass = seatPositionClasses[seat.position][layoutMode];
  const topRoomGap = layoutMode === "roomHeadsUp" && seat.position === "top";
  const roomSplit = layoutMode === "roomHeadsUp" && part !== "full";

  if (inZone && layoutMode === "roomHeadsUp" && seat.position === "top") {
    return (
      <div
        className={cn(
          "flex flex-col items-center",
          topRoomGap ? "gap-0.5" : "gap-1",
          isFolded && "opacity-80",
          isSpectator && "scale-[0.88] opacity-70",
        )}
      >
        {avatar}
        {cards}
      </div>
    );
  }

  if (roomSplit) {
    return (
      <div
        className={cn(
          "flex items-center justify-center",
          isFolded && "opacity-80",
          isSpectator && "scale-[0.88] opacity-70",
        )}
      >
        {part === "cards" ? cards : avatar}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute z-20",
        positionClass,
        isFolded && "z-[18]",
        isSpectator && "z-[16] scale-[0.88]",
      )}
    >
      {seat.position === "bottom" ? (
        <div
          className={cn(
            "flex flex-col items-center",
            layoutMode === "roomHeadsUp" ? "gap-1" : "gap-1.5",
          )}
        >
          {cards}
          {avatar}
        </div>
      ) : null}

      {seat.position === "top" ? (
        <div
          className={cn(
            "flex flex-col items-center",
            topRoomGap ? "gap-0.5" : "gap-1.5",
          )}
        >
          {avatar}
          {cards}
        </div>
      ) : null}

      {seat.position === "left" ? (
        <div className="flex flex-row items-center gap-1.5">
          {avatar}
          {cards}
        </div>
      ) : null}

      {seat.position === "right" ? (
        <div className="flex flex-row items-center gap-1.5">
          {cards}
          {avatar}
        </div>
      ) : null}
    </div>
  );
}

export function PokerTable({
  pot,
  communityCards,
  seats,
  winnerName,
  winningHand,
  resultType = "showdown",
  locked = false,
  fourPlayerLayout = false,
  spectatorMode = false,
  stepDemoMode = false,
  roomLayout = false,
  onPayEntryFee,
  payingEntryFee = false,
  paymentError,
  className,
}: PokerTableProps) {
  const layoutMode = resolveSeatLayoutMode(fourPlayerLayout, roomLayout);
  const boardCardSize = resolveBoardCardSize(layoutMode);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-casino-gold/25 bg-[#050508] shadow-[0_32px_80px_rgba(0,0,0,0.8)]",
        roomLayout ? "h-full min-h-0 p-2 sm:p-3" : "p-4",
        className,
      )}
    >
      {stepDemoMode ? (
        <Badge
          variant="secondary"
          className="absolute left-5 top-5 z-[35] max-w-[220px] border-emerald-400/40 bg-emerald-950/80 text-center text-[9px] font-medium leading-snug text-emerald-100"
        >
          Step Demo Mode — simplified Human vs AI
        </Badge>
      ) : null}

      {spectatorMode ? (
        <Badge
          variant="secondary"
          className="absolute right-5 top-5 z-[35] max-w-[220px] border-violet-400/40 bg-violet-950/80 text-center text-[9px] font-medium leading-snug text-violet-100"
        >
          Spectator Mode — all agent cards visible
        </Badge>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_60%)]" />

      <div
        className={cn(
          "relative mx-auto h-full w-full max-w-4xl",
          !roomLayout &&
            (fourPlayerLayout
              ? "aspect-[16/10] min-h-[320px]"
              : "aspect-[16/11] min-h-[340px]"),
        )}
      >
        <div className="absolute inset-0">
        {/* Outer rail */}
        <div className="absolute inset-[2%] rounded-[50%] border-4 border-[#3d2817] bg-gradient-to-b from-[#5c3d1e] to-[#2a1a0e] shadow-inner" />

        {/* Felt */}
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

        {layoutMode === "roomHeadsUp" ? (
          <RoomHeadsUpTableLayout
            pot={pot}
            communityCards={communityCards}
            seats={seats}
            winnerName={winnerName}
            winningHand={winningHand}
            resultType={resultType}
            stepDemoMode={stepDemoMode}
            boardCardSize={boardCardSize}
            layoutMode={layoutMode}
          />
        ) : (
          <>
        {/* Stable board zone — fixed vertical position */}
        <div
          className={cn(
            "absolute left-1/2 z-[15] flex w-[min(92%,20rem)] -translate-x-1/2 flex-col items-center",
            fourPlayerLayout ? "top-[28%]" : "top-[30%]",
          )}
        >
          <div className="flex w-full flex-col items-center">
            <ChipStack
              amount={pot ?? "\u2014"}
              size={layoutMode === "default" ? "lg" : "md"}
              label="Pot"
              className="mb-2 justify-center"
            />

            {stepDemoMode ? (
              <StepDemoCommunityBoard
                communityCards={communityCards}
                cardSize={boardCardSize}
              />
            ) : (
              <CommunityBoard flopCards={communityCards} cardSize={boardCardSize} />
            )}
          </div>
        </div>

        {/* Result banner — overlay between board and bottom seat, no layout shift */}
        {winnerName ? (
          <div
            className={cn(
              "absolute left-1/2 z-[22] w-[min(92%,18rem)] -translate-x-1/2",
              "top-[58%]",
            )}
          >
            <WinnerBanner
              winnerName={winnerName}
              resultType={resultType}
              winningHand={winningHand}
              pot={pot}
            />
          </div>
        ) : null}

        {/* Seats */}
        {seats.map((seat) => (
          <TableSeatCluster key={seat.id} seat={seat} layoutMode={layoutMode} />
        ))}
          </>
        )}
        </div>
      </div>

      {locked ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center rounded-[2rem] bg-black/60 backdrop-blur-[3px]">
          <div className="mx-4 max-w-sm rounded-2xl border border-casino-gold/40 bg-black/75 px-6 py-5 text-center backdrop-blur-md">
            <p className="text-sm font-semibold text-casino-goldLight">Arena Locked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pay the mock entry fee to start the demo session.
            </p>
            {onPayEntryFee ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  className="mt-4 w-full shadow-glow"
                  disabled={payingEntryFee}
                  onClick={onPayEntryFee}
                >
                  {payingEntryFee ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Mock Pay Entry Fee"
                  )}
                </Button>
                <p className="mt-3 text-[10px] leading-relaxed text-amber-200/80">
                  Demo payment only — no real funds moved.
                </p>
                {paymentError ? (
                  <p className="mt-2 text-[10px] text-red-400">{paymentError}</p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Use the sidebar to unlock the arena.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
