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

export type AgentBattleReplayStepType =
  | "hand_start"
  | "agent_thinking"
  | "action"
  | "deal_flop"
  | "deal_turn"
  | "deal_river"
  | "showdown"
  | "result";

export type AgentBattleReplayStep = {
  id: string;
  type: AgentBattleReplayStepType;
  phase: GameStage | "intro" | "complete";
  actorId?: string;
  actorName?: string;
  displayText: string;
  delayMs: number;
  cardsToReveal?: Card[];
  actionLogIndex?: number;
  action?: GameAction;
  decisionIndex?: number;
  showResult?: boolean;
};

export type AgentBattleReplaySession = {
  id: string;
  finalResult: SimulationResult;
  stepIndex: number;
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

function pushActionStep(
  steps: AgentBattleReplayStep[],
  entry: GameAction,
  index: number,
  options?: { delayMs?: number; decisionIndex?: number },
): void {
  steps.push({
    id: `action-${index}`,
    type: "action",
    phase: entry.stage,
    actorId: entry.playerId !== "system" ? entry.playerId : undefined,
    actorName: entry.playerName !== "Arena" ? entry.playerName : undefined,
    displayText: entry.message,
    delayMs: options?.delayMs ?? 650,
    actionLogIndex: index + 1,
    action: entry,
    decisionIndex: options?.decisionIndex,
  });
}

/** Build replay timeline from a completed Agent Battle simulation. */
export function buildAgentBattleReplaySteps(
  result: SimulationResult,
): AgentBattleReplayStep[] {
  const steps: AgentBattleReplayStep[] = [];
  let decisionIndex = 0;

  steps.push({
    id: "hand-start",
    type: "hand_start",
    phase: "intro",
    displayText: `Hand #${result.handNumber} — Agent Battle live`,
    delayMs: 500,
    actionLogIndex: 0,
  });

  for (let i = 0; i < result.actionLog.length; i += 1) {
    const entry = result.actionLog[i];
    if (isSkippableReplayLogEntry(entry)) continue;

    const boardDeal = isBoardDealMessage(entry.message);

    if (boardDeal === "flop") {
      steps.push({
        id: `deal-flop-${i}`,
        type: "deal_flop",
        phase: "flop",
        displayText: entry.message,
        delayMs: 950,
        cardsToReveal: result.communityCards.slice(0, 3),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (boardDeal === "turn") {
      steps.push({
        id: `deal-turn-${i}`,
        type: "deal_turn",
        phase: "turn",
        displayText: entry.message,
        delayMs: 900,
        cardsToReveal: result.communityCards.slice(0, 4),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (boardDeal === "river") {
      steps.push({
        id: `deal-river-${i}`,
        type: "deal_river",
        phase: "river",
        displayText: entry.message,
        delayMs: 900,
        cardsToReveal: result.communityCards.slice(0, 5),
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (entry.action === "showdown") {
      steps.push({
        id: `showdown-${i}`,
        type: "showdown",
        phase: "showdown",
        displayText: entry.message,
        delayMs: entry.message === "Showdown complete." ? 700 : 1100,
        actionLogIndex: i + 1,
        action: entry,
      });
      continue;
    }

    if (entry.action === "blind") {
      pushActionStep(steps, entry, i, { delayMs: 380 });
      continue;
    }

    if (PLAYER_ACTIONS.has(entry.action) && entry.playerId !== "system") {
      steps.push({
        id: `think-${i}`,
        type: "agent_thinking",
        phase: entry.stage,
        actorId: entry.playerId,
        actorName: entry.playerName,
        displayText: `${entry.playerName} thinking...`,
        delayMs: thinkingDelayMs(`${result.gameId}-${i}-${entry.playerId}`),
        actionLogIndex: i,
      });
      pushActionStep(steps, entry, i, {
        delayMs: 700,
        decisionIndex: decisionIndex,
      });
      decisionIndex += 1;
      continue;
    }

    if (entry.action === "deal" || entry.playerId === "system") {
      pushActionStep(steps, entry, i, { delayMs: 320 });
    }
  }

  const lastStep = steps[steps.length - 1];
  if (!lastStep || lastStep.type !== "result") {
    steps.push({
      id: "result-final",
      type: "result",
      phase: "complete",
      displayText: `${result.winner.name} wins`,
      delayMs: 1200,
      actionLogIndex: result.actionLog.length,
      cardsToReveal: result.communityCards.slice(0, 5),
      showResult: true,
    });
  }

  return steps;
}

export function deriveAgentBattleReplayDisplay(
  finalResult: SimulationResult,
  steps: AgentBattleReplayStep[],
  stepIndex: number,
): AgentBattleReplayDisplay {
  const display: AgentBattleReplayDisplay = {
    communityCards: [],
    visibleActionLog: [],
    foldedPlayerIds: new Set<string>(),
    showResult: false,
    visibleDecisionCount: 0,
    useFinalStacks: false,
    stacks: {},
    pot: 0,
  };

  const through = Math.min(stepIndex, steps.length - 1);
  if (stepIndex < 0 || steps.length === 0) {
    return display;
  }

  for (let i = 0; i <= through; i += 1) {
    const step = steps[i];

    if (step.type === "hand_start") {
      display.bannerText = step.displayText;
      continue;
    }

    if (step.type === "agent_thinking") {
      display.thinkingAgentId = step.actorId;
      display.thinkingAgentName = step.actorName;
      display.highlightAgentId = step.actorId;
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
      display.highlightAgentId = step.actorId;
    }

    if (step.cardsToReveal) {
      display.communityCards = step.cardsToReveal;
    }

    if (step.type === "showdown") {
      display.bannerText = step.displayText;
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
