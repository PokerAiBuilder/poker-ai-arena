import { PlayingCard } from "@/components/arena/PlayingCard";
import { AgentAvatar, type AgentStatus } from "@/components/arena/AgentAvatar";
import { HumanTurnTimerRing } from "@/components/arena/HumanTurnTimerRing";
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
  /** Agent Battle replay — highlight acting bot */
  activeHighlight?: "thinking" | "acting";
  /** Agent Battle personality badge on seat hover */
  personalityBadge?: string;
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
  /** Agent Battle spectator table — 5-slot board + labels */
  agentBattleMode?: boolean;
  /** Human vs AI guided table layout (5-slot board, fixed heads-up zones) */
  headsUpGuidedMode?: boolean;
  /** Show in-table badge while a guided hand is in progress */
  showHumanVsAiBadge?: boolean;
  /** Bumps keyed subtrees on hand reset so card visuals remount cleanly */
  headsUpLayoutKey?: string;
  /** Fill parent height for poker-room viewport layout */
  roomLayout?: boolean;
  /** Human vs AI — countdown seconds during player turn */
  humanTurnSecondsLeft?: number | null;
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
  if (layoutMode === "compact") return "sm";
  if (layoutMode === "roomHeadsUp") return "md";
  return "md";
}

function holeCardSize(
  seat: TableSeat,
  layoutMode: SeatLayoutMode,
  topSideByAvatar = false,
): CardSize {
  if (layoutMode === "compact") return "sm";
  if (layoutMode === "roomHeadsUp") {
    if (seat.position === "bottom") return "md";
    if (seat.position === "top") return topSideByAvatar ? "sm" : "sm";
    return "sm";
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
    </div>
  );
}

function SpectatorCommunityBoard({
  communityCards,
  cardSize,
}: {
  communityCards: Card[];
  cardSize: CardSize;
  winByFold?: boolean;
}) {
  const isFullBoard = communityCards.length >= 5;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {isFullBoard ? (
          communityCards.slice(0, 5).map((card, i) => (
            <PlayingCard
              key={`spectator-board-${card.rank}-${card.suit}-${i}`}
              rank={card.rank}
              suit={card.suit}
              size={cardSize}
              animate
              className="relative z-[2]"
            />
          ))
        ) : communityCards.length > 0 ? (
          communityCards.map((card, i) => (
            <PlayingCard
              key={`spectator-partial-${card.rank}-${card.suit}-${i}`}
              rank={card.rank}
              suit={card.suit}
              size={cardSize}
              animate
              className="relative z-[2]"
            />
          ))
        ) : null}
      </div>
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
          faceDown
          size={cardSize}
          animate={false}
          className={cn(
            "relative z-[2] border-sky-800/50 shadow-md",
            "from-sky-950 via-indigo-950 to-blue-950",
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
  spectator = false,
}: {
  winnerName: string;
  resultType: HandResultDisplayType;
  winningHand?: string;
  pot: number | null;
  compact?: boolean;
  ultraCompact?: boolean;
  spectator?: boolean;
}) {
  const isFoldWin = resultType === "fold";

  if (ultraCompact) {
    return (
      <div
        className={cn(
          "relative z-[30] w-full max-w-[min(100%,14rem)] rounded-md border",
          "border-[var(--arena-cyan)]/55 bg-[var(--arena-surface)]/95",
          "shadow-[0_0_20px_rgba(34,211,238,0.15)] px-2 py-1 text-center backdrop-blur-md animate-fade-in",
        )}
      >
        <p
          className={cn(
            "text-[7px] font-semibold uppercase leading-none tracking-[0.14em]",
            spectator ? "text-[var(--arena-cyan)]" : "text-[var(--arena-muted)]",
          )}
        >
          {spectator ? "Agent Battle" : "Result"}
        </p>
        <p className="mt-0.5 text-[11px] font-bold leading-tight text-[var(--arena-gold-accent)]">
          {winnerName}
        </p>
        <p className="text-[8px] leading-tight text-white/75">
          {isFoldWin ? "Win by fold" : "Showdown"}
          {!isFoldWin && winningHand ? ` · ${winningHand}` : ""}
        </p>
        {pot != null ? (
          <p className="text-[8px] font-semibold leading-tight text-[var(--arena-cyan)]">
            Pot {pot.toLocaleString()}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative z-[30] w-full max-w-[min(100%,18rem)] rounded-xl border-2 border-[var(--arena-cyan)]/50",
        "bg-gradient-to-b from-[var(--arena-surface)]/95 to-black/80 text-center shadow-[0_0_24px_rgba(34,211,238,0.12)] backdrop-blur-md animate-fade-in",
        compact ? "px-2.5 py-2" : "mt-2 px-3 py-3 sm:px-4",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--arena-muted)]">
        Hand result
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/60">Winner</p>
      <p className="text-base font-bold leading-tight text-[var(--arena-gold-accent)] sm:text-lg">
        {winnerName}
      </p>
      <p className="mt-1.5 text-[10px] uppercase tracking-wider text-white/50">
        Result type
      </p>
      <p className="text-[11px] font-medium text-white/85">
        {isFoldWin ? "Win by fold" : "Showdown"}
      </p>
      {!isFoldWin && winningHand ? (
        <p className="mt-1 text-xs font-medium leading-snug text-[var(--arena-text)] sm:text-sm">
          {winningHand}
        </p>
      ) : null}
      {isFoldWin ? (
        <p className="mt-0.5 text-[10px] text-white/45">
          No hand ranking — opponent folded.
        </p>
      ) : null}
      {pot != null ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--arena-cyan)]">
          Pot won: {pot.toLocaleString()} chips
        </p>
      ) : null}
    </div>
  );
}

function SeatHoleCards({
  seat,
  cardSize,
  softFold = false,
}: {
  seat: TableSeat;
  cardSize: CardSize;
  softFold?: boolean;
}) {
  const dimmed =
    (seat.status === "folded" && !softFold) || seat.status === "idle";

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
            dimmed={seat.status === "folded" && !softFold}
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

function HeadsUpOpponentSeat({ seat }: { seat: TableSeat }) {
  const cardSize: CardSize = "sm";
  const isFolded = seat.status === "folded";
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  return (
    <div
      className={cn(
        "arena-seat-row",
        isFolded && "opacity-80",
        isSpectator && "opacity-90",
      )}
    >
      <div className="arena-seat-panel-slot">
        <AgentAvatar
          name={seat.name}
          avatar={seat.avatar}
          strategy={seat.strategy}
          stack={seat.stack}
          status={seat.status}
          compact
          stackTextOnly
        />
      </div>
      <div
        className="flex h-[3.25rem] w-[4.35rem] shrink-0 items-center justify-center"
        aria-label="Opponent hole cards"
      >
        <div className="flex gap-0.5">
          <SeatHoleCards seat={seat} cardSize={cardSize} />
        </div>
      </div>
    </div>
  );
}

function HeadsUpHumanCards({ seat }: { seat: TableSeat }) {
  const cardSize: CardSize = "sm";
  const isFolded = seat.status === "folded";

  return (
    <div
      className={cn(
        "flex w-[6.5rem] shrink-0 items-end justify-center",
        isFolded && "opacity-80",
      )}
      aria-label="Your hole cards"
    >
      <div className="flex gap-0.5">
        <SeatHoleCards seat={seat} cardSize={cardSize} />
      </div>
    </div>
  );
}

function AgentBattleActiveHighlight({
  seat,
  children,
}: {
  seat: TableSeat;
  children: React.ReactNode;
}) {
  if (!seat.activeHighlight) return <>{children}</>;

  const label = seat.activeHighlight === "thinking" ? "Thinking" : "Acting";

  return (
    <div className="relative">
      <div
        className={cn(
          "pointer-events-none absolute -inset-1.5 rounded-2xl border-2",
          seat.activeHighlight === "thinking" &&
            "animate-pulse border-cyan-400/90 shadow-[0_0_22px_rgba(34,211,238,0.45)]",
          seat.activeHighlight === "acting" &&
            "border-[var(--arena-blue-bright)]/90 shadow-[0_0_20px_rgba(0,82,255,0.4)]",
        )}
        aria-hidden
      />
      <span
        className={cn(
          "absolute -top-2.5 left-1/2 z-[4] -translate-x-1/2 whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.14em]",
          seat.activeHighlight === "thinking"
            ? "border-cyan-400/50 bg-cyan-950/95 text-cyan-200"
            : "border-[var(--arena-blue-bright)]/50 bg-[var(--arena-blue)]/25 text-[var(--arena-cyan)]",
        )}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function AgentBattleSeatRow({
  seat,
  edgeInset = false,
}: {
  seat: TableSeat;
  edgeInset?: boolean;
}) {
  const cardSize: CardSize = "sm";
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  return (
    <div
      className={cn(
        "arena-seat-row",
        isSpectator && "opacity-90",
      )}
    >
      <div className="flex w-[3.25rem] shrink-0 items-center justify-center">
        <AgentBattleActiveHighlight seat={seat}>
          <AgentAvatar
            name={seat.name}
            avatar={seat.avatar}
            strategy={seat.strategy}
            styleBadge={seat.personalityBadge}
            stack={seat.stack}
            status={seat.status}
            compact
            stackTextOnly
            readableFold
            className={cn(
              isSpectator && "opacity-90",
              seat.activeHighlight === "thinking" &&
                "border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]",
              seat.activeHighlight === "acting" &&
                "border-[var(--arena-blue-bright)]/70 shadow-[0_0_16px_rgba(0,82,255,0.35)]",
            )}
          />
        </AgentBattleActiveHighlight>
      </div>
      <div
        className={cn(
          "flex h-[3rem] w-[4.25rem] shrink-0 items-center justify-center overflow-visible",
          edgeInset && "translate-x-1.5 sm:translate-x-2",
        )}
        aria-label={`${seat.name} hole cards`}
      >
        <div className="flex scale-90 gap-0.5 overflow-visible">
          <SeatHoleCards seat={seat} cardSize={cardSize} softFold />
        </div>
      </div>
    </div>
  );
}

function AgentBattleSideSeat({
  seat,
  side,
}: {
  seat: TableSeat;
  side?: "left" | "right";
}) {
  const cardSize: CardSize = "sm";

  return (
    <div className="flex flex-col items-center gap-1">
      <AgentBattleActiveHighlight seat={seat}>
        <AgentAvatar
          name={seat.name}
          avatar={seat.avatar}
          strategy={seat.strategy}
          styleBadge={seat.personalityBadge}
          stack={seat.stack}
          status={seat.status}
          compact
          stackTextOnly
          readableFold
          className={cn(
            "scale-[0.88]",
            seat.activeHighlight === "thinking" &&
              "border-cyan-400/70 shadow-[0_0_18px_rgba(34,211,238,0.35)]",
            seat.activeHighlight === "acting" &&
              "border-[var(--arena-blue-bright)]/70 shadow-[0_0_16px_rgba(0,82,255,0.35)]",
          )}
        />
      </AgentBattleActiveHighlight>
      <div
        className={cn(
          "flex scale-90 gap-0.5",
          side === "left" && "-translate-x-0.5",
          side === "right" && "translate-x-0.5",
        )}
      >
        <SeatHoleCards seat={seat} cardSize={cardSize} softFold />
      </div>
    </div>
  );
}

function RoomAgentBattleTableLayout({
  pot,
  communityCards,
  seats,
  winnerName,
  winningHand,
  resultType,
}: {
  pot: number | null;
  communityCards: Card[];
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
}) {
  const agentBattleBoardCardSize: CardSize = "sm";
  const topSeat = seats.find((s) => s.position === "top");
  const bottomSeat = seats.find((s) => s.position === "bottom");
  const leftSeat = seats.find((s) => s.position === "left");
  const rightSeat = seats.find((s) => s.position === "right");

  return (
    <div className="arena-room-felt-zones arena-room-agent-battle-zones">
      <div className="relative min-h-0 flex-1">
        <div className="absolute left-1/2 top-[3%] z-10 flex -translate-x-[calc(50%-0.5rem)] items-start justify-center overflow-visible px-2 pt-0.5">
          {topSeat ? <AgentBattleSeatRow seat={topSeat} edgeInset /> : null}
        </div>

        <div className="absolute left-1/2 top-[43%] z-[12] flex w-[min(96%,22rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
          <div className="flex min-h-[1.125rem] shrink-0 items-center justify-center rounded-full border border-[var(--arena-border)] bg-[var(--arena-surface)]/85 px-3 py-0.5 shadow-sm">
            <ChipStack
              amount={pot ?? "\u2014"}
              size="sm"
              label="Pot"
              showIcons={false}
              className="justify-center"
            />
          </div>
          <SpectatorCommunityBoard
            communityCards={communityCards}
            cardSize={agentBattleBoardCardSize}
          />
        </div>

        {winnerName ? (
          <div className="absolute left-1/2 top-[59%] z-[15] w-[min(92%,15rem)] -translate-x-1/2 px-2">
            <WinnerBanner
              winnerName={winnerName}
              resultType={resultType}
              winningHand={winningHand}
              pot={pot}
              ultraCompact
              spectator
            />
          </div>
        ) : null}

        {bottomSeat ? (
          <div className="absolute bottom-[2.5%] left-1/2 z-[9] -translate-x-[calc(50%-0.5rem)] overflow-visible px-2">
            <AgentBattleSeatRow seat={bottomSeat} edgeInset />
          </div>
        ) : null}

        {leftSeat ? (
          <div className="absolute left-[2%] top-[36%] z-[8] -translate-y-1/2">
            <AgentBattleSideSeat seat={leftSeat} side="left" />
          </div>
        ) : null}
        {rightSeat ? (
          <div className="absolute right-[2%] top-[36%] z-[8] -translate-y-1/2">
            <AgentBattleSideSeat seat={rightSeat} side="right" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoomHeadsUpTableLayout({
  pot,
  communityCards,
  seats,
  winnerName,
  winningHand,
  resultType,
  boardCardSize,
  headsUpLayoutKey,
  humanTurnSecondsLeft,
}: {
  pot: number | null;
  communityCards: Card[];
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
  boardCardSize: CardSize;
  headsUpLayoutKey?: string;
  humanTurnSecondsLeft?: number | null;
}) {
  const topSeat = seats.find((s) => s.position === "top");
  const bottomSeat = seats.find((s) => s.position === "bottom");
  const sideSeats = seats.filter(
    (s) => s.position === "left" || s.position === "right",
  );

  return (
    <>
      <div className="arena-room-felt-zones arena-room-hvai-zones">
        <div className="arena-zone-top flex h-[16%] min-h-[4.25rem] max-h-[6rem] shrink-0 items-end justify-center px-1 pb-0.5 pt-0.5">
          {topSeat ? (
            <div key={headsUpLayoutKey ?? topSeat.id}>
              <HeadsUpOpponentSeat seat={topSeat} />
            </div>
          ) : (
            <div className="h-[3.5rem] w-[11.75rem] shrink-0" aria-hidden />
          )}
        </div>

        <div className="arena-zone-board flex h-[28%] max-h-[10.5rem] shrink-0 flex-col items-center justify-center gap-1 pt-1">
          <div className="flex min-h-[1.125rem] shrink-0 items-center justify-center rounded-full border border-[var(--arena-border)] bg-[var(--arena-surface)]/80 px-3 py-0.5 shadow-sm">
            <ChipStack
              amount={pot ?? "\u2014"}
              size="sm"
              label="Pot"
              showIcons={false}
              className="justify-center"
            />
          </div>
          <StepDemoCommunityBoard
            communityCards={communityCards}
            cardSize={boardCardSize}
            roomLayout
          />
        </div>

        <div className="arena-zone-result flex h-[10%] max-h-[4.25rem] shrink-0 items-center justify-center px-2">
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

        <div className="arena-zone-human-cards flex h-[13%] max-h-[5rem] shrink-0 items-end justify-center">
          {bottomSeat ? (
            <div key={`${headsUpLayoutKey ?? bottomSeat.id}-cards`}>
              <HeadsUpHumanCards seat={bottomSeat} />
            </div>
          ) : (
            <div className="h-[4.25rem] w-[5.75rem] shrink-0" aria-hidden />
          )}
        </div>

        <div className="arena-zone-avatar flex min-h-[3.75rem] flex-1 items-start justify-center pb-0.5 pt-0.5">
          {bottomSeat ? (
            <TableSeatCluster
              seat={bottomSeat}
              layoutMode="roomHeadsUp"
              part="avatar"
              humanTurnSecondsLeft={
                bottomSeat.id === "human" ? humanTurnSecondsLeft : null
              }
            />
          ) : null}
        </div>
      </div>

      {sideSeats.map((seat) => (
        <TableSeatCluster key={seat.id} seat={seat} layoutMode="roomHeadsUp" />
      ))}
    </>
  );
}

function TableSeatCluster({
  seat,
  layoutMode,
  part = "full",
  inZone = false,
  topSideByAvatar = false,
  humanTurnSecondsLeft = null,
}: {
  seat: TableSeat;
  layoutMode: SeatLayoutMode;
  part?: "full" | "cards" | "avatar";
  inZone?: boolean;
  topSideByAvatar?: boolean;
  humanTurnSecondsLeft?: number | null;
}) {
  const cardSize = holeCardSize(seat, layoutMode, topSideByAvatar);
  const isFolded = seat.status === "folded";
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  const cards = (
    <div
      className={cn(
        "flex shrink-0 gap-0.5",
        layoutMode === "roomHeadsUp" &&
          seat.position === "top" &&
          !topSideByAvatar &&
          "scale-[0.92] origin-top",
        layoutMode === "roomHeadsUp" &&
          seat.position === "top" &&
          topSideByAvatar &&
          "scale-[0.9]",
      )}
    >
      <SeatHoleCards seat={seat} cardSize={cardSize} />
    </div>
  );

  const avatarNode = (
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
      stackTextOnly={layoutMode === "roomHeadsUp"}
      className={cn(isSpectator && "opacity-70")}
    />
  );

  const avatar =
    humanTurnSecondsLeft != null && seat.id === "human" ? (
      <HumanTurnTimerRing secondsLeft={humanTurnSecondsLeft}>
        {avatarNode}
      </HumanTurnTimerRing>
    ) : (
      avatarNode
    );

  const positionClass = seatPositionClasses[seat.position][layoutMode];
  const topRoomGap = layoutMode === "roomHeadsUp" && seat.position === "top";
  const roomSplit = layoutMode === "roomHeadsUp" && part !== "full";

  if (inZone && layoutMode === "roomHeadsUp" && seat.position === "top") {
    if (topSideByAvatar) {
      return (
        <div
          className={cn(
            "flex max-w-full flex-row items-center justify-center gap-1 sm:gap-1.5",
            isFolded && "opacity-80",
            isSpectator && "opacity-70",
          )}
        >
          {avatar}
          {cards}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col items-center",
          topRoomGap ? "gap-0.5" : "gap-1",
          isFolded && "opacity-80",
          isSpectator && "opacity-70",
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
          isSpectator && "opacity-70",
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
        isSpectator && "z-[16] opacity-70",
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
  agentBattleMode = false,
  headsUpGuidedMode = false,
  showHumanVsAiBadge = false,
  roomLayout = false,
  headsUpLayoutKey,
  humanTurnSecondsLeft = null,
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
        "relative overflow-hidden rounded-[2rem] border border-[var(--arena-border)] bg-[var(--arena-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
        roomLayout ? "arena-table-room" : "p-4",
        className,
      )}
    >
      {showHumanVsAiBadge ? (
        <Badge
          variant="secondary"
          className="absolute left-5 top-5 z-[35] max-w-[220px] border-[var(--arena-cyan)]/40 bg-[var(--arena-surface-2)]/95 text-center text-[9px] font-medium leading-snug text-[var(--arena-cyan)]"
        >
          Human vs AI — current hand
        </Badge>
      ) : null}

      {spectatorMode ? (
        <Badge
          variant="secondary"
          className="absolute right-3 top-3 z-[35] max-w-[11.5rem] border-[var(--arena-blue-bright)]/40 bg-[var(--arena-surface-2)]/95 text-center text-[8px] font-medium leading-snug text-[var(--arena-text)] sm:right-5 sm:top-5 sm:max-w-[13rem] sm:text-[9px]"
        >
          Spectator Mode — all agent cards visible
        </Badge>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,82,255,0.08),transparent_60%)]" />

      <div
        className={cn(
          "arena-table-inner relative mx-auto h-full w-full",
          !roomLayout &&
            (fourPlayerLayout
              ? "aspect-[16/10] min-h-[320px]"
              : "aspect-[16/11] min-h-[340px]"),
        )}
      >
        <div className="absolute inset-0">
        {/* Outer rail */}
        <div className="absolute inset-[2%] rounded-[50%] border-4 border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-950 shadow-inner" />

        {/* Felt — premium AI arena (navy / electric blue) */}
        <div
          className="absolute inset-[5%] overflow-hidden rounded-[50%] border-2 border-[var(--arena-cyan)]/35 arena-table-glow-blue"
          style={{
            background:
              "radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0, 82, 255, 0.48) 0%, #0c1a30 42%, #050a12 100%)",
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
            boardCardSize={boardCardSize}
            headsUpLayoutKey={headsUpLayoutKey}
            humanTurnSecondsLeft={humanTurnSecondsLeft}
          />
        ) : agentBattleMode && roomLayout ? (
          <RoomAgentBattleTableLayout
            pot={pot}
            communityCards={communityCards}
            seats={seats}
            winnerName={winnerName}
            winningHand={winningHand}
            resultType={resultType}
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

            {headsUpGuidedMode ? (
              <StepDemoCommunityBoard
                communityCards={communityCards}
                cardSize={boardCardSize}
              />
            ) : agentBattleMode ? (
              <SpectatorCommunityBoard
                communityCards={communityCards}
                cardSize={boardCardSize}
                winByFold={resultType === "fold"}
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
              fourPlayerLayout ? "top-[50%]" : "top-[58%]",
            )}
          >
            <WinnerBanner
              winnerName={winnerName}
              resultType={resultType}
              winningHand={winningHand}
              pot={pot}
              ultraCompact={fourPlayerLayout}
              compact={fourPlayerLayout}
              spectator={agentBattleMode}
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
          <div className="mx-4 max-w-sm rounded-2xl v1-panel v1-glow-border px-6 py-5 text-center backdrop-blur-md">
            <p className="text-sm font-semibold text-[var(--arena-cyan)]">Arena Locked</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start demo session to play Human vs AI or watch AI Agent Battle.
            </p>
            {onPayEntryFee ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  className="v1-button-primary mt-4 w-full"
                  disabled={payingEntryFee}
                  onClick={onPayEntryFee}
                >
                  {payingEntryFee ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    "Start Demo Session"
                  )}
                </Button>
                <p className="mt-3 text-[10px] leading-relaxed text-[var(--arena-muted)]">
                  Mock x402-style unlock · Demo chips only · No real funds
                  moved · Connect Wallet optional
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
