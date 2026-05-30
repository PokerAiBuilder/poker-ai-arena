import {
  AGENT_REGISTRY,
  BluffBot,
  ChipHunter,
  RiverMind,
} from "@/lib/agents/agentRegistry";
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
    [BluffBot.id]: "left",
    [RiverMind.id]: "right",
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
): AgentStatus {
  if (!result) return "idle";
  if (result.winner.id === playerId) return "winner";
  const player = result.players.find((p) => p.id === playerId);
  if (player?.hasFolded) return "folded";
  if (player) return "active";
  return "idle";
}

function resolveDisplayStack(
  playerId: string,
  result: SimulationResult | null,
  sessionStacks: Record<string, number> | undefined,
  defaultStack: number,
): number {
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

  return {
    id: config.id,
    name: player?.name ?? config.name,
    avatar: config.avatar,
    strategy: config.strategy,
    stack: resolveDisplayStack(
      config.id,
      result,
      sessionStacks,
      config.defaultStack,
    ),
    holeCards: player?.holeCards ?? [],
    status: config.forceIdle ? "idle" : seatStatus(config.id, result),
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
    return AGENT_REGISTRY.map((agent) =>
      buildSeatFromPlayer(
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
      ),
    );
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
    buildSeatFromPlayer(
      result,
      gameMode,
      {
        id: BluffBot.id,
        name: BluffBot.name,
        avatar: BluffBot.avatar,
        strategy: BluffBot.strategy,
        defaultStack,
        forceIdle: !result,
      },
      sessionStacks,
    ),
    buildSeatFromPlayer(
      result,
      gameMode,
      {
        id: RiverMind.id,
        name: RiverMind.name,
        avatar: RiverMind.avatar,
        strategy: RiverMind.strategy,
        defaultStack,
        forceIdle: !result,
      },
      sessionStacks,
    ),
  ];
}
