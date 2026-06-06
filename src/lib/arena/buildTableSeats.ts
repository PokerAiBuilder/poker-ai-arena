import {
  AGENT_REGISTRY,
  BluffBot,
  ChipHunter,
  RiverMind,
} from "@/lib/agents/agentRegistry";
import { getAgentStyleBadge } from "@/lib/agents/agentProfiles";
import { PokerMaster } from "@/lib/agents/pokerMaster";
import type { TableSeat } from "@/components/arena/PokerTable";
import type { AgentStatus } from "@/components/arena/AgentAvatar";
import { shouldRevealHoleCards } from "@/lib/arena/simulationDisplay";
import type { GameMode, SimulationResult } from "@/lib/poker/types";

const SEAT_LAYOUT: Record<
  GameMode,
  Record<string, TableSeat["position"]>
> = {
  "human-vs-ai": {
    human: "bottom",
    [PokerMaster.id]: "top",
  },
  "agent-vs-agent": {
    [PokerMaster.id]: "bottom",
    [RiverMind.id]: "top",
    [BluffBot.id]: "left",
    [ChipHunter.id]: "right",
  },
};

function seatStatus(
  playerId: string,
  result: SimulationResult | null,
  displayStack?: number,
): AgentStatus {
  if (displayStack != null && displayStack <= 0) return "folded";
  if (!result) return "idle";
  if (result.winner.id === playerId) return "winner";
  const player = result.players.find((p) => p.id === playerId);
  if (player?.hasFolded) return "folded";
  if (player) return "idle";
  return "idle";
}

function resolveDisplayStack(
  playerId: string,
  result: SimulationResult | null,
  sessionStacks: Record<string, number> | undefined,
  defaultStack: number,
): number {
  const accountingStack = result?.agentBattleAccounting?.finalStacks?.[playerId];
  if (accountingStack != null && Number.isFinite(accountingStack)) {
    return Math.max(0, Math.floor(accountingStack));
  }

  if (sessionStacks && playerId in sessionStacks) {
    return sessionStacks[playerId];
  }

  const player = result?.players.find((p) => p.id === playerId);
  return player?.stack ?? defaultStack;
}

function buildSeatFromPlayer(
  result: SimulationResult | null,
  gameMode: GameMode,
  config: {
    id: string;
    name: string;
    avatar: string;
    strategy?: string;
    defaultStack: number;
    forceIdle?: boolean;
  },
  sessionStacks?: Record<string, number>,
): TableSeat {
  const layout = SEAT_LAYOUT[gameMode];
  const position = layout[config.id] ?? "left";
  const player = result?.players.find((p) => p.id === config.id);
  const stack = resolveDisplayStack(
    config.id,
    result,
    sessionStacks,
    config.defaultStack,
  );

  return {
    id: config.id,
    name: player?.name ?? config.name,
    avatar: config.avatar,
    strategy: config.strategy,
    stack,
    holeCards: player?.holeCards ?? [],
    status: config.forceIdle ? "idle" : seatStatus(config.id, result, stack),
    position,
    revealCards: shouldRevealHoleCards(config.id, result, gameMode, {
      forceIdle: config.forceIdle,
    }),
  };
}

export function buildTableSeats(
  result: SimulationResult | null,
  fallbackMode: GameMode = "human-vs-ai",
  sessionStacks?: Record<string, number>,
): TableSeat[] {
  const gameMode = result?.gameMode ?? fallbackMode;
  const defaultStack = 1000;

  if (gameMode === "agent-vs-agent") {
    return AGENT_REGISTRY.map((agent) => {
      const seat = buildSeatFromPlayer(
        result,
        gameMode,
        {
          id: agent.id,
          name: agent.name,
          avatar: agent.avatar,
          strategy: agent.strategy,
          defaultStack,
        },
        sessionStacks,
      );
      return {
        ...seat,
        personalityBadge: getAgentStyleBadge(agent.id),
      };
    });
  }

  return [
    buildSeatFromPlayer(
      result,
      gameMode,
      {
        id: PokerMaster.id,
        name: PokerMaster.name,
        avatar: PokerMaster.avatar,
        strategy: PokerMaster.strategy,
        defaultStack,
      },
      sessionStacks,
    ),
    buildSeatFromPlayer(
      result,
      gameMode,
      {
        id: "human",
        name: "Human Player",
        avatar: "HP",
        strategy: "balanced",
        defaultStack,
      },
      sessionStacks,
    ),
  ];
}
