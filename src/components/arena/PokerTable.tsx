import { AgentBattleResponsiveShell } from "@/components/arena/AgentBattleResponsiveShell";
import { PlayingCard } from "@/components/arena/PlayingCard";
import { AgentAvatar, type AgentStatus } from "@/components/arena/AgentAvatar";
import { HumanTurnTimerRing } from "@/components/arena/HumanTurnTimerRing";
import { ChipStack } from "@/components/arena/ChipStack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { TestStakePicker } from "@/components/arena/TestStakePicker";
import { useTestnetStakeNetwork } from "@/hooks/useTestnetStakeNetwork";
import type { HandResultDisplayType } from "@/lib/arena/simulationDisplay";
import { getVisibleBoardCount } from "@/lib/arena/simulationDisplay";
import type { Card } from "@/lib/poker/types";
import type { StakeCashOutRecord } from "@/lib/stake/stakeSessionStorage";
import {
  formatStakeToChipsLine,
  formatTestBalanceAmount,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import {
  getLockStakePhaseLabel,
  type LockStakePhase,
} from "@/lib/stake/lockStakeFlow";
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
  /** Agent Battle — count of face-up community cards (0–5). */
  agentBattleVisibleBoardCount?: number;
  /** Human vs AI guided table layout (5-slot board, fixed heads-up zones) */
  headsUpGuidedMode?: boolean;
  /** Show in-table badge while a guided hand is in progress */
  showHumanVsAiBadge?: boolean;
  /** Fill parent height for poker-room viewport layout */
  roomLayout?: boolean;
  /** Human vs AI — countdown seconds during player turn */
  humanTurnSecondsLeft?: number | null;
  onLockStake?: () => void;
  onPayMock?: () => void;
  onBeginNewStakeSession?: () => void;
  payingLockStake?: boolean;
  payingMockStake?: boolean;
  lockStakePhase?: LockStakePhase;
  paymentError?: string | null;
  selectedTestStake?: TestStakeAmount;
  onTestStakeChange?: (stake: TestStakeAmount) => void;
  stakeCashedOut?: boolean;
  cashOutRecord?: StakeCashOutRecord | null;
  className?: string;
};

type CardSize = "xs" | "sm" | "md" | "lg";

/** Agent Battle spectator cards — match Human vs AI board size (`md` + CSS scale). */
const AGENT_BATTLE_CARD_SIZE: CardSize = "md";

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
  _topSideByAvatar = false,
): CardSize {
  if (layoutMode === "compact") return "sm";
  if (layoutMode === "roomHeadsUp") {
    return "md";
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
  visibleBoardCount,
  cardSize,
  compactRow = false,
}: {
  communityCards: Card[];
  visibleBoardCount?: number;
  cardSize: CardSize;
  winByFold?: boolean;
  compactRow?: boolean;
}) {
  const fullBoard = communityCards.slice(0, 5);
  const visibleCount =
    visibleBoardCount != null
      ? getVisibleBoardCount({ visibleCount: visibleBoardCount })
      : getVisibleBoardCount({ status: "unknown" });

  return (
    <div className={cn("flex items-center justify-center", compactRow && "w-full")}>
      <div
        className={cn(
          "flex items-center justify-center",
          compactRow ? "flex-nowrap gap-0.5" : "gap-1.5 sm:gap-2",
        )}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const card = fullBoard[index];
          if (index < visibleCount && card) {
            return (
              <PlayingCard
                key={`spectator-board-${card.rank}-${card.suit}-${index}`}
                rank={card.rank}
                suit={card.suit}
                size={cardSize}
                animate
                className="relative z-[2]"
              />
            );
          }

          return (
            <PlayingCard
              key={`spectator-board-hidden-${index}`}
              faceDown
              size={cardSize}
              animate={false}
              className={cn(
                "relative z-[2] border-sky-800/50 shadow-md",
                "from-sky-950 via-indigo-950 to-blue-950",
              )}
            />
          );
        })}
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
          animate={!roomLayout}
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
          "arena-winner-banner arena-winner-banner--ab-compact",
          spectator && "pointer-events-none",
        )}
      >
        <p className="text-[6px] font-semibold uppercase leading-none tracking-[0.12em] text-[var(--arena-muted)]">
          {spectator ? "Result" : "Hand result"}
        </p>
        <p className="mt-0.5 text-[10px] font-bold leading-tight text-[var(--arena-gold-accent)]/85">
          {winnerName}
        </p>
        <p className="text-[7px] leading-tight text-white/65">
          {isFoldWin ? "Win by fold" : winningHand ?? "Showdown"}
          {pot != null ? ` · Pot ${pot.toLocaleString()}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "arena-winner-banner max-w-[min(100%,16rem)]",
        compact ? "px-2.5 py-2" : "mt-1 px-3 py-2.5 sm:px-4",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--arena-muted)]">
        Hand result
      </p>
      <p className="mt-1 text-sm font-bold leading-tight text-[var(--arena-gold-accent)]/90 sm:text-base">
        {winnerName}
      </p>
      <p className="mt-1 text-[10px] text-white/75">
        {isFoldWin ? "Win by fold" : winningHand ?? "Showdown"}
      </p>
      {pot != null ? (
        <p className="mt-1 text-[10px] font-semibold text-[var(--arena-cyan)]">
          Pot {pot.toLocaleString()}
        </p>
      ) : null}
    </div>
  );
}

function SeatHoleCards({
  seat,
  cardSize,
  softFold = false,
  animate = true,
}: {
  seat: TableSeat;
  cardSize: CardSize;
  softFold?: boolean;
  animate?: boolean;
}) {
  const dimmed =
    (seat.status === "folded" && !softFold) || seat.status === "idle";

  const holeCards = seat.holeCards.slice(0, 2);

  if (seat.revealCards && holeCards.length > 0) {
    return (
      <>
        {holeCards.map((card, i) => (
          <PlayingCard
            key={`${seat.id}-${card.rank}-${card.suit}-${i}`}
            rank={card.rank}
            suit={card.suit}
            size={cardSize}
            animate={animate}
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

/** Human vs AI seat — hole cards between banner and table center. */
function HeadsUpPlayerCluster({
  seat,
  cardSize,
  humanTurnSecondsLeft = null,
  cardsLabel,
  orientation = "bottom",
}: {
  seat: TableSeat;
  cardSize: CardSize;
  humanTurnSecondsLeft?: number | null;
  cardsLabel: string;
  orientation?: "top" | "bottom";
}) {
  const isFolded = seat.status === "folded";
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  const banner = (
    <AgentAvatar
      name={seat.name}
      avatar={seat.avatar}
      strategy={seat.strategy}
      stack={seat.stack}
      status={seat.status}
      compact
      stackTextOnly
      className={cn(isSpectator && "opacity-90")}
    />
  );

  const cards = (
    <div className="arena-hvai-player-cards" aria-label={cardsLabel}>
      <SeatHoleCards seat={seat} cardSize={cardSize} animate={false} />
    </div>
  );

  const bannerNode =
    humanTurnSecondsLeft != null && seat.id === "human" ? (
      <HumanTurnTimerRing secondsLeft={humanTurnSecondsLeft}>
        {banner}
      </HumanTurnTimerRing>
    ) : (
      banner
    );

  return (
    <div
      className={cn(
        "arena-hvai-player",
        orientation === "top" && "arena-hvai-player--top",
        orientation === "bottom" && "arena-hvai-player--bottom",
        isFolded && "opacity-85",
        isSpectator && "opacity-90",
      )}
    >
      {orientation === "top" ? (
        <>
          <div className="arena-hvai-player-banner">{bannerNode}</div>
          {cards}
        </>
      ) : (
        <>
          {cards}
          <div className="arena-hvai-player-banner">{bannerNode}</div>
        </>
      )}
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
  const label = seat.activeHighlight
    ? seat.activeHighlight === "thinking"
      ? "Thinking"
      : "Acting"
    : null;

  return (
    <div className="arena-seat-highlight-wrap">
      {label ? (
        <span
          className={cn(
            "arena-seat-highlight-badge",
            seat.activeHighlight === "thinking"
              ? "border-cyan-400/35 bg-cyan-950/80 text-cyan-200/90"
              : "border-[var(--arena-blue-bright)]/40 bg-[var(--arena-blue)]/20 text-[var(--arena-cyan)]",
          )}
        >
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "arena-seat-highlight-inner",
          seat.activeHighlight === "thinking" &&
            "animate-pulse border-cyan-400/45 shadow-[0_0_12px_rgba(34,211,238,0.18)]",
          seat.activeHighlight === "acting" &&
            "border-[var(--arena-blue-bright)]/55 shadow-[0_0_12px_rgba(0,82,255,0.2)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function AgentBattleSeatRow({
  seat,
  edgeInset = false,
  endLayout,
}: {
  seat: TableSeat;
  edgeInset?: boolean;
  endLayout?: "top" | "bottom";
}) {
  const cardSize: CardSize = AGENT_BATTLE_CARD_SIZE;
  const isSpectator = seat.status === "idle" && !seat.revealCards;

  const avatar = (
    <div className="arena-seat-panel-slot shrink-0">
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
              "border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]",
            seat.activeHighlight === "acting" &&
              "border-[var(--arena-blue-bright)]/50 shadow-[0_0_10px_rgba(0,82,255,0.22)]",
          )}
        />
      </AgentBattleActiveHighlight>
    </div>
  );

  const cards = (
    <div
      className={cn(
        "flex min-h-[3.25rem] w-auto min-w-[4.75rem] shrink-0 items-center justify-center overflow-visible",
        edgeInset && "translate-x-1.5 sm:translate-x-2",
      )}
      aria-label={`${seat.name} hole cards`}
    >
      <div className="flex gap-0.5 overflow-visible arena-ab-cards">
        <SeatHoleCards seat={seat} cardSize={cardSize} softFold />
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "arena-seat-row",
        endLayout === "top" && "arena-seat-row--end-top",
        endLayout === "bottom" && "arena-seat-row--end-bottom",
        isSpectator && "opacity-90",
      )}
    >
      {endLayout === "bottom" ? (
        <>
          {cards}
          {avatar}
        </>
      ) : endLayout === "top" ? (
        <>
          {avatar}
          {cards}
        </>
      ) : (
        <>
          {avatar}
          {cards}
        </>
      )}
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
  const cardSize: CardSize = AGENT_BATTLE_CARD_SIZE;

  return (
    <div className="arena-ab-side-seat flex flex-col items-center gap-1">
      <div className="arena-seat-panel-slot shrink-0">
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
            seat.activeHighlight === "thinking" &&
              "border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]",
            seat.activeHighlight === "acting" &&
              "border-[var(--arena-blue-bright)]/50 shadow-[0_0_10px_rgba(0,82,255,0.22)]",
          )}
        />
        </AgentBattleActiveHighlight>
      </div>
      <div className="flex gap-0.5 arena-ab-cards">
        <SeatHoleCards seat={seat} cardSize={cardSize} softFold />
      </div>
    </div>
  );
}

function agentBattleMiniSeatStatus(seat: TableSeat): string {
  if (seat.activeHighlight === "thinking") return "THINKING";
  if (seat.activeHighlight === "acting") return "ACTING";
  if (seat.status === "winner") return "WINNER";
  if (seat.status === "folded") return "FOLDED";
  if (seat.status === "active") return "ACTIVE";
  return "WATCHING";
}

function AgentBattleMiniHoleCards({ seat }: { seat: TableSeat }) {
  return (
    <div className="arena-ab-mini-hole-cards arena-ab-cards">
      <SeatHoleCards seat={seat} cardSize={AGENT_BATTLE_CARD_SIZE} softFold animate={false} />
    </div>
  );
}

function AgentBattleMiniSideSeat({ seat }: { seat: TableSeat }) {
  const statusLabel = agentBattleMiniSeatStatus(seat);
  const isWinner = seat.status === "winner";
  const isActive = seat.status === "active" || seat.activeHighlight === "acting";
  const isThinking = seat.activeHighlight === "thinking";
  const isFolded = seat.status === "folded";

  return (
    <div className="arena-ab-mini-side-unit">
      <article
        className={cn(
          "arena-ab-mini-seat arena-ab-mini-seat--panel-only",
          isWinner && "arena-ab-mini-seat--winner",
          isThinking && "arena-ab-mini-seat--thinking",
          isActive && !isWinner && !isThinking && "arena-ab-mini-seat--active",
          isFolded && "opacity-90",
        )}
      >
        <div className="arena-ab-mini-seat-panel">
          <div className="arena-ab-mini-seat-avatar">{seat.avatar}</div>
          <p className="arena-ab-mini-seat-name">{seat.name}</p>
          <span className="arena-ab-mini-seat-status">{statusLabel}</span>
          <p className="arena-ab-mini-seat-stack">{seat.stack.toLocaleString()}</p>
        </div>
      </article>
      <div className="arena-ab-mini-seat-cards arena-ab-mini-seat-cards--outset">
        <AgentBattleMiniHoleCards seat={seat} />
      </div>
    </div>
  );
}

function AgentBattleMiniSeat({
  seat,
  orientation,
}: {
  seat: TableSeat;
  orientation: "top" | "bottom";
}) {
  const statusLabel = agentBattleMiniSeatStatus(seat);
  const isWinner = seat.status === "winner";
  const isActive = seat.status === "active" || seat.activeHighlight === "acting";
  const isThinking = seat.activeHighlight === "thinking";
  const isFolded = seat.status === "folded";

  const panel = (
    <div className="arena-ab-mini-seat-panel arena-ab-mini-seat-panel--row">
      <div className="arena-ab-mini-seat-avatar">{seat.avatar}</div>
      <div className="arena-ab-mini-seat-meta">
        <p className="arena-ab-mini-seat-name">{seat.name}</p>
        <span className="arena-ab-mini-seat-status">{statusLabel}</span>
        <p className="arena-ab-mini-seat-stack">{seat.stack.toLocaleString()}</p>
      </div>
    </div>
  );

  const cards = (
    <div className="arena-ab-mini-seat-cards arena-ab-mini-seat-cards--outset">
      <AgentBattleMiniHoleCards seat={seat} />
    </div>
  );

  return (
    <article
      className={cn(
        "arena-ab-mini-seat",
        isWinner && "arena-ab-mini-seat--winner",
        isThinking && "arena-ab-mini-seat--thinking",
        isActive && !isWinner && !isThinking && "arena-ab-mini-seat--active",
        isFolded && "opacity-90",
      )}
    >
      <div
        className={cn(
          "arena-ab-mini-seat-end",
          orientation === "top" && "arena-ab-mini-seat-end--top",
          orientation === "bottom" && "arena-ab-mini-seat-end--bottom",
        )}
      >
        {orientation === "bottom" ? (
          <>
            {cards}
            {panel}
          </>
        ) : (
          <>
            {panel}
            {cards}
          </>
        )}
      </div>
    </article>
  );
}

/** Broadcast mini-table below 2xl (<1536px) — absolute-positioned poker seats. */
function RoomAgentBattleBroadcastLayout({
  pot,
  communityCards,
  visibleBoardCount,
  seats,
  winnerName,
  winningHand,
  resultType,
}: {
  pot: number | null;
  communityCards: Card[];
  visibleBoardCount?: number;
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
}) {
  const topSeat = seats.find((s) => s.position === "top");
  const bottomSeat = seats.find((s) => s.position === "bottom");
  const leftSeat = seats.find((s) => s.position === "left");
  const rightSeat = seats.find((s) => s.position === "right");

  const showBoard = visibleBoardCount != null || communityCards.length > 0;

  return (
    <div className="arena-ab-broadcast arena-ab-mini-table" data-ab-layout="broadcast">
      <div className="arena-ab-mini-table-surface">
        <div className="arena-ab-mini-table-felt" aria-hidden />
        {topSeat ? (
          <div className="arena-ab-mini-slot arena-ab-mini-slot--top">
            <AgentBattleMiniSeat seat={topSeat} orientation="top" />
          </div>
        ) : null}

        {leftSeat ? (
          <div className="arena-ab-mini-slot arena-ab-mini-slot--left">
            <AgentBattleMiniSideSeat seat={leftSeat} />
          </div>
        ) : null}

        <div className="arena-ab-mini-slot arena-ab-mini-slot--center">
          {!winnerName ? (
            <div className="arena-ab-mini-pot">
              <ChipStack
                amount={pot ?? "\u2014"}
                size="sm"
                label="Pot"
                showIcons={false}
                className="justify-center"
              />
            </div>
          ) : null}
          {showBoard ? (
            <div className="arena-ab-mini-board">
              <div className="arena-ab-mini-board-cards arena-ab-cards">
                <SpectatorCommunityBoard
                  communityCards={communityCards}
                  visibleBoardCount={visibleBoardCount}
                  cardSize={AGENT_BATTLE_CARD_SIZE}
                  compactRow
                />
              </div>
            </div>
          ) : null}
          {winnerName ? (
            <div className="arena-ab-mini-result-inline">
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
        </div>

        {rightSeat ? (
          <div className="arena-ab-mini-slot arena-ab-mini-slot--right">
            <AgentBattleMiniSideSeat seat={rightSeat} />
          </div>
        ) : null}

        {bottomSeat ? (
          <div className="arena-ab-mini-slot arena-ab-mini-slot--bottom">
            <AgentBattleMiniSeat seat={bottomSeat} orientation="bottom" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RoomAgentBattleEllipseLayout({
  pot,
  communityCards,
  visibleBoardCount,
  seats,
  winnerName,
  winningHand,
  resultType,
}: {
  pot: number | null;
  communityCards: Card[];
  visibleBoardCount?: number;
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
}) {
  const agentBattleBoardCardSize: CardSize = AGENT_BATTLE_CARD_SIZE;
  const topSeat = seats.find((s) => s.position === "top");
  const bottomSeat = seats.find((s) => s.position === "bottom");
  const leftSeat = seats.find((s) => s.position === "left");
  const rightSeat = seats.find((s) => s.position === "right");

  return (
    <div className="arena-ab-ellipse-layout" data-ab-layout="ellipse">
      {topSeat ? (
        <div className="arena-ab-ellipse-slot arena-ab-ellipse-slot--top">
          <AgentBattleSeatRow seat={topSeat} endLayout="top" />
        </div>
      ) : null}

      <div className="arena-ab-ellipse-center">
        {!winnerName ? (
          <div className="flex min-h-[1.125rem] shrink-0 items-center justify-center rounded-full border border-[var(--arena-border)] bg-[var(--arena-surface)]/85 px-3 py-0.5 shadow-sm">
            <ChipStack
              amount={pot ?? "\u2014"}
              size="sm"
              label="Pot"
              showIcons={false}
              className="justify-center"
            />
          </div>
        ) : null}
        <div className="arena-ab-cards flex w-full justify-center">
          <SpectatorCommunityBoard
            communityCards={communityCards}
            visibleBoardCount={visibleBoardCount}
            cardSize={agentBattleBoardCardSize}
          />
        </div>
        {winnerName ? (
          <div className="arena-ab-ellipse-result-inline">
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
      </div>

      {bottomSeat ? (
        <div className="arena-ab-ellipse-slot arena-ab-ellipse-slot--bottom">
          <AgentBattleSeatRow seat={bottomSeat} endLayout="bottom" />
        </div>
      ) : null}

      {leftSeat ? (
        <div className="arena-ab-ellipse-slot arena-ab-ellipse-slot--left">
          <AgentBattleSideSeat seat={leftSeat} side="left" />
        </div>
      ) : null}

      {rightSeat ? (
        <div className="arena-ab-ellipse-slot arena-ab-ellipse-slot--right">
          <AgentBattleSideSeat seat={rightSeat} side="right" />
        </div>
      ) : null}
    </div>
  );
}

function RoomAgentBattleTableLayout({
  pot,
  communityCards,
  visibleBoardCount,
  seats,
  winnerName,
  winningHand,
  resultType,
}: {
  pot: number | null;
  communityCards: Card[];
  visibleBoardCount?: number;
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
}) {
  return (
    <AgentBattleResponsiveShell
      broadcast={
        <RoomAgentBattleBroadcastLayout
          pot={pot}
          communityCards={communityCards}
          visibleBoardCount={visibleBoardCount}
          seats={seats}
          winnerName={winnerName}
          winningHand={winningHand}
          resultType={resultType}
        />
      }
      ellipse={
        <RoomAgentBattleEllipseLayout
          pot={pot}
          communityCards={communityCards}
          visibleBoardCount={visibleBoardCount}
          seats={seats}
          winnerName={winnerName}
          winningHand={winningHand}
          resultType={resultType}
        />
      }
    />
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
  humanTurnSecondsLeft,
}: {
  pot: number | null;
  communityCards: Card[];
  seats: TableSeat[];
  winnerName?: string;
  winningHand?: string;
  resultType: HandResultDisplayType;
  boardCardSize: CardSize;
  humanTurnSecondsLeft?: number | null;
}) {
  const humanSeat = seats.find((s) => s.position === "bottom");
  const opponentSeat = seats.find((s) => s.position === "top");

  return (
    <div className="arena-hvai-layout">
      <div className="arena-hvai-column">
        {opponentSeat ? (
          <div className="arena-hvai-slot arena-hvai-slot--top">
            <HeadsUpPlayerCluster
              seat={opponentSeat}
              cardSize={boardCardSize}
              orientation="top"
              cardsLabel={`${opponentSeat.name} hole cards`}
            />
          </div>
        ) : null}

        <div className="arena-hvai-center">
          <div className="arena-hvai-pot flex min-h-[1.125rem] shrink-0 items-center justify-center rounded-full border border-[var(--arena-border)] bg-[var(--arena-surface)]/80 px-3 py-0.5 shadow-sm">
            <ChipStack
              amount={pot ?? "\u2014"}
              size="sm"
              label="Pot"
              showIcons={false}
              className="justify-center"
            />
          </div>
          <div className="arena-hvai-board">
            <StepDemoCommunityBoard
              communityCards={communityCards}
              cardSize={boardCardSize}
              roomLayout
            />
          </div>
        </div>

        {winnerName ? (
          <div className="arena-hvai-result">
            <WinnerBanner
              winnerName={winnerName}
              resultType={resultType}
              winningHand={winningHand}
              pot={pot}
              ultraCompact
            />
          </div>
        ) : null}

        {humanSeat ? (
          <div className="arena-hvai-slot arena-hvai-slot--human">
            <HeadsUpPlayerCluster
              seat={humanSeat}
              cardSize={boardCardSize}
              orientation="bottom"
              humanTurnSecondsLeft={humanTurnSecondsLeft}
              cardsLabel="Your hole cards"
            />
          </div>
        ) : null}
      </div>
    </div>
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
  agentBattleVisibleBoardCount,
  headsUpGuidedMode = false,
  showHumanVsAiBadge = false,
  roomLayout = false,
  humanTurnSecondsLeft = null,
  onLockStake,
  onPayMock,
  onBeginNewStakeSession,
  payingLockStake = false,
  payingMockStake = false,
  lockStakePhase = "idle",
  paymentError,
  selectedTestStake,
  onTestStakeChange,
  stakeCashedOut = false,
  cashOutRecord = null,
  className,
}: PokerTableProps) {
  const {
    isConnected,
    onBaseSepolia,
    wrongNetwork,
    lockPathConfigured,
    canSendLockTx,
    switchToBaseSepolia,
    isSwitching,
  } = useTestnetStakeNetwork();
  const layoutMode = resolveSeatLayoutMode(fourPlayerLayout, roomLayout);
  const boardCardSize = resolveBoardCardSize(layoutMode);
  const isPayingStake = payingLockStake || payingMockStake;
  const phaseLabel = getLockStakePhaseLabel(lockStakePhase);
  const showStakeActions = Boolean(onLockStake || onPayMock);

  return (
    <div
      className={cn(
        "relative rounded-[2rem] border border-[var(--arena-border)] bg-[var(--arena-bg)] shadow-[0_12px_40px_rgba(0,0,0,0.55)]",
        roomLayout && !agentBattleMode ? "overflow-visible" : "overflow-hidden",
        roomLayout ? "arena-table-room" : "p-4",
        agentBattleMode && roomLayout && "arena-table-agent-battle",
        roomLayout && !agentBattleMode && "arena-table-hvai",
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
          variant="outline"
          className="pointer-events-none absolute right-2 top-2 z-[28] max-w-[9rem] border-white/10 bg-black/35 px-1.5 py-0.5 text-center text-[6px] font-normal leading-snug text-white/45 backdrop-blur-sm sm:right-3 sm:top-3 sm:max-w-[10.5rem] sm:text-[7px] md:hidden"
        >
          <span className="hidden min-[480px]:inline">
            Spectator Mode — all agent cards visible
          </span>
          <span className="min-[480px]:hidden">Spectator</span>
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
        <div className="arena-table-oval-rail absolute inset-[2%] rounded-[50%] border-4 border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-950 shadow-inner" />

        {/* Felt — premium AI arena (navy / electric blue) */}
        <div
          className={cn(
            "arena-table-oval-felt absolute inset-[5%] rounded-[50%] border-2 border-[var(--arena-cyan)]/35 arena-table-glow-blue",
            layoutMode === "roomHeadsUp" ? "overflow-visible" : "overflow-hidden",
          )}
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
          <div className="absolute inset-[12%] rounded-[50%] border border-white/10 pointer-events-none" />

          {layoutMode === "roomHeadsUp" ? (
            <RoomHeadsUpTableLayout
              pot={pot}
              communityCards={communityCards}
              seats={seats}
              winnerName={winnerName}
              winningHand={winningHand}
              resultType={resultType}
              boardCardSize={boardCardSize}
              humanTurnSecondsLeft={humanTurnSecondsLeft}
            />
          ) : null}
        </div>

        {layoutMode === "roomHeadsUp" ? null : agentBattleMode && roomLayout ? (
          <RoomAgentBattleTableLayout
            pot={pot}
            communityCards={communityCards}
            visibleBoardCount={agentBattleVisibleBoardCount}
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
                visibleBoardCount={agentBattleVisibleBoardCount}
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
          <div
            className={cn(
              "mx-4 max-w-sm rounded-2xl v1-panel v1-glow-border px-6 py-5 text-center backdrop-blur-md",
              stakeCashedOut && "border-[var(--arena-cyan)]/35",
            )}
          >
            {stakeCashedOut ? (
              <>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[var(--arena-cyan)]" />
                  <p className="text-sm font-semibold text-[var(--arena-cyan)]">
                    Test Balance Cashed Out
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start a new test stake session to play again.
                </p>
                {cashOutRecord ? (
                  <dl className="mt-3 space-y-1 rounded-lg border border-[var(--arena-cyan)]/20 bg-[var(--arena-blue)]/10 p-2.5 text-left text-[10px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Chips cashed out</dt>
                      <dd className="font-semibold text-white">
                        {cashOutRecord.cashOutChips.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Test balance</dt>
                        <dd className="font-semibold text-[var(--arena-cyan)]">
                        {formatTestBalanceAmount(cashOutRecord.cashOutTestBalance)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">Recipient wallet</dt>
                      <dd
                        className="max-w-[7rem] truncate font-mono text-[9px] text-white/75"
                        title={cashOutRecord.walletAddress ?? undefined}
                      >
                        {cashOutRecord.walletAddress ??
                          "Local preview / no wallet connected"}
                      </dd>
                    </div>
                    {cashOutRecord.claimTxHash ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Claim tx</dt>
                        <dd className="max-w-[7rem] truncate font-mono text-[9px] text-violet-200">
                          {cashOutRecord.claimTxHash}
                        </dd>
                      </div>
                    ) : cashOutRecord.mockWithdrawalId ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Receipt</dt>
                        <dd
                          className="max-w-[7rem] truncate font-mono text-[9px] text-white/75"
                          title={cashOutRecord.mockWithdrawalId}
                        >
                          {cashOutRecord.mockWithdrawalId}
                        </dd>
                      </div>
                    ) : null}
                    {cashOutRecord.settlement === "escrow-claim" ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">On-chain payout</dt>
                        <dd className="text-[var(--arena-cyan)]/90">Claimed from escrow</dd>
                      </div>
                    ) : cashOutRecord.settlement === "treasury-record" ? (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Treasury fallback</dt>
                        <dd className="text-amber-200/90">Automated payout unavailable</dd>
                      </div>
                    ) : (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Settlement</dt>
                        <dd className="text-white/80">Mock session · local preview only</dd>
                      </div>
                    )}
                  </dl>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--arena-cyan)]">
                  Lock Test Stake
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Choose stake. Confirm escrow deposit. Play with chips.
                </p>
                {!stakeCashedOut ? (
                  <p className="mt-2 text-[9px] text-muted-foreground">
                    Base Sepolia testnet only · no mainnet funds
                  </p>
                ) : null}
                {wrongNetwork && !stakeCashedOut ? (
                  <p className="mt-2 rounded-lg border px-2.5 py-1.5 text-[10px] arena-panel-warn">
                    Switch to Base Sepolia to lock stake.
                  </p>
                ) : null}
              </>
            )}
            {showStakeActions && selectedTestStake && onTestStakeChange ? (
              <div className="mt-3 text-left">
                <TestStakePicker
                  value={selectedTestStake}
                  onChange={onTestStakeChange}
                  disabled={isPayingStake}
                  compact
                />
                <p className="mt-2 text-center text-[10px] font-medium text-[var(--arena-cyan)]">
                  {formatStakeToChipsLine(selectedTestStake)}
                </p>
              </div>
            ) : null}
            {showStakeActions ? (
              <div className="mt-4 space-y-2">
                {stakeCashedOut ? (
                  <Button
                    type="button"
                    size="lg"
                    className="v1-button-primary w-full"
                    disabled={isPayingStake}
                    onClick={() => onBeginNewStakeSession?.()}
                  >
                    Choose New Stake Session
                  </Button>
                ) : wrongNetwork ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      variant="destructive"
                      className="w-full"
                      disabled={isSwitching || isPayingStake}
                      onClick={() => switchToBaseSepolia()}
                    >
                      {isSwitching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Switching network…
                        </>
                      ) : (
                        "Switch to Base Sepolia"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      disabled={isPayingStake}
                      onClick={onPayMock}
                    >
                      {payingMockStake ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Starting mock session…
                        </>
                      ) : (
                        "Mock session"
                      )}
                    </Button>
                  </>
                ) : isConnected && onBaseSepolia ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      className="v1-button-primary w-full"
                      disabled={isPayingStake || !canSendLockTx}
                      onClick={onLockStake}
                    >
                      {payingLockStake ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {phaseLabel ?? "Locking test stake…"}
                        </>
                      ) : (
                        "Lock Test Stake"
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      disabled={isPayingStake}
                      onClick={onPayMock}
                    >
                      {payingMockStake ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Starting mock session…
                        </>
                      ) : (
                        "Mock session"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <ConnectWalletButton
                      size="lg"
                      showDemoHint={false}
                      className="v1-button-primary w-full"
                    />
                    <Button
                      type="button"
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      disabled={isPayingStake}
                      onClick={onPayMock}
                    >
                      {payingMockStake ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Starting mock session…
                        </>
                      ) : (
                        "Mock session"
                      )}
                    </Button>
                  </>
                )}
                {isConnected && onBaseSepolia && !lockPathConfigured && !stakeCashedOut ? (
                  <p className="text-[10px] leading-relaxed text-amber-200/85">
                    On-chain lock unavailable. Use mock session.
                  </p>
                ) : null}
                {phaseLabel && lockStakePhase !== "idle" && !stakeCashedOut ? (
                  <p className="text-[10px] leading-relaxed text-[var(--arena-cyan)]">
                    {phaseLabel}
                  </p>
                ) : null}
                {paymentError ? (
                  <p className="text-[10px] text-red-400">{paymentError}</p>
                ) : null}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Use the sidebar to lock a test stake session.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
