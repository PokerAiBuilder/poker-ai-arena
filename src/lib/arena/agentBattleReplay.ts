import { AGENT_REGISTRY } from "@/lib/agents/agentRegistry";
import type { TableSeat } from "@/components/arena/PokerTable";
import type { AgentStatus } from "@/components/arena/AgentAvatar";
import {
  getHandResultDisplayType,
  isWinByFoldResult,
} from "@/lib/arena/simulationDisplay";
import type {
  Card,
  GameAction,
  GameStage,
  SimulationAgentDecision,
  SimulationResult,
} from "@/lib/poker/types";

/** Timeline step kinds — scheduled offsets prepare shared spectator replay later. */
export type AgentBattleTimelineStepType =
  | "hand_start"
  | "thinking"
  | "action"
  | "deal_flop"
  | "deal_turn"
  | "deal_river"
  | "showdown"
  | "result";

export type AgentBattleReplayTimelineStep = {
  id: string;
  atMs: number;
  durationMs: number;
  type: AgentBattleTimelineStepType;
  phase: GameStage | "intro" | "complete";
  actorId?: string;
  actorName?: string;
  text: string;
  visibleBoardCards?: Card[];
  activeAgentId?: string;
  actionLogIndex?: number;
  action?: GameAction;
  decisionIndex?: number;
  showResult?: boolean;
};

/** Timeline model prepares Agent Battle for future shared spectator mode. */
export type AgentBattleReplayTimeline = {
  handId: string;
  totalDurationMs: number;
  steps: AgentBattleReplayTimelineStep[];
};

export type AgentBattleReplaySession = {
  handId: string;
  finalResult: SimulationResult;
  /** Wall-clock start for local elapsed derivation (server hand start later). */
  startedAt: number;
  status: "playing" | "complete" | "skipped";
};

export type AgentBattleReplayDisplay = {
  communityCards: Card[];
  visibleActionLog: GameAction[];
  foldedPlayerIds: Set<string>;
  showResult: boolean;
  thinkingAgentId?: string;
  thinkingAgentName?: string;
  highlightAgentId?: string;
  activeHighlight?: "thinking" | "acting";
  latestDecision?: SimulationAgentDecision;
  visibleDecisionCount: number;
  useFinalStacks: boolean;
  stacks: Record<string, number>;
  pot: number;
  bannerText?: string;
  winnerName?: string;
  winningHand?: string;
  resultType?: ReturnType<typeof getHandResultDisplayType>;
  elapsedMs: number;
  currentStepIndex: number;
};

const PLAYER_ACTIONS = new Set<GameAction["action"]>([
  "fold",
  "check",
  "call",
  "raise",
  "all-in",
]);

function isSkippableReplayLogEntry(entry: GameAction): boolean {
  if (/^\[INFO\]/i.test(entry.message)) return true;
  if (/\bwould\b/i.test(entry.message)) return true;
  return false;
}

function computeReplayChipState(
  finalResult: SimulationResult,
  visibleActionLog: GameAction[],
  useFinalStacks: boolean,
): { stacks: Record<string, number>; pot: number } {
  const accounting = finalResult.agentBattleAccounting;
  if (useFinalStacks && accounting?.finalStacks) {
    return {
      stacks: Object.fromEntries(
        Object.entries(accounting.finalStacks).map(([id, stack]) => [
          id,
          Math.max(0, Math.floor(stack)),
        ]),
      ),
      pot: Math.max(0, Math.floor(finalResult.pot)),
    };
  }

  const stacks: Record<string, number> = accounting?.startingStacks
    ? Object.fromEntries(
        Object.entries(accounting.startingStacks).map(([id, stack]) => [
          id,
          Math.max(0, Math.floor(stack)),
        ]),
      )
    : Object.fromEntries(
        finalResult.players.map((p) => [p.id, Math.max(0, Math.floor(p.stack))]),
      );

  let pot = 0;
  for (const entry of visibleActionLog) {
    const amt = entry.amount;
    if (amt != null && amt > 0 && entry.playerId !== "system") {
      stacks[entry.playerId] = Math.max(0, (stacks[entry.playerId] ?? 0) - amt);
      pot += amt;
    }
  }

  return { stacks, pot: Math.max(0, Math.floor(pot)) };
}

function thinkingDelayMs(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return 700 + (Math.abs(hash) % 701);
}

function isBoardDealMessage(message: string): "flop" | "turn" | "river" | null {
  if (/^Flop dealt:/i.test(message)) return "flop";
  if (/^Turn dealt:/i.test(message)) return "turn";
  if (/^River dealt:/i.test(message)) return "river";
  return null;
}

type TimelineCursor = { atMs: number };

function appendTimelineStep(
  steps: AgentBattleReplayTimelineStep[],
  cursor: TimelineCursor,
  step: Omit<AgentBattleReplayTimelineStep, "atMs">,
): void {
  steps.push({ ...step, atMs: cursor.atMs });
  cursor.atMs += step.durationMs;
}

function pushActionTimelineStep(
  steps: AgentBattleReplayTimelineStep[],
  cursor: TimelineCursor,
  entry: GameAction,
  index: number,
  options?: { durationMs?: number; decisionIndex?: number },
): void {
  appendTimelineStep(steps, cursor, {
    id: `action-${index}`,
    durationMs: options?.durationMs ?? 650,
    type: "action",
    phase: entry.stage,
    actorId: entry.playerId !== "system" ? entry.playerId : undefined,
    actorName: entry.playerName !== "Arena" ? entry.playerName : undefined,
    text: entry.message,
    activeAgentId: entry.playerId !== "system" ? entry.playerId : undefined,
    actionLogIndex: index + 1,
    action: entry,
    decisionIndex: options?.decisionIndex,
  });
}

/** Build a scheduled replay timeline from a completed Agent Battle simulation. */
export function buildAgentBattleReplayTimeline(
  result: SimulationResult,
): AgentBattleReplayTimeline {
  const steps: AgentBattleReplayTimelineStep[] = [];
  const cursor: TimelineCursor = { atMs: 0 };
  let decisionIndex = 0;

  appendTimelineStep(steps, cursor, {
    id: "hand-start",
    durationMs: 500,
    type: "hand_start",
    phase: "intro",
    text: `Hand #${result.handNumber} — Agent Battle live`,
    actionLogIndex: 0,
  });

  for (let i = 0; i < result.actionLog.length; i += 1) {
    const entry = result.actionLog[i];
    if (isSkippableReplayLogEntry(entry)) continue;

    const boardDeal = isBoardDealMessage(entry.message);

    if (boardDeal === "flop") {
      appendTimelineStep(steps, cursor, {
        id: `deal-flop-${i}`,
        durationMs: 950,
        type: "deal_flop",
        phase: "flop",
        text: entry.message,
        visibleBoardCards: result.communityCards.slice(0, 3),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (boardDeal === "turn") {
      appendTimelineStep(steps, cursor, {
        id: `deal-turn-${i}`,
        durationMs: 900,
        type: "deal_turn",
        phase: "turn",
        text: entry.message,
        visibleBoardCards: result.communityCards.slice(0, 4),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (boardDeal === "river") {
      appendTimelineStep(steps, cursor, {
        id: `deal-river-${i}`,
        durationMs: 900,
        type: "deal_river",
        phase: "river",
        text: entry.message,
        visibleBoardCards: result.communityCards.slice(0, 5),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (entry.action === "showdown") {
      appendTimelineStep(steps, cursor, {
        id: `showdown-${i}`,
        durationMs: entry.message === "Showdown complete." ? 700 : 1100,
        type: "showdown",
        phase: "showdown",
        text: entry.message,
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (entry.action === "blind") {
      pushActionTimelineStep(steps, cursor, entry, i, { durationMs: 380 });
      continue;
    }

    if (PLAYER_ACTIONS.has(entry.action) && entry.playerId !== "system") {
      appendTimelineStep(steps, cursor, {
        id: `think-${i}`,
        durationMs: thinkingDelayMs(`${result.gameId}-${i}-${entry.playerId}`),
        type: "thinking",
        phase: entry.stage,
        actorId: entry.playerId,
        actorName: entry.playerName,
        text: `${entry.playerName} thinking...`,
        activeAgentId: entry.playerId,
        actionLogIndex: i,
      });
      pushActionTimelineStep(steps, cursor, entry, i, {
        durationMs: 700,
        decisionIndex: decisionIndex,
      });
      decisionIndex += 1;
      continue;
    }

    if (entry.action === "deal" || entry.playerId === "system") {
      pushActionTimelineStep(steps, cursor, entry, i, { durationMs: 320 });
    }
  }

  const lastStep = steps[steps.length - 1];
  if (!lastStep || lastStep.type !== "result") {
    appendTimelineStep(steps, cursor, {
      id: "result-final",
      durationMs: 1200,
      type: "result",
      phase: "complete",
      text: `${result.winner.name} wins`,
      actionLogIndex: result.actionLog.length,
      visibleBoardCards: result.communityCards.slice(0, 5),
      showResult: true,
    });
  }

  return {
    handId: result.gameId,
    totalDurationMs: cursor.atMs,
    steps,
  };
}

/** Index of the timeline step active at elapsedMs. */
export function resolveTimelineStepIndex(
  timeline: AgentBattleReplayTimeline,
  elapsedMs: number,
): number {
  if (elapsedMs < 0 || timeline.steps.length === 0) return -1;

  let index = -1;
  for (let i = 0; i < timeline.steps.length; i += 1) {
    if (elapsedMs >= timeline.steps[i].atMs) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

export function deriveAgentBattleReplayDisplayFromTimeline(
  finalResult: SimulationResult,
  timeline: AgentBattleReplayTimeline,
  elapsedMs: number,
): AgentBattleReplayDisplay {
  const stepIndex = resolveTimelineStepIndex(timeline, elapsedMs);
  const display: AgentBattleReplayDisplay = {
    communityCards: [],
    visibleActionLog: [],
    foldedPlayerIds: new Set<string>(),
    showResult: false,
    visibleDecisionCount: 0,
    useFinalStacks: false,
    stacks: {},
    pot: 0,
    elapsedMs,
    currentStepIndex: stepIndex,
  };

  if (stepIndex < 0) {
    return display;
  }

  for (let i = 0; i <= stepIndex; i += 1) {
    const step = timeline.steps[i];

    if (step.type === "hand_start") {
      display.bannerText = step.text;
      continue;
    }

    if (step.type === "thinking") {
      display.thinkingAgentId = step.actorId;
      display.thinkingAgentName = step.actorName;
      display.highlightAgentId = step.activeAgentId ?? step.actorId;
      display.activeHighlight = "thinking";
      if (step.actionLogIndex != null) {
        display.visibleActionLog = finalResult.actionLog
          .slice(0, step.actionLogIndex)
          .filter((entry) => !isSkippableReplayLogEntry(entry));
      }
      continue;
    }

    display.thinkingAgentId = undefined;
    display.thinkingAgentName = undefined;
    display.activeHighlight =
      step.type === "action" && step.actorId ? "acting" : undefined;

    if (step.actionLogIndex != null) {
      display.visibleActionLog = finalResult.actionLog
        .slice(0, step.actionLogIndex)
        .filter((entry) => !isSkippableReplayLogEntry(entry));
    }

    if (step.action?.action === "fold" && step.action.playerId) {
      display.foldedPlayerIds.add(step.action.playerId);
    }

    if (step.decisionIndex != null) {
      display.visibleDecisionCount = Math.max(
        display.visibleDecisionCount,
        step.decisionIndex + 1,
      );
      display.latestDecision =
        finalResult.agentDecisions[step.decisionIndex] ?? display.latestDecision;
      display.highlightAgentId = step.activeAgentId ?? step.actorId;
    }

    if (step.visibleBoardCards) {
      display.communityCards = step.visibleBoardCards;
    }

    if (step.type === "showdown") {
      display.bannerText = step.text;
    }

    if (step.type === "result" || step.showResult) {
      display.showResult = true;
      display.useFinalStacks = true;
      display.communityCards = finalResult.communityCards.slice(0, 5);
      display.winnerName = finalResult.winner.name;
      display.winningHand = isWinByFoldResult(finalResult)
        ? undefined
        : finalResult.winningHand.rankName;
      display.resultType = getHandResultDisplayType(finalResult);
      display.thinkingAgentId = undefined;
      display.thinkingAgentName = undefined;
      display.highlightAgentId = undefined;
      display.activeHighlight = undefined;
    }
  }

  const chipState = computeReplayChipState(
    finalResult,
    display.visibleActionLog.filter((entry) => !isSkippableReplayLogEntry(entry)),
    display.useFinalStacks,
  );
  display.stacks = chipState.stacks;
  display.pot = chipState.pot;

  return display;
}

function replaySeatStatus(
  playerId: string,
  display: AgentBattleReplayDisplay,
  finalResult: SimulationResult,
): AgentStatus {
  if (display.showResult) {
    if (finalResult.winner.id === playerId) return "winner";
    const player = finalResult.players.find((p) => p.id === playerId);
    if (player?.hasFolded || display.foldedPlayerIds.has(playerId)) return "folded";
    return "active";
  }

  if (display.foldedPlayerIds.has(playerId)) return "folded";
  if (
    display.thinkingAgentId === playerId ||
    display.highlightAgentId === playerId
  ) {
    return "active";
  }
  return "active";
}

function replaySeatStack(
  playerId: string,
  display: AgentBattleReplayDisplay,
  finalResult: SimulationResult,
  sessionStacks: Record<string, number>,
): number {
  const accounting = finalResult.agentBattleAccounting;
  if (display.useFinalStacks) {
    const finalStack = accounting?.finalStacks?.[playerId];
    if (finalStack != null) return Math.max(0, Math.floor(finalStack));
    if (playerId in sessionStacks) return sessionStacks[playerId];
  }

  const startingStack = accounting?.startingStacks?.[playerId];
  if (startingStack != null) return Math.max(0, Math.floor(startingStack));
  if (playerId in sessionStacks) return sessionStacks[playerId];

  const player = finalResult.players.find((p) => p.id === playerId);
  return player?.stack ?? 1000;
}

export function buildAgentBattleReplaySeats(
  finalResult: SimulationResult,
  display: AgentBattleReplayDisplay,
  sessionStacks: Record<string, number>,
): TableSeat[] {
  const layout: Record<string, TableSeat["position"]> = {
    "poker-master": "bottom",
    "river-mind": "top",
    "bluff-bot": "left",
    "chip-hunter": "right",
  };

  return AGENT_REGISTRY.map((agent) => {
    const player = finalResult.players.find((p) => p.id === agent.id);
    const stack =
      display.stacks[agent.id] ??
      replaySeatStack(agent.id, display, finalResult, sessionStacks);
    const activeHighlight =
      display.activeHighlight &&
      (display.thinkingAgentId === agent.id || display.highlightAgentId === agent.id)
        ? display.activeHighlight
        : undefined;

    return {
      id: agent.id,
      name: player?.name ?? agent.name,
      avatar: agent.avatar,
      strategy: agent.strategy,
      stack,
      holeCards: player?.holeCards ?? [],
      status: replaySeatStatus(agent.id, display, finalResult),
      position: layout[agent.id] ?? "left",
      revealCards: true,
      activeHighlight,
    };
  });
}

/** @deprecated Use buildAgentBattleReplayTimeline */
export function buildAgentBattleReplaySteps(result: SimulationResult) {
  return buildAgentBattleReplayTimeline(result).steps;
}

/** @deprecated Use deriveAgentBattleReplayDisplayFromTimeline */
export function deriveAgentBattleReplayDisplay(
  finalResult: SimulationResult,
  timeline: AgentBattleReplayTimeline,
  stepIndex: number,
): AgentBattleReplayDisplay {
  const elapsedMs =
    stepIndex >= 0 && stepIndex < timeline.steps.length
      ? timeline.steps[stepIndex].atMs
      : stepIndex >= timeline.steps.length && timeline.steps.length > 0
        ? timeline.totalDurationMs
        : 0;
  return deriveAgentBattleReplayDisplayFromTimeline(finalResult, timeline, elapsedMs);
}
