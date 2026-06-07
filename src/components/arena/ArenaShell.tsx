"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { ArrowLeft, Sparkles, Swords, Users } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { ArenaActionBar } from "@/components/arena/ArenaActionBar";
import { ArenaMenuDrawer, ArenaMenuTrigger } from "@/components/arena/ArenaMenuDrawer";
import { AiDecisionPanel } from "@/components/arena/AiDecisionPanel";
import { SharedAgentBattleStatus } from "@/components/arena/SharedAgentBattleStatus";
import { EntryFeePanel } from "@/components/arena/EntryFeePanel";
import { PokerTable } from "@/components/arena/PokerTable";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearArenaAnalytics,
  clearAgentBattleStacks,
  clearSessionStacks,
  createInitialAgentBattleStacks,
  createInitialArenaAnalytics,
  createInitialSessionStacks,
  canStartHeadsUpHand,
  isHeadsUpStackDepleted,
  isAgentBattleStackDepleted,
  loadAgentBattleStacks,
  loadArenaAnalytics,
  loadSessionStacks,
  resetAgentBattleStacks,
  resetHeadsUpDemoStacks,
  applyStakeStartingStacks,
  saveAgentBattleStacks,
  saveArenaAnalytics,
  saveSessionStacks,
  canRunAgentBattle,
  sanitizeAgentBattleStacks,
  sanitizeSessionStacks,
  updateAgentBattleStacksAfterHand,
  updateLeaderboardAfterGame,
  updateSessionStacksAfterGame,
  updateSessionStatsAfterGame,
} from "@/lib/analytics";
import type {
  AgentBattleStacksState,
  ArenaAnalyticsState,
  SessionStacksState,
} from "@/lib/analytics";
import { buildTableSeats } from "@/lib/arena/buildTableSeats";
import {
  clearHandHistoryStorage,
  createHandHistoryFromSimulation,
  createHandHistoryFromStepDemo,
  loadHandHistory,
  prependHandHistory,
  saveHandHistory,
  simulationHistoryFingerprint,
  stepDemoHistoryFingerprint,
  type HandHistoryRecord,
} from "@/lib/arena/handHistory";
import { shouldRevealPokerMasterHandContext } from "@/lib/arena/humanVsAiDecisionPrivacy";
import {
  advanceStepDemoRevealFlop,
  advanceStepDemoRevealRiver,
  advanceStepDemoRevealTurn,
  advanceStepDemoRunoutBoard,
  advanceStepDemoShowResult,
  applyHumanAllInWithOutcome,
  applyHumanCallWithOutcome,
  applyHumanCheckWithOutcome,
  applyHumanFold,
  applyHumanTimeoutCheckWithOutcome,
  applyHumanTimeoutFold,
  applyHumanRaiseWithOutcome,
  buildStepDemoSeats,
  createInitialStepDemoState,
  dealStepDemoHand,
  getStepDemoHumanActions,
  getStepDemoHumanCallAmount,
  getStepDemoPotDisplay,
  getStepDemoStackUpdates,
  resolveStepDemoPendingAi,
  resolveStepDemoPendingAiWithFallback,
  type StepDemoHumanActionOutcome,
  type StepDemoPendingAi,
  type StepDemoRaiseSize,
  type StepDemoState,
} from "@/lib/arena/stepDemo";
import {
  canApplyStepDemoTransition,
  deriveStepDemoUiState,
  stepDemoUiBannerPhase,
} from "@/lib/arena/stepDemoUiState";
import {
  buildAutoFlowDebugSnapshot,
  canApplyAutoFlowAction,
  createAutoStepTimerController,
  resolveNextAutoFlowAction,
  type StepDemoAutoFlowPending,
} from "@/lib/arena/stepDemoAutoFlow";
import { resolveHumanTurnTimeoutAction } from "@/lib/arena/humanTurnTimer";
import { useHumanTurnTimer } from "@/hooks/useHumanTurnTimer";
import {
  buildAgentBattleReplaySeats,
  buildAgentBattleReplayTimeline,
  deriveAgentBattleReplayDisplayFromTimeline,
  type AgentBattleReplaySession,
} from "@/lib/arena/agentBattleReplay";
import {
  fetchSharedAgentBattleCurrent,
  logSharedAgentBattleDebug,
  type SharedAgentBattleJoinPayload,
} from "@/lib/arena/sharedAgentBattleClient";
import { formatCommunityCardsForDebug } from "@/lib/arena/sharedAgentBattleTypes";
import { useAgentBattleTimelineReplay } from "@/hooks/useAgentBattleTimelineReplay";
import {
  getHandResultDisplayType,
  getVisibleBoardCount,
  isWinByFoldResult,
  pickLatestAgentBattleDecision,
  resolveSimulationWinningHandName,
} from "@/lib/arena/simulationDisplay";
import type { X402PaymentResult } from "@/lib/bankr/x402Client";
import {
  DEFAULT_TEST_STAKE,
  formatStakeToChipsLine,
  getTestStakeTier,
  chipsToTestBalance,
  formatTestBalanceAmount,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import {
  clearStakeSessionMeta,
  createMockCashOutRecord,
  createTreasuryCashOutRecord,
  isStakeSessionActive,
  isStakeSessionCashedOut,
  loadStakeSessionMeta,
  saveStakeSessionMeta,
  type StakeSessionMeta,
} from "@/lib/stake/stakeSessionStorage";
import {
  performEscrowCashOut,
  performEscrowResolveOnly,
  type EscrowCashOutPhase,
} from "@/lib/stake/escrowCashOutFlow";
import { sendLockTestStakeTx, isLockStakePathConfigured } from "@/lib/stake/lockTestStakeTx";
import {
  isUserRejectedTransactionError,
  type LockStakePhase,
} from "@/lib/stake/lockStakeFlow";
import {
  getBaseSepoliaExplorerTxUrl,
  isBaseSepolia,
} from "@/lib/onchain/baseSepolia";
import type { GameAction, GameMode, SimulationResult } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

function createSessionLogEntry(message: string): GameAction {
  return {
    playerId: "system",
    playerName: "Arena",
    action: "deal",
    stage: "preflop",
    message,
    timestamp: Date.now(),
  };
}

function createErrorLogEntry(message: string): GameAction {
  return createSessionLogEntry(`Error: ${message}`);
}

function gameModeLabel(mode: GameMode): string {
  return mode === "agent-vs-agent" ? "AI Agent Battle" : "Human vs AI";
}

const POKERMASTER_THINKING_MIN_MS = 1200;
const POKERMASTER_THINKING_MAX_MS = 5000;
const POKERMASTER_THINKING_SAFETY_MS = 5500;
const SHARED_NEXT_HAND_FETCH_FUDGE_MS = 120;
const SHARED_SAME_HAND_RETRY_MS = 750;

function logSharedLifecycleDebug(message: string, info?: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "development") return;
  console.debug(`[arena/shared-agent-battle/lifecycle] ${message}`, info ?? {});
}

type SharedAgentBattleLifecycleState = {
  handId: string;
  lifecyclePhase: "playing" | "result_pause";
  nextHandAt: number;
  resultPauseMs: number;
  msUntilNextHand: number;
  serverOffsetMs: number;
};

function countdownSecondsFromMs(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}

function estimateServerNowMs(serverOffsetMs: number): number {
  return Date.now() + serverOffsetMs;
}

function pokerMasterThinkingDelayMs(): number {
  return (
    POKERMASTER_THINKING_MIN_MS +
    Math.random() * (POKERMASTER_THINKING_MAX_MS - POKERMASTER_THINKING_MIN_MS)
  );
}

type PendingAiJob = {
  generation: number;
  snapshot: StepDemoState;
  pending: StepDemoPendingAi;
};

function applySimulationAnalytics(
  prev: ArenaAnalyticsState,
  result: SimulationResult,
): ArenaAnalyticsState {
  return {
    leaderboard: updateLeaderboardAfterGame(prev.leaderboard, result),
    sessionStats: updateSessionStatsAfterGame(prev.sessionStats, result),
  };
}

export function ArenaShell() {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<GameMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ArenaAnalyticsState>(
    createInitialArenaAnalytics,
  );
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [sessionStacks, setSessionStacks] = useState<SessionStacksState>(
    createInitialSessionStacks,
  );
  const [stacksReady, setStacksReady] = useState(false);
  const [agentBattleStacks, setAgentBattleStacks] =
    useState<AgentBattleStacksState>(createInitialAgentBattleStacks);
  const [agentBattleStacksReady, setAgentBattleStacksReady] = useState(false);
  const [handHistory, setHandHistory] = useState<HandHistoryRecord[]>([]);
  const [handHistoryReady, setHandHistoryReady] = useState(false);
  const lastSimHistoryKeyRef = useRef<string | null>(null);
  const lastStepDemoHistoryKeyRef = useRef<string | null>(null);
  const [preferredSeatLayout, setPreferredSeatLayout] =
    useState<GameMode>("human-vs-ai");
  const [paymentResult, setPaymentResult] = useState<X402PaymentResult | null>(
    null,
  );
  const { address, isConnected, chain } = useAccount();
  const [payingLock, setPayingLock] = useState(false);
  const [payingMock, setPayingMock] = useState(false);
  const [lockStakePhase, setLockStakePhase] = useState<LockStakePhase>("idle");
  const [selectedTestStake, setSelectedTestStake] =
    useState<TestStakeAmount>(DEFAULT_TEST_STAKE);
  const [stakeSessionMeta, setStakeSessionMeta] = useState<StakeSessionMeta | null>(
    null,
  );
  const [cashingOut, setCashingOut] = useState(false);
  const [resolvingEscrow, setResolvingEscrow] = useState(false);
  const [escrowCashOutPhase, setEscrowCashOutPhase] =
    useState<EscrowCashOutPhase | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sessionLog, setSessionLog] = useState<GameAction[]>([]);
  const [stepDemo, setStepDemo] = useState<StepDemoState>(createInitialStepDemoState);
  const stepDemoRef = useRef(stepDemo);
  stepDemoRef.current = stepDemo;
  const [pokerMasterThinking, setPokerMasterThinking] = useState(false);
  const pokerMasterThinkingRef = useRef(false);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkingGenerationRef = useRef(0);
  const pendingAiJobRef = useRef<PendingAiJob | null>(null);
  const transitionLockRef = useRef(false);
  const autoStepTimerRef = useRef(createAutoStepTimerController());
  const autoFlowScheduledKeyRef = useRef<string | null>(null);
  const autoFlowPendingRef = useRef<StepDemoAutoFlowPending | null>(null);
  const clearHumanTurnTimerRef = useRef<(() => void) | null>(null);
  const agentBattleReplayRef = useRef<AgentBattleReplaySession | null>(null);
  const [agentBattleReplay, setAgentBattleReplay] =
    useState<AgentBattleReplaySession | null>(null);
  const [agentBattleLocalFallback, setAgentBattleLocalFallback] = useState(false);
  const [agentBattleSource, setAgentBattleSource] = useState<
    "shared-api" | "local-fallback" | null
  >(null);
  const [agentBattleDebugInfo, setAgentBattleDebugInfo] = useState<{
    handId: string;
    cacheStatus?: string;
    startedAt?: number;
    serverNow?: number;
    timelineSteps?: number;
    communityCards?: string[];
    winner?: string;
  } | null>(null);
  const [watchingSharedAgentBattle, setWatchingSharedAgentBattle] = useState(false);
  const watchingSharedAgentBattleRef = useRef(false);
  const agentBattleLocalFallbackRef = useRef(false);
  const resultRef = useRef<SimulationResult | null>(null);
  const sharedLifecycleRef = useRef<SharedAgentBattleLifecycleState | null>(null);
  const sharedNextHandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharedNextHandScheduledTokenRef = useRef(0);
  const sharedAgentBattleRefreshingRef = useRef(false);
  const sharedCountdownZeroHandledRef = useRef(false);
  const refreshSharedAgentBattleHandRef = useRef<(() => Promise<void>) | null>(
    null,
  );
  const recordedSharedHandIdsRef = useRef<Set<string>>(new Set());
  const lastSharedTransitionHandIdRef = useRef<string | null>(null);
  const [sharedLifecycle, setSharedLifecycle] =
    useState<SharedAgentBattleLifecycleState | null>(null);
  const [sharedNextHandCountdown, setSharedNextHandCountdown] = useState<
    number | null
  >(null);
  agentBattleReplayRef.current = agentBattleReplay;
  resultRef.current = result;
  sharedLifecycleRef.current = sharedLifecycle;
  agentBattleLocalFallbackRef.current = agentBattleLocalFallback;
  watchingSharedAgentBattleRef.current = watchingSharedAgentBattle;
  const lastAutoFlowDebugKeyRef = useRef<string>("");
  const [autoFlowPending, setAutoFlowPending] =
    useState<StepDemoAutoFlowPending | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  autoFlowPendingRef.current = autoFlowPending;

  const clearAutoStepTimers = useCallback(() => {
    autoStepTimerRef.current.clearAutoStepTimers();
  }, []);

  const resetAutoFlowSession = useCallback(() => {
    autoStepTimerRef.current.bumpHandGeneration();
    autoFlowScheduledKeyRef.current = null;
    autoFlowPendingRef.current = null;
    setAutoFlowPending(null);
  }, []);

  const tryStepDemoTransition = useCallback((run: () => void) => {
    if (
      pokerMasterThinkingRef.current ||
      transitionLockRef.current ||
      autoFlowPendingRef.current
    ) {
      return false;
    }
    transitionLockRef.current = true;
    try {
      run();
      return true;
    } finally {
      window.setTimeout(() => {
        transitionLockRef.current = false;
      }, 400);
    }
  }, []);

  const applyStepDemoStackUpdates = useCallback((state: StepDemoState) => {
    const stackUpdates = getStepDemoStackUpdates(state);
    if (stackUpdates) {
      setSessionStacks((stacks) =>
        sanitizeSessionStacks({ ...stacks, ...stackUpdates }),
      );
    }
  }, []);

  const clearPokerMasterThinking = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    pendingAiJobRef.current = null;
    pokerMasterThinkingRef.current = false;
    setPokerMasterThinking(false);
  }, []);

  useEffect(() => () => {
    clearPokerMasterThinking();
    clearAutoStepTimers();
  }, [clearPokerMasterThinking, clearAutoStepTimers]);

  const completePendingAiResponse = useCallback(
    (generation: number, useFallback: boolean) => {
      const job = pendingAiJobRef.current;
      if (!job || job.generation !== generation) return;

      if (responseTimerRef.current) {
        clearTimeout(responseTimerRef.current);
        responseTimerRef.current = null;
      }
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
      pendingAiJobRef.current = null;
      pokerMasterThinkingRef.current = false;
      setPokerMasterThinking(false);

      if (useFallback) {
        console.warn("PokerMaster thinking timeout fallback used");
      }

      setStepDemo(() => {
        const resolved = useFallback
          ? resolveStepDemoPendingAiWithFallback(job.snapshot, job.pending)
          : resolveStepDemoPendingAi(job.snapshot, job.pending);
        applyStepDemoStackUpdates(resolved);
        return resolved;
      });
    },
    [applyStepDemoStackUpdates],
  );

  const schedulePendingAiResponse = useCallback(
    (snapshot: StepDemoState, pending: StepDemoPendingAi) => {
      clearPokerMasterThinking();

      const generation = ++thinkingGenerationRef.current;
      pendingAiJobRef.current = { generation, snapshot, pending };
      pokerMasterThinkingRef.current = true;
      setPokerMasterThinking(true);

      responseTimerRef.current = setTimeout(() => {
        completePendingAiResponse(generation, false);
      }, pokerMasterThinkingDelayMs());

      safetyTimerRef.current = setTimeout(() => {
        completePendingAiResponse(generation, true);
      }, POKERMASTER_THINKING_SAFETY_MS);
    },
    [clearPokerMasterThinking, completePendingAiResponse],
  );

  const isStakeSessionActiveState = isStakeSessionActive(stakeSessionMeta);
  const isStakeCashedOut = isStakeSessionCashedOut(stakeSessionMeta);
  const isArenaUnlocked = isStakeSessionActiveState && paymentResult?.success === true;

  const handInProgress = useMemo(
    () =>
      stepDemo.isActive &&
      stepDemo.step !== "idle" &&
      stepDemo.step !== "result",
    [stepDemo.isActive, stepDemo.step],
  );

  const lockedStartingChips = useMemo(() => {
    return (
      stakeSessionMeta?.startingChips ??
      paymentResult?.chipAmount ??
      getTestStakeTier(selectedTestStake).chipAmount
    );
  }, [stakeSessionMeta, paymentResult, selectedTestStake]);

  const currentHumanChips = useMemo(() => {
    if (stepDemo.isActive && stepDemo.step !== "idle") {
      return stepDemo.players.human.stack;
    }
    return sessionStacks.human ?? 0;
  }, [stepDemo, sessionStacks.human]);

  useEffect(() => {
    const loaded = loadArenaAnalytics();
    if (loaded) {
      setAnalytics(loaded);
    }
    const loadedStacks = loadSessionStacks();
    if (loadedStacks) {
      setSessionStacks(loadedStacks);
    }
    const loadedStakeSession = loadStakeSessionMeta();
    if (loadedStakeSession) {
      setStakeSessionMeta(loadedStakeSession);
      setSelectedTestStake(loadedStakeSession.stakeAmount);
      if (isStakeSessionActive(loadedStakeSession)) {
        setPaymentResult({
          success: true,
          mode: "mock",
          amount: loadedStakeSession.stakeAmount,
          chipAmount: loadedStakeSession.startingChips,
          currency: "USDC",
          network: "base-sepolia",
          paidAt: loadedStakeSession.lockedAt,
          txHash: loadedStakeSession.lockTxHash,
        });
      }
    }
    const loadedAgentBattleStacks = loadAgentBattleStacks();
    if (loadedAgentBattleStacks) {
      setAgentBattleStacks(loadedAgentBattleStacks);
    }
    setAnalyticsReady(true);
    setStacksReady(true);
    setAgentBattleStacksReady(true);
    setHandHistory(loadHandHistory());
    setHandHistoryReady(true);
  }, []);

  useEffect(() => {
    if (!analyticsReady) return;
    saveArenaAnalytics(analytics);
  }, [analytics, analyticsReady]);

  useEffect(() => {
    if (!stacksReady) return;
    saveSessionStacks(sessionStacks);
  }, [sessionStacks, stacksReady]);

  useEffect(() => {
    if (!agentBattleStacksReady) return;
    saveAgentBattleStacks(agentBattleStacks);
  }, [agentBattleStacks, agentBattleStacksReady]);

  useEffect(() => {
    if (!handHistoryReady) return;
    saveHandHistory(handHistory);
  }, [handHistory, handHistoryReady]);

  const commitSimulationHistory = useCallback((simulation: SimulationResult) => {
    if (simulation.gameMode !== "agent-vs-agent") return;
    const key = simulationHistoryFingerprint(simulation);
    if (lastSimHistoryKeyRef.current === key) return;
    lastSimHistoryKeyRef.current = key;
    setHandHistory((prev) =>
      prependHandHistory(prev, createHandHistoryFromSimulation(simulation)),
    );
  }, []);

  const commitSharedAgentBattleHistory = useCallback(
    (simulation: SimulationResult) => {
      if (simulation.gameMode !== "agent-vs-agent") return;
      if (recordedSharedHandIdsRef.current.has(simulation.gameId)) return;
      recordedSharedHandIdsRef.current.add(simulation.gameId);
      const key = simulationHistoryFingerprint(simulation);
      lastSimHistoryKeyRef.current = key;
      setHandHistory((prev) =>
        prependHandHistory(prev, createHandHistoryFromSimulation(simulation)),
      );
    },
    [],
  );

  const clearSharedNextHandTimer = useCallback(() => {
    if (sharedNextHandTimerRef.current != null) {
      clearTimeout(sharedNextHandTimerRef.current);
      sharedNextHandTimerRef.current = null;
    }
  }, []);

  const clearSharedAgentBattleWatch = useCallback(() => {
    watchingSharedAgentBattleRef.current = false;
    setWatchingSharedAgentBattle(false);
    clearSharedNextHandTimer();
    sharedNextHandScheduledTokenRef.current += 1;
    sharedCountdownZeroHandledRef.current = false;
    setSharedLifecycle(null);
    setSharedNextHandCountdown(null);
    lastSharedTransitionHandIdRef.current = null;
  }, [clearSharedNextHandTimer]);

  const clearAgentBattleSpectatorSession = useCallback(() => {
    setAgentBattleReplay(null);
    setAgentBattleLocalFallback(false);
    setAgentBattleSource(null);
    setAgentBattleDebugInfo(null);
    setResult(null);
    clearSharedAgentBattleWatch();
  }, [clearSharedAgentBattleWatch]);

  useEffect(() => {
    if (!result || result.gameMode !== "agent-vs-agent") return;
    if (agentBattleReplay?.status === "playing") return;
    if (watchingSharedAgentBattle) return;
    commitSimulationHistory(result);
  }, [
    result,
    agentBattleReplay?.status,
    watchingSharedAgentBattle,
    commitSimulationHistory,
  ]);

  useEffect(() => {
    const key = stepDemoHistoryFingerprint(stepDemo);
    if (!key) {
      if (!stepDemo.isActive) {
        lastStepDemoHistoryKeyRef.current = null;
      }
      return;
    }
    if (lastStepDemoHistoryKeyRef.current === key) return;
    lastStepDemoHistoryKeyRef.current = key;
    setHandHistory((prev) =>
      prependHandHistory(prev, createHandHistoryFromStepDemo(stepDemo)),
    );
  }, [stepDemo]);

  const scheduleSharedHandRefetch = useCallback(
    (delayMs: number, reason: string) => {
      if (!watchingSharedAgentBattleRef.current) return;

      clearSharedNextHandTimer();
      const token = ++sharedNextHandScheduledTokenRef.current;
      const delay = Math.max(0, delayMs);

      logSharedLifecycleDebug("schedule refetch", { reason, delayMs: delay });

      sharedNextHandTimerRef.current = setTimeout(() => {
        if (sharedNextHandScheduledTokenRef.current !== token) return;
        if (!watchingSharedAgentBattleRef.current) return;
        logSharedLifecycleDebug("refetch timer fired", { reason, token });
        void refreshSharedAgentBattleHandRef.current?.();
      }, delay);
    },
    [clearSharedNextHandTimer],
  );

  const scheduleSharedNextHandRefresh = useCallback(
    (lifecycle: SharedAgentBattleLifecycleState) => {
      const remainingMs = Math.max(
        0,
        lifecycle.nextHandAt -
          estimateServerNowMs(lifecycle.serverOffsetMs),
      );
      const delayMs =
        remainingMs <= 0
          ? SHARED_NEXT_HAND_FETCH_FUDGE_MS
          : remainingMs + SHARED_NEXT_HAND_FETCH_FUDGE_MS;

      scheduleSharedHandRefetch(delayMs, "next-hand-at");
    },
    [scheduleSharedHandRefetch],
  );

  const enterSharedAgentBattleResultPause = useCallback(
    (
      finalResult: SimulationResult,
      lifecycle?: SharedAgentBattleLifecycleState | null,
    ) => {
      setAgentBattleReplay(null);
      setResult(finalResult);
      commitSharedAgentBattleHistory(finalResult);

      if (!lifecycle) {
        logSharedLifecycleDebug("result pause without lifecycle — refetch soon");
        scheduleSharedHandRefetch(
          SHARED_NEXT_HAND_FETCH_FUDGE_MS,
          "missing-lifecycle",
        );
        return;
      }

      const remainingMs = Math.max(
        0,
        lifecycle.nextHandAt - estimateServerNowMs(lifecycle.serverOffsetMs),
      );
      const updatedLifecycle: SharedAgentBattleLifecycleState = {
        ...lifecycle,
        lifecyclePhase: "result_pause",
        msUntilNextHand: remainingMs,
      };
      setSharedLifecycle(updatedLifecycle);
      setSharedNextHandCountdown(countdownSecondsFromMs(remainingMs));
      scheduleSharedNextHandRefresh(updatedLifecycle);
    },
    [commitSharedAgentBattleHistory, scheduleSharedNextHandRefresh, scheduleSharedHandRefetch],
  );

  const applySharedAgentBattlePayload = useCallback(
    (shared: SharedAgentBattleJoinPayload) => {
      setAnalytics((prev) => applySimulationAnalytics(prev, shared.finalResult));
      setError(null);
      setAgentBattleLocalFallback(false);
      setAgentBattleSource("shared-api");
      setAgentBattleDebugInfo({
        handId: shared.handId,
        cacheStatus: shared.cacheStatus,
        startedAt: shared.startedAt,
        serverNow: shared.serverNow,
        timelineSteps: shared.timeline.steps.length,
        communityCards: formatCommunityCardsForDebug(
          shared.finalResult.communityCards,
        ),
        winner: shared.finalResult.winner.name,
      });

      const serverOffsetMs = shared.serverNow - Date.now();
      const lifecycle: SharedAgentBattleLifecycleState = {
        handId: shared.handId,
        lifecyclePhase: shared.lifecyclePhase,
        nextHandAt: shared.nextHandAt,
        resultPauseMs: shared.resultPauseMs,
        msUntilNextHand: shared.msUntilNextHand,
        serverOffsetMs,
      };
      setSharedLifecycle(lifecycle);
      setSharedNextHandCountdown(countdownSecondsFromMs(shared.msUntilNextHand));

      if (shared.handId !== lastSharedTransitionHandIdRef.current) {
        lastSharedTransitionHandIdRef.current = shared.handId;
        sharedCountdownZeroHandledRef.current = false;
        setSessionLog((prev) => [
          ...prev,
          createSessionLogEntry(
            `Shared Agent Battle — hand ${shared.handId.slice(0, 8)}.`,
          ),
        ]);
      }

      if (shared.lifecyclePhase === "result_pause") {
        enterSharedAgentBattleResultPause(shared.finalResult, lifecycle);
        return;
      }

      setResult(null);
      setAgentBattleReplay({
        handId: shared.handId,
        finalResult: shared.finalResult,
        timeline: shared.timeline,
        startedAt: shared.clientStartedAt,
        status: "playing",
        isShared: true,
      });
      scheduleSharedNextHandRefresh(lifecycle);
    },
    [enterSharedAgentBattleResultPause, scheduleSharedNextHandRefresh],
  );

  const refreshSharedAgentBattleHand = useCallback(async () => {
    if (
      !watchingSharedAgentBattleRef.current ||
      agentBattleLocalFallbackRef.current
    ) {
      return;
    }
    if (sharedAgentBattleRefreshingRef.current) return;

    sharedAgentBattleRefreshingRef.current = true;
    try {
      const sharedResult = await fetchSharedAgentBattleCurrent();
      if (!watchingSharedAgentBattleRef.current) return;
      if (!sharedResult.ok) {
        logSharedAgentBattleDebug("shared-api", {
          reason: "refresh-failed",
          detail: sharedResult.reason,
        });
        logSharedLifecycleDebug("refetch failed — retry scheduled", {
          reason: sharedResult.reason,
          detail: sharedResult.detail,
        });
        scheduleSharedHandRefetch(SHARED_SAME_HAND_RETRY_MS, "fetch-failed");
        return;
      }

      const shared = sharedResult.payload;
      const previousHandId =
        agentBattleReplayRef.current?.handId ??
        resultRef.current?.gameId ??
        sharedLifecycleRef.current?.handId ??
        null;

      logSharedLifecycleDebug("refetch result", {
        handId: shared.handId,
        phase: shared.lifecyclePhase,
        msUntilNextHand: shared.msUntilNextHand,
        previousHandId,
      });

      const serverOffsetMs = shared.serverNow - Date.now();
      const lifecycle: SharedAgentBattleLifecycleState = {
        handId: shared.handId,
        lifecyclePhase: shared.lifecyclePhase,
        nextHandAt: shared.nextHandAt,
        resultPauseMs: shared.resultPauseMs,
        msUntilNextHand: shared.msUntilNextHand,
        serverOffsetMs,
      };

      if (
        shared.handId === previousHandId &&
        shared.lifecyclePhase === "result_pause"
      ) {
        setSharedLifecycle(lifecycle);
        setSharedNextHandCountdown(countdownSecondsFromMs(shared.msUntilNextHand));

        if (shared.msUntilNextHand <= 0) {
          logSharedLifecycleDebug("same hand still in result_pause — retry", {
            handId: shared.handId,
          });
          scheduleSharedHandRefetch(
            SHARED_SAME_HAND_RETRY_MS,
            "same-hand-result-expired",
          );
        } else {
          scheduleSharedNextHandRefresh(lifecycle);
        }
        return;
      }

      if (shared.handId === previousHandId) {
        logSharedLifecycleDebug("same hand still playing — reschedule", {
          handId: shared.handId,
        });
        setSharedLifecycle(lifecycle);
        scheduleSharedNextHandRefresh(lifecycle);
        return;
      }

      sharedCountdownZeroHandledRef.current = false;
      applySharedAgentBattlePayload(shared);
    } finally {
      sharedAgentBattleRefreshingRef.current = false;
    }
  }, [
    applySharedAgentBattlePayload,
    scheduleSharedHandRefetch,
    scheduleSharedNextHandRefresh,
  ]);

  refreshSharedAgentBattleHandRef.current = refreshSharedAgentBattleHand;

  useEffect(() => {
    if (
      !watchingSharedAgentBattle ||
      agentBattleLocalFallback ||
      !sharedLifecycle ||
      sharedLifecycle.lifecyclePhase !== "result_pause"
    ) {
      return;
    }

    const tick = () => {
      const remainingMs = Math.max(
        0,
        sharedLifecycle.nextHandAt -
          estimateServerNowMs(sharedLifecycle.serverOffsetMs),
      );
      const seconds = countdownSecondsFromMs(remainingMs);
      setSharedNextHandCountdown(seconds);

      if (
        seconds === 0 &&
        !sharedCountdownZeroHandledRef.current &&
        !sharedAgentBattleRefreshingRef.current
      ) {
        sharedCountdownZeroHandledRef.current = true;
        logSharedLifecycleDebug("countdown reached 0 — refetch now");
        void refreshSharedAgentBattleHandRef.current?.();
      } else if (seconds > 0) {
        sharedCountdownZeroHandledRef.current = false;
      }
    };

    tick();
    const intervalId = setInterval(tick, 250);
    return () => clearInterval(intervalId);
  }, [watchingSharedAgentBattle, agentBattleLocalFallback, sharedLifecycle]);

  useEffect(
    () => () => {
      clearSharedNextHandTimer();
    },
    [clearSharedNextHandTimer],
  );

  const activateStakeSession = useCallback(
    (
      tier: ReturnType<typeof getTestStakeTier>,
      startingChips: number,
      meta: StakeSessionMeta,
      paymentData: X402PaymentResult,
      logMessage: string,
    ) => {
      setPaymentResult(paymentData);
      saveStakeSessionMeta(meta);
      setStakeSessionMeta(meta);
      setSessionStacks((prev) => applyStakeStartingStacks(prev, startingChips));
      setStepDemo(createInitialStepDemoState());
      setResult(null);
      setError(null);
      setSessionLog((prev) => [...prev, createSessionLogEntry(logMessage)]);
    },
    [],
  );

  const lockTestStake = useCallback(
    async (stakeAmount: TestStakeAmount = selectedTestStake) => {
      setPayingLock(true);
      setPaymentError(null);
      setLockStakePhase("idle");

      const tier = getTestStakeTier(stakeAmount);
      const startingChips = tier.chipAmount;
      const onBaseSepolia = isBaseSepolia(chain?.id);

      if (!isConnected || !address) {
        setPaymentError("Connect wallet to lock test stake on Base Sepolia.");
        setPayingLock(false);
        return;
      }

      if (!onBaseSepolia) {
        setPaymentError("Switch to Base Sepolia to lock a test stake.");
        setPayingLock(false);
        return;
      }

      if (!isLockStakePathConfigured()) {
        setPaymentError(
          "Escrow and treasury are not configured — cannot send testnet stake transaction.",
        );
        setPayingLock(false);
        return;
      }

      try {
        const {
          hash,
          lockTxStatus,
          lockSettlement,
          treasuryAddress,
          escrowAddress,
          escrowSessionId,
        } = await sendLockTestStakeTx(
          stakeAmount,
          address,
          chain!.id,
          (phase) => setLockStakePhase(phase),
        );
        const lockedAt = new Date().toISOString();
        const explorerUrl = getBaseSepoliaExplorerTxUrl(hash);
        const meta: StakeSessionMeta = {
          stakeAmount: tier.amount,
          startingChips,
          lockedAt,
          status: "active",
          lockTxHash: hash,
          lockTxStatus,
          lockSettlement,
          treasuryAddress,
          escrowAddress,
          escrowSessionId,
          walletAddress: address,
          explorerUrl,
        };
        const paymentData: X402PaymentResult = {
          success: true,
          mode: "mock",
          txHash: hash,
          amount: tier.amount,
          chipAmount: startingChips,
          currency: "USDC",
          network: "base-sepolia",
          paidAt: lockedAt,
        };

        setLockStakePhase("locked");
        activateStakeSession(
          tier,
          startingChips,
          meta,
          paymentData,
          `Test stake locked on Base Sepolia — ${formatStakeToChipsLine(tier.amount)}. Tx ${hash.slice(0, 10)}…`,
        );
      } catch (err) {
        if (isUserRejectedTransactionError(err)) {
          setLockStakePhase("rejected");
          setPaymentError("Transaction rejected in wallet.");
          setSessionLog((prev) => [
            ...prev,
            createErrorLogEntry("Test stake lock rejected in wallet."),
          ]);
        } else {
          setLockStakePhase("failed");
          const message =
            err instanceof Error ? err.message : "Test stake transaction failed";
          setPaymentError(message);
          setSessionLog((prev) => [...prev, createErrorLogEntry(message)]);
        }
      } finally {
        setPayingLock(false);
      }
    },
    [selectedTestStake, isConnected, chain, address, activateStakeSession],
  );

  const payMockEntryFee = useCallback(
    async (stakeAmount: TestStakeAmount = selectedTestStake) => {
      setPayingMock(true);
      setPaymentError(null);
      setLockStakePhase("idle");

      const tier = getTestStakeTier(stakeAmount);
      const startingChips = tier.chipAmount;

      try {
        const response = await fetch("/api/x402/entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "mock", stakeAmount }),
        });

        const data = (await response.json()) as X402PaymentResult;

        if (!data.success) {
          throw new Error(data.error ?? "Test stake session lock failed");
        }

        const resolvedStartingChips = data.chipAmount ?? startingChips;
        const meta: StakeSessionMeta = {
          stakeAmount: tier.amount,
          startingChips: resolvedStartingChips,
          lockedAt: data.paidAt,
          status: "active",
          lockSettlement: "mock",
          lockTxStatus: "mock",
        };

        activateStakeSession(
          tier,
          resolvedStartingChips,
          meta,
          data,
          `Test stake locked — ${formatStakeToChipsLine(tier.amount)}. Mock test stake lock.`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Test stake session lock failed";
        setPaymentError(message);
        setSessionLog((prev) => [...prev, createErrorLogEntry(message)]);
      } finally {
        setPayingMock(false);
      }
    },
    [selectedTestStake, activateStakeSession],
  );

  const beginNewStakeSession = useCallback(() => {
    clearStakeSessionMeta();
    clearPokerMasterThinking();
    resetAutoFlowSession();
    setStakeSessionMeta(null);
    setPaymentResult(null);
    setPaymentError(null);
    setLockStakePhase("idle");
    setStepDemo(createInitialStepDemoState());
    setSessionStacks(createInitialSessionStacks());
    setResult(null);
    setError(null);
  }, [clearPokerMasterThinking, resetAutoFlowSession]);

  const handleCashOut = useCallback(async () => {
    if (!stakeSessionMeta || !isStakeSessionActive(stakeSessionMeta)) return;
    if (handInProgress) {
      setPaymentError("Finish the current hand before cashing out.");
      return;
    }

    const lockSettlement = stakeSessionMeta.lockSettlement ?? "mock";
    const chips = currentHumanChips;
    const startingChips =
      stakeSessionMeta.startingChips ?? lockedStartingChips;

    if (lockSettlement !== "escrow-deposit" && chips <= 0) {
      setPaymentError("No chips available to cash out.");
      return;
    }

    setCashingOut(true);
    setEscrowCashOutPhase(null);
    setPaymentError(null);

    const finishCashOut = (meta: StakeSessionMeta, logMessage: string) => {
      saveStakeSessionMeta(meta);
      setStakeSessionMeta(meta);
      setPaymentResult(null);
      setStepDemo(createInitialStepDemoState());
      setResult(null);
      setError(null);
      clearPokerMasterThinking();
      resetAutoFlowSession();
      setSessionLog((prev) => [...prev, createSessionLogEntry(logMessage)]);
    };

    try {
      if (lockSettlement === "escrow-deposit") {
        const { meta, logMessage } = await performEscrowCashOut(
          stakeSessionMeta,
          chips,
          startingChips,
          address,
          chain?.id,
          (phase) => setEscrowCashOutPhase(phase),
        );
        finishCashOut(meta, logMessage);
        return;
      }

      if (lockSettlement === "base-sepolia-test-tx") {
        await new Promise((resolve) => setTimeout(resolve, 350));
        const testBalance = chipsToTestBalance(chips);
        const cashOut = createTreasuryCashOutRecord(
          chips,
          testBalance,
          address,
        );
        finishCashOut(
          {
            ...stakeSessionMeta,
            status: "cashed_out",
            cashOut,
          },
          `Treasury session closed — ${chips.toLocaleString()} chips recorded locally. Treasury payout not automated.`,
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
      const testBalance = chipsToTestBalance(chips);
      const cashOut = createMockCashOutRecord(chips, testBalance, address);
      finishCashOut(
        {
          ...stakeSessionMeta,
          status: "cashed_out",
          cashOut,
        },
        `Mock cash out — ${chips.toLocaleString()} chips (${formatTestBalanceAmount(testBalance)}) recorded locally. Receipt ${cashOut.mockWithdrawalId}.`,
      );
    } catch (err) {
      if (isUserRejectedTransactionError(err)) {
        setPaymentError("Transaction rejected in wallet.");
        setSessionLog((prev) => [
          ...prev,
          createErrorLogEntry("Cash-out transaction rejected in wallet."),
        ]);
      } else {
        const message =
          err instanceof Error ? err.message : "Cash-out failed";
        setPaymentError(message);
        setSessionLog((prev) => [...prev, createErrorLogEntry(message)]);
      }
    } finally {
      setCashingOut(false);
      setEscrowCashOutPhase(null);
    }
  }, [
    stakeSessionMeta,
    handInProgress,
    currentHumanChips,
    lockedStartingChips,
    address,
    chain?.id,
    clearPokerMasterThinking,
    resetAutoFlowSession,
  ]);

  const handleResolveEscrow = useCallback(async () => {
    if (!stakeSessionMeta || !isStakeSessionActive(stakeSessionMeta)) return;
    if (stakeSessionMeta.lockSettlement !== "escrow-deposit") return;
    if (!address) {
      setPaymentError("Connect wallet to resolve escrow session.");
      return;
    }
    if (handInProgress) {
      setPaymentError("Finish the current hand before resolving.");
      return;
    }

    setResolvingEscrow(true);
    setPaymentError(null);

    try {
      const startingChips =
        stakeSessionMeta.startingChips ?? lockedStartingChips;
      const updated = await performEscrowResolveOnly(
        stakeSessionMeta,
        currentHumanChips,
        startingChips,
        address,
      );
      saveStakeSessionMeta(updated);
      setStakeSessionMeta(updated);
      setSessionLog((prev) => [
        ...prev,
        createSessionLogEntry(
          `Escrow session #${updated.escrowSessionId} resolved on Base Sepolia. Payout ${updated.escrowPayoutAmount ?? "0"} wei.`,
        ),
      ]);
    } catch (err) {
      if (isUserRejectedTransactionError(err)) {
        setPaymentError("Resolve transaction rejected in wallet.");
      } else {
        const message =
          err instanceof Error ? err.message : "Escrow resolve failed";
        setPaymentError(message);
      }
    } finally {
      setResolvingEscrow(false);
    }
  }, [
    stakeSessionMeta,
    address,
    handInProgress,
    currentHumanChips,
    lockedStartingChips,
  ]);

  const runSimulation = useCallback(
    async (mode: GameMode) => {
      if (!isArenaUnlocked) {
        setError("Lock a test stake session to play.");
        return;
      }

      setLoading(true);
      setLoadingMode(mode);
      setError(null);
      setPreferredSeatLayout(mode);
      setStepDemo(createInitialStepDemoState());

      if (mode === "agent-vs-agent") {
        setAgentBattleReplay(null);
        setResult(null);
        watchingSharedAgentBattleRef.current = true;
        setWatchingSharedAgentBattle(true);
      }

      try {
        const readyAgentBattleStacks = sanitizeAgentBattleStacks(agentBattleStacks);

        if (mode === "agent-vs-agent") {
          const sharedResult = await fetchSharedAgentBattleCurrent();
          if (sharedResult.ok) {
            applySharedAgentBattlePayload(sharedResult.payload);
            return;
          }

          clearSharedAgentBattleWatch();

          logSharedAgentBattleDebug("local-fallback", {
            reason: sharedResult.reason,
            detail: sharedResult.detail,
          });

          if (!canRunAgentBattle(readyAgentBattleStacks)) {
            setError(
              "Local Agent Battle stacks depleted — reset spectator stacks to continue.",
            );
            setLoading(false);
            setLoadingMode(null);
            return;
          }

          setAgentBattleLocalFallback(true);
          setAgentBattleSource("local-fallback");
          const url = `/api/poker/simulate?mode=agent-vs-agent&stacks=${encodeURIComponent(JSON.stringify(readyAgentBattleStacks))}`;
          const response = await fetch(url);
          if (!response.ok) {
            const body = (await response.json()) as { error?: string };
            throw new Error(body.error ?? "Simulation failed");
          }
          const data = (await response.json()) as SimulationResult;
          setAnalytics((prev) => applySimulationAnalytics(prev, data));
          setAgentBattleStacks((prev) =>
            sanitizeAgentBattleStacks(updateAgentBattleStacksAfterHand(prev, data)),
          );
          lastSimHistoryKeyRef.current = null;
          setAgentBattleReplay({
            handId: data.gameId,
            finalResult: data,
            startedAt: Date.now(),
            status: "playing",
            isShared: false,
          });
          setAgentBattleDebugInfo({
            handId: data.gameId,
            timelineSteps: buildAgentBattleReplayTimeline(data).steps.length,
            communityCards: formatCommunityCardsForDebug(data.communityCards),
            winner: data.winner.name,
          });
          setSessionLog((prev) => [
            ...prev,
            createSessionLogEntry(
              "Shared hand unavailable — local Agent Battle simulation.",
            ),
          ]);
          if (process.env.NODE_ENV === "development") {
            logSharedAgentBattleDebug("local-fallback", {
              handId: data.gameId,
              communityCards: formatCommunityCardsForDebug(data.communityCards),
              winner: data.winner.name,
            });
          }
          return;
        }

        const url = `/api/poker/simulate?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Simulation failed");
        }
        const data = (await response.json()) as SimulationResult;
        setAnalytics((prev) => applySimulationAnalytics(prev, data));
        setResult(data);
        setSessionStacks((prev) =>
          sanitizeSessionStacks(updateSessionStacksAfterGame(prev, data)),
        );

        if (process.env.NODE_ENV === "development") {
          console.debug("[arena] simulation result", data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setSessionLog((prev) => [
          ...prev,
          createErrorLogEntry(
            `Simulation failed (${mode === "agent-vs-agent" ? "AI Agent Battle" : "Human vs AI"}): ${message}`,
          ),
        ]);
        console.error("[arena] simulation error", message);
      } finally {
        setLoading(false);
        setLoadingMode(null);
      }
    },
    [isArenaUnlocked, agentBattleStacks, applySharedAgentBattlePayload, clearSharedAgentBattleWatch],
  );

  const handleResetStats = useCallback(() => {
    clearArenaAnalytics();
    clearSessionStacks();
    clearStakeSessionMeta();
    clearAgentBattleStacks();
    clearAgentBattleSpectatorSession();
    setAgentBattleLocalFallback(false);
    setAnalytics(createInitialArenaAnalytics());
    setSessionStacks(createInitialSessionStacks());
    setAgentBattleStacks(createInitialAgentBattleStacks());
    setPaymentResult(null);
    setStakeSessionMeta(null);
    setStepDemo(createInitialStepDemoState());
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Arena stats and stacks reset."),
    ]);
  }, [clearAgentBattleSpectatorSession]);

  const handleClearHandHistory = useCallback(() => {
    clearHandHistoryStorage();
    setHandHistory([]);
    lastSimHistoryKeyRef.current = null;
    lastStepDemoHistoryKeyRef.current = null;
    recordedSharedHandIdsRef.current.clear();
  }, []);

  const handleResetAgentBattleStacks = useCallback(() => {
    if (agentBattleReplay?.isShared || !agentBattleLocalFallback) {
      setSessionLog((prev) => [
        ...prev,
        createSessionLogEntry(
          "Shared spectator stacks are controlled by the live hand.",
        ),
      ]);
      return;
    }
    clearAgentBattleSpectatorSession();
    setAgentBattleStacks(resetAgentBattleStacks());
    setResult(null);
    setError(null);
    setPreferredSeatLayout("agent-vs-agent");
    setAgentBattleLocalFallback(true);
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Local Agent Battle stacks reset."),
    ]);
  }, [agentBattleReplay?.isShared, agentBattleLocalFallback, clearAgentBattleSpectatorSession]);

  const handleSimulateAgentBattle = useCallback(
    () => runSimulation("agent-vs-agent"),
    [runSimulation],
  );

  const handleReturnToHumanVsAi = useCallback(() => {
    clearPokerMasterThinking();
    clearAgentBattleSpectatorSession();
    setPreferredSeatLayout("human-vs-ai");
    setLoading(false);
    setLoadingMode(null);
    setError(null);
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Returned to Human vs AI."),
    ]);
  }, [clearPokerMasterThinking, clearAgentBattleSpectatorSession]);

  const handlePlayStepDemo = useCallback(() => {
    if (pokerMasterThinkingRef.current || transitionLockRef.current) return;
    if (!isArenaUnlocked) {
      setError("Lock a test stake session to play.");
      return;
    }
    const readyStacks = sanitizeSessionStacks(sessionStacks);
    if (!canStartHeadsUpHand(readyStacks)) {
      setError("One player is out of chips — start a new test stake session from the side panel.");
      return;
    }
    clearPokerMasterThinking();
    resetAutoFlowSession();
    clearAgentBattleSpectatorSession();
    setError(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionStacks(readyStacks);
    setStepDemo(dealStepDemoHand(readyStacks));
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Human vs AI — new hand started."),
    ]);
  }, [isArenaUnlocked, sessionStacks, clearPokerMasterThinking, resetAutoFlowSession, clearAgentBattleSpectatorSession]);

  const handleResetDemoStacks = useCallback(() => {
    clearPokerMasterThinking();
    resetAutoFlowSession();
    clearAgentBattleSpectatorSession();
    const startingChips =
      stakeSessionMeta?.startingChips ??
      paymentResult?.chipAmount ??
      getTestStakeTier(selectedTestStake).chipAmount;
    setSessionStacks((prev) => resetHeadsUpDemoStacks(prev, startingChips));
    setStepDemo(createInitialStepDemoState());
    setResult(null);
    setError(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry(
        `Stacks reset to ${startingChips.toLocaleString()} chips (${formatStakeToChipsLine(selectedTestStake)}).`,
      ),
    ]);
  }, [
    clearPokerMasterThinking,
    resetAutoFlowSession,
    clearAgentBattleSpectatorSession,
    stakeSessionMeta,
    paymentResult,
    selectedTestStake,
  ]);

  const agentBattleReplayTimeline = useMemo(() => {
    if (agentBattleReplay?.timeline) {
      return agentBattleReplay.timeline;
    }
    if (agentBattleReplay?.isShared) {
      return null;
    }
    if (agentBattleReplay?.finalResult) {
      return buildAgentBattleReplayTimeline(agentBattleReplay.finalResult);
    }
    return null;
  }, [
    agentBattleReplay?.timeline,
    agentBattleReplay?.isShared,
    agentBattleReplay?.finalResult,
  ]);

  const agentBattleReplayActive = agentBattleReplay?.status === "playing";

  const finishAgentBattleReplay = useCallback(
    (finalResult: SimulationResult) => {
      const session = agentBattleReplayRef.current;
      if (!session || session.status !== "playing") return;

      if (session.isShared && watchingSharedAgentBattleRef.current) {
        enterSharedAgentBattleResultPause(
          finalResult,
          sharedLifecycleRef.current,
        );
        return;
      }

      setAgentBattleReplay(null);
      setResult(finalResult);
      commitSimulationHistory(finalResult);
    },
    [enterSharedAgentBattleResultPause, commitSimulationHistory],
  );

  const handleAgentBattleReplayComplete = useCallback(() => {
    const session = agentBattleReplayRef.current;
    if (!session || session.status !== "playing") return;
    finishAgentBattleReplay(session.finalResult);
  }, [finishAgentBattleReplay]);

  const timelineElapsedMs = useAgentBattleTimelineReplay({
    handId: agentBattleReplay?.handId ?? null,
    playing: agentBattleReplayActive,
    startedAt: agentBattleReplayActive ? agentBattleReplay?.startedAt ?? null : null,
    totalDurationMs: agentBattleReplayTimeline?.totalDurationMs ?? 0,
    onComplete: handleAgentBattleReplayComplete,
  });

  const handleSkipAgentBattleReplay = useCallback(() => {
    const session = agentBattleReplayRef.current;
    if (!session || session.status !== "playing") return;
    finishAgentBattleReplay(session.finalResult);
  }, [finishAgentBattleReplay]);

  const agentBattleReplayDisplay = useMemo(() => {
    if (
      !agentBattleReplay ||
      agentBattleReplay.status !== "playing" ||
      !agentBattleReplayTimeline
    ) {
      return null;
    }
    return deriveAgentBattleReplayDisplayFromTimeline(
      agentBattleReplay.finalResult,
      agentBattleReplayTimeline,
      timelineElapsedMs,
    );
  }, [agentBattleReplay, agentBattleReplayTimeline, timelineElapsedMs]);

  const commitStepDemo = useCallback(
    (updater: (prev: StepDemoState) => StepDemoState) => {
      if (pokerMasterThinkingRef.current) return;
      setStepDemo((prev) => {
        const next = updater(prev);
        applyStepDemoStackUpdates(next);
        return next;
      });
    },
    [applyStepDemoStackUpdates],
  );

  const runHumanActionWithThinking = useCallback(
    (apply: (prev: StepDemoState) => StepDemoHumanActionOutcome) => {
      clearHumanTurnTimerRef.current?.();
      if (
        pokerMasterThinkingRef.current ||
        transitionLockRef.current ||
        autoFlowPendingRef.current
      ) {
        return;
      }

      const outcome = apply(stepDemoRef.current);
      applyStepDemoStackUpdates(outcome.state);
      setStepDemo(outcome.state);

      if (outcome.pendingAi) {
        schedulePendingAiResponse(outcome.state, outcome.pendingAi);
      }
    },
    [applyStepDemoStackUpdates, schedulePendingAiResponse],
  );

  const headsUpStackDepleted = useMemo(
    () => isHeadsUpStackDepleted(sessionStacks),
    [sessionStacks],
  );

  const agentBattleStackDepleted = useMemo(
    () => isAgentBattleStackDepleted(agentBattleStacks),
    [agentBattleStacks],
  );

  const stepDemoUi = useMemo(
    () =>
      deriveStepDemoUiState(stepDemo, {
        pokerMasterThinking,
        headsUpStackDepleted,
        arenaUnlocked: isArenaUnlocked,
        autoFlowPending,
      }),
    [
      stepDemo,
      pokerMasterThinking,
      headsUpStackDepleted,
      isArenaUnlocked,
      autoFlowPending,
    ],
  );

  const stepDemoGuidance = useMemo(
    () => ({
      phase: stepDemoUiBannerPhase(stepDemoUi.state),
      banner: stepDemoUi.banner,
      actionHint: stepDemoUi.actionHint,
      nextStep: stepDemoUi.nextStep ?? undefined,
      autoFlowStatus: stepDemoUi.autoFlowStatus,
    }),
    [stepDemoUi],
  );

  const humanTurnTimerEnabled =
    stepDemo.isActive &&
    stepDemoUi.pokerActionsEnabled &&
    !pokerMasterThinking &&
    !autoFlowPending &&
    !headsUpStackDepleted &&
    stepDemo.step !== "result";

  const humanTurnTimerKey = humanTurnTimerEnabled
    ? `${stepDemo.step}-${stepDemo.street}-${stepDemo.currentBet}-${stepDemo.humanStreetBet}-${stepDemo.turn}`
    : null;

  const handleHumanTurnTimeout = useCallback(() => {
    if (
      pokerMasterThinkingRef.current ||
      transitionLockRef.current ||
      autoFlowPendingRef.current
    ) {
      return;
    }

    clearHumanTurnTimerRef.current?.();

    const current = stepDemoRef.current;
    if (!current.isActive || current.turn !== "human" || current.step === "result") {
      return;
    }

    const actions = getStepDemoHumanActions(current);
    if (resolveHumanTurnTimeoutAction(actions) === "check") {
      const outcome = applyHumanTimeoutCheckWithOutcome(current);
      applyStepDemoStackUpdates(outcome.state);
      setStepDemo(outcome.state);
      if (outcome.pendingAi) {
        schedulePendingAiResponse(outcome.state, outcome.pendingAi);
      }
      return;
    }

    commitStepDemo((prev) => applyHumanTimeoutFold(prev));
  }, [
    applyStepDemoStackUpdates,
    schedulePendingAiResponse,
    commitStepDemo,
  ]);

  const { secondsLeft: humanTurnSecondsLeft, clearTimer: clearHumanTurnTimer } =
    useHumanTurnTimer({
      enabled: humanTurnTimerEnabled,
      turnKey: humanTurnTimerKey,
      onTimeout: handleHumanTurnTimeout,
    });

  clearHumanTurnTimerRef.current = clearHumanTurnTimer;

  const guardedStepDemoUpdate = useCallback(
    (
      action: NonNullable<
        import("@/lib/arena/stepDemo").StepDemoNextStep["action"]
      >,
      updater: (prev: StepDemoState) => StepDemoState,
    ) => {
      tryStepDemoTransition(() => {
        const ui = deriveStepDemoUiState(stepDemoRef.current, {
          pokerMasterThinking: pokerMasterThinkingRef.current,
          headsUpStackDepleted: isHeadsUpStackDepleted(
            sanitizeSessionStacks(sessionStacks),
          ),
          autoFlowPending: autoFlowPendingRef.current,
        });
        if (!canApplyStepDemoTransition(stepDemoRef.current, ui, action)) {
          return;
        }
        commitStepDemo(updater);
      });
    },
    [commitStepDemo, sessionStacks, tryStepDemoTransition],
  );

  const handleNewHand = useCallback(() => {
    tryStepDemoTransition(() => {
      const ui = deriveStepDemoUiState(stepDemoRef.current, {
        pokerMasterThinking: false,
        headsUpStackDepleted: isHeadsUpStackDepleted(sessionStacks),
      });
      if (!ui.newHandEnabled) return;

      clearPokerMasterThinking();
      resetAutoFlowSession();
      const readyStacks = sanitizeSessionStacks(sessionStacks);
      if (!canStartHeadsUpHand(readyStacks)) return;

      setResult(null);
      setPreferredSeatLayout("human-vs-ai");
      setStepDemo(dealStepDemoHand(readyStacks));
      setSessionLog((prev) => [
        ...prev,
        createSessionLogEntry("New hand started."),
      ]);
    });
  }, [
    clearPokerMasterThinking,
    resetAutoFlowSession,
    sessionStacks,
    tryStepDemoTransition,
  ]);

  const handleStepDemoRevealFlop = useCallback(() => {
    guardedStepDemoUpdate("reveal-flop", (prev) => advanceStepDemoRevealFlop(prev));
  }, [guardedStepDemoUpdate]);

  const handleStepDemoRevealTurn = useCallback(() => {
    guardedStepDemoUpdate("reveal-turn", (prev) => advanceStepDemoRevealTurn(prev));
  }, [guardedStepDemoUpdate]);

  const handleStepDemoRevealRiver = useCallback(() => {
    guardedStepDemoUpdate("reveal-river", (prev) => advanceStepDemoRevealRiver(prev));
  }, [guardedStepDemoUpdate]);

  const handleStepDemoShowResult = useCallback(() => {
    guardedStepDemoUpdate("show-result", (prev) => advanceStepDemoShowResult(prev));
  }, [guardedStepDemoUpdate]);

  const handleStepDemoRunoutBoard = useCallback(() => {
    guardedStepDemoUpdate("runout-board", (prev) => advanceStepDemoRunoutBoard(prev));
  }, [guardedStepDemoUpdate]);

  const executeAutoFlowAction = useCallback(
    (pending: StepDemoAutoFlowPending) => {
      autoFlowPendingRef.current = null;
      autoFlowScheduledKeyRef.current = null;
      setAutoFlowPending(null);

      if (pokerMasterThinkingRef.current || transitionLockRef.current) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[Human vs AI auto-flow] timer blocked", {
            pending,
            pokerMasterThinking: pokerMasterThinkingRef.current,
            transitionLock: transitionLockRef.current,
          });
        }
        return;
      }

      const current = stepDemoRef.current;
      if (!canApplyAutoFlowAction(current, pending)) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[Human vs AI auto-flow] apply rejected", {
            pending,
            step: current.step,
            allInShowdown: current.allInShowdown,
            communityCards: current.communityCards.length,
          });
        }
        return;
      }

      transitionLockRef.current = true;
      try {
        switch (pending) {
          case "flop":
            commitStepDemo((prev) => advanceStepDemoRevealFlop(prev));
            break;
          case "turn":
            commitStepDemo((prev) => advanceStepDemoRevealTurn(prev));
            break;
          case "river":
            commitStepDemo((prev) => advanceStepDemoRevealRiver(prev));
            break;
          case "runout-board":
            commitStepDemo((prev) => advanceStepDemoRunoutBoard(prev));
            break;
          case "show-result":
            commitStepDemo((prev) => advanceStepDemoShowResult(prev));
            break;
        }
      } finally {
        window.setTimeout(() => {
          transitionLockRef.current = false;
        }, 400);
      }
    },
    [commitStepDemo],
  );

  const executeAutoFlowActionRef = useRef(executeAutoFlowAction);
  executeAutoFlowActionRef.current = executeAutoFlowAction;

  useLayoutEffect(() => {
    if (!stepDemo.isActive) {
      autoFlowScheduledKeyRef.current = null;
      clearAutoStepTimers();
      autoFlowPendingRef.current = null;
      setAutoFlowPending(null);
      return;
    }

    const nextAction = resolveNextAutoFlowAction(stepDemo, {
      pokerMasterThinking,
      headsUpStackDepleted,
    });

    if (process.env.NODE_ENV !== "production") {
      const snapshot = buildAutoFlowDebugSnapshot(stepDemo, {
        pokerMasterThinking,
        headsUpStackDepleted,
        autoFlowPending,
        scheduledKey: autoFlowScheduledKeyRef.current,
      });
      const debugKey = [
        snapshot.step,
        snapshot.autoFlowStatus,
        snapshot.autoFlowPending ?? "none",
        snapshot.nextAction?.stepKey ?? "none",
        snapshot.blockedReason ?? "scheduled",
        snapshot.scheduledKey ?? "none",
      ].join("|");
      if (debugKey !== lastAutoFlowDebugKeyRef.current) {
        lastAutoFlowDebugKeyRef.current = debugKey;
        console.debug("[Human vs AI auto-flow]", snapshot);
      }
    }

    if (!nextAction) {
      autoFlowScheduledKeyRef.current = null;
      clearAutoStepTimers();
      autoFlowPendingRef.current = null;
      setAutoFlowPending(null);
      return;
    }

    if (autoFlowScheduledKeyRef.current === nextAction.stepKey) {
      autoFlowPendingRef.current = nextAction.pending;
      setAutoFlowPending(nextAction.pending);
      return;
    }

    autoFlowScheduledKeyRef.current = nextAction.stepKey;
    autoFlowPendingRef.current = nextAction.pending;
    setAutoFlowPending(nextAction.pending);

    autoStepTimerRef.current.scheduleAutoStep(() => {
      executeAutoFlowActionRef.current(nextAction.pending);
    }, nextAction.delayMs, nextAction.stepKey);
  }, [
    stepDemo,
    stepDemo.isActive,
    stepDemo.step,
    stepDemo.allInShowdown,
    stepDemo.communityCards.length,
    pokerMasterThinking,
    headsUpStackDepleted,
    autoFlowPending,
    clearAutoStepTimers,
  ]);

  const handleHumanFold = useCallback(() => {
    clearHumanTurnTimerRef.current?.();
    if (
      pokerMasterThinkingRef.current ||
      transitionLockRef.current ||
      autoFlowPendingRef.current
    ) {
      return;
    }
    commitStepDemo((prev) => applyHumanFold(prev));
  }, [commitStepDemo]);

  const handleHumanCall = useCallback(() => {
    runHumanActionWithThinking((prev) => applyHumanCallWithOutcome(prev));
  }, [runHumanActionWithThinking]);

  const handleHumanCheck = useCallback(() => {
    runHumanActionWithThinking((prev) => applyHumanCheckWithOutcome(prev));
  }, [runHumanActionWithThinking]);

  const handleHumanRaise = useCallback(
    (size: StepDemoRaiseSize) => {
      runHumanActionWithThinking((prev) => applyHumanRaiseWithOutcome(prev, size));
    },
    [runHumanActionWithThinking],
  );

  const handleHumanAllIn = useCallback(() => {
    runHumanActionWithThinking((prev) => applyHumanAllInWithOutcome(prev));
  }, [runHumanActionWithThinking]);

  const stepDemoHumanCallAmount = useMemo(
    () => getStepDemoHumanCallAmount(stepDemo),
    [stepDemo],
  );

  const activeGameMode = stepDemo.isActive
    ? "human-vs-ai"
    : (result?.gameMode ??
      agentBattleReplay?.finalResult.gameMode ??
      preferredSeatLayout);
  const isHeadsUpGuided = activeGameMode === "human-vs-ai";

  const seats = useMemo(() => {
    if (isHeadsUpGuided) {
      return buildStepDemoSeats(stepDemo, sessionStacks);
    }
    if (agentBattleReplayDisplay && agentBattleReplay?.finalResult) {
      const replayStacks = agentBattleReplay.isShared
        ? sanitizeAgentBattleStacks(
            agentBattleReplay.finalResult.agentBattleAccounting?.startingStacks ??
              createInitialAgentBattleStacks(),
          )
        : agentBattleStacks;
      return buildAgentBattleReplaySeats(
        agentBattleReplay.finalResult,
        agentBattleReplayDisplay,
        replayStacks,
      );
    }
    return buildTableSeats(
      result,
      preferredSeatLayout,
      isHeadsUpGuided || activeGameMode === "agent-vs-agent"
        ? activeGameMode === "agent-vs-agent"
          ? agentBattleStacks
          : undefined
        : sessionStacks,
    );
  }, [
    stepDemo,
    result,
    preferredSeatLayout,
    sessionStacks,
    agentBattleStacks,
    isHeadsUpGuided,
    activeGameMode,
    agentBattleReplayDisplay,
    agentBattleReplay?.finalResult,
    agentBattleReplay?.isShared,
  ]);

  const aiDecisions = result?.agentDecisions ?? [];
  const isAgentBattleSpectatorEarly =
    activeGameMode === "agent-vs-agent" && !isHeadsUpGuided;
  const agentBattleSharedSpectator =
    isAgentBattleSpectatorEarly && !agentBattleLocalFallback;
  const agentBattleWatchingShared =
    watchingSharedAgentBattle && !agentBattleLocalFallback;
  const agentBattleSharedResultPause =
    agentBattleWatchingShared &&
    sharedLifecycle?.lifecyclePhase === "result_pause" &&
    !agentBattleReplayActive;

  const agentBattleHandSettled =
    isAgentBattleSpectatorEarly &&
    !stepDemo.isActive &&
    (agentBattleSharedResultPause ||
      agentBattleReplayDisplay?.showResult === true ||
      (result != null && !agentBattleReplayActive && !agentBattleReplayDisplay));

  const latestAiDecision = agentBattleHandSettled
    ? undefined
    : stepDemo.isActive
      ? (stepDemo.aiDecision ?? undefined)
      : agentBattleReplayDisplay?.latestDecision
        ? agentBattleReplayDisplay.latestDecision
        : isAgentBattleSpectatorEarly && aiDecisions.length > 0
          ? pickLatestAgentBattleDecision(aiDecisions)
          : aiDecisions[aiDecisions.length - 1];
  const agentBattleThinking =
    !agentBattleHandSettled &&
    agentBattleReplayDisplay?.thinkingAgentId != null &&
    agentBattleReplayDisplay.thinkingAgentName != null;
  const agentBattleThinkingLabel = agentBattleThinking
    ? `${agentBattleReplayDisplay!.thinkingAgentName} thinking...`
    : undefined;

  const hidePrivatePokerMasterInfo =
    stepDemo.isActive &&
    isHeadsUpGuided &&
    !shouldRevealPokerMasterHandContext(stepDemo);

  const handResultType = stepDemo.isActive
    ? stepDemo.winner
      ? stepDemo.winningHandName === "Win by fold"
        ? "fold"
        : "showdown"
      : undefined
    : agentBattleReplayDisplay?.showResult
      ? agentBattleReplayDisplay.resultType
      : result
        ? getHandResultDisplayType(result)
        : undefined;
  const showdownHandName = stepDemo.isActive
    ? stepDemo.winningHandName === "Win by fold"
      ? undefined
      : (stepDemo.winningHandName ?? undefined)
    : agentBattleReplayDisplay?.showResult
      ? agentBattleReplayDisplay.winningHand
      : result && !isWinByFoldResult(result)
        ? resolveSimulationWinningHandName(result)
        : undefined;

  const tablePot = isHeadsUpGuided
    ? getStepDemoPotDisplay(stepDemo)
    : agentBattleReplayDisplay
      ? agentBattleReplayDisplay.pot
      : (result?.pot ?? null);

  const agentBattleVisibleBoardCount = useMemo(() => {
    if (!isAgentBattleSpectatorEarly) return undefined;

    if (agentBattleReplayDisplay?.showResult || agentBattleSharedResultPause) {
      return 5;
    }

    if (agentBattleReplayDisplay) {
      return getVisibleBoardCount({
        visibleCount: agentBattleReplayDisplay.communityCards.length,
        status: "playing",
      });
    }

    if (agentBattleReplayActive) {
      return 0;
    }

    if (result && !agentBattleReplay) {
      return 5;
    }

    return 0;
  }, [
    isAgentBattleSpectatorEarly,
    agentBattleReplayDisplay,
    agentBattleSharedResultPause,
    agentBattleReplayActive,
    agentBattleReplay,
    result,
  ]);

  const agentBattleTableCommunityCards = useMemo(() => {
    if (isHeadsUpGuided) {
      return stepDemo.communityCards.slice(0, 5);
    }

    if (!isAgentBattleSpectatorEarly) {
      return result?.communityCards?.slice(0, 5) ?? [];
    }

    const fullBoard =
      agentBattleReplay?.finalResult.communityCards ??
      result?.communityCards ??
      [];
    return fullBoard.slice(0, 5);
  }, [
    isHeadsUpGuided,
    stepDemo.communityCards,
    isAgentBattleSpectatorEarly,
    agentBattleReplay?.finalResult.communityCards,
    result?.communityCards,
  ]);

  const isAgentBattleSpectator = isAgentBattleSpectatorEarly;

  const actionLogEntries = useMemo(
    () =>
      stepDemo.isActive
        ? stepDemo.actionLog
        : agentBattleReplayDisplay
          ? [...sessionLog, ...agentBattleReplayDisplay.visibleActionLog]
          : [...sessionLog, ...(result?.actionLog ?? [])],
    [
      sessionLog,
      result?.actionLog,
      stepDemo.isActive,
      stepDemo.actionLog,
      agentBattleReplayDisplay,
    ],
  );

  const sharedAgentBattleStatusActive =
    isAgentBattleSpectatorEarly &&
    !stepDemo.isActive &&
    (watchingSharedAgentBattle ||
      agentBattleLocalFallback ||
      agentBattleReplay != null ||
      (result?.gameMode === "agent-vs-agent" && result != null));

  const sharedAgentBattleStatusSource = agentBattleLocalFallback
    ? ("local" as const)
    : agentBattleWatchingShared || agentBattleSharedSpectator
      ? ("shared" as const)
      : null;

  const sharedAgentBattleStatusPhase = agentBattleSharedResultPause
    ? ("result_pause" as const)
    : agentBattleReplayActive
      ? ("playing" as const)
      : sharedLifecycle?.lifecyclePhase ?? null;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !agentBattleDebugInfo) return;
    console.debug("[arena/shared-agent-battle/status]", {
      source: agentBattleSource,
      handId: agentBattleDebugInfo.handId,
      cacheStatus: agentBattleDebugInfo.cacheStatus,
      phase: sharedAgentBattleStatusPhase,
      secondsUntilNextHand: sharedNextHandCountdown,
    });
  }, [
    agentBattleSource,
    agentBattleDebugInfo,
    sharedAgentBattleStatusPhase,
    sharedNextHandCountdown,
  ]);

  return (
    <div className="arena-shell arena-shell-v1 relative bg-[var(--arena-bg)]">
      <div className="arena-v1-atmosphere" aria-hidden />

      <header className="arena-header-bar relative z-20 shrink-0 border-b border-[var(--arena-border)] bg-[var(--arena-surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-2 px-3 sm:px-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-[var(--arena-muted)] hover:bg-[var(--arena-surface-2)] hover:text-[var(--arena-text)]"
          >
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Lobby
            </Link>
          </Button>

          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-90"
          >
            <BrandMark size={28} />
            <p className="text-center">
              <span className="arena-title-short text-[10px] font-bold uppercase tracking-[0.2em] text-gradient-arena">
                Arena
              </span>
              <span className="arena-title-full hidden text-xs font-bold uppercase tracking-[0.18em] text-gradient-arena sm:inline">
                Poker AI Arena
              </span>
            </p>
          </Link>

          <ConnectWalletButton size="sm" showDemoHint={false} className="v1-button-secondary !h-9 !px-3 !text-xs" />
        </div>
      </header>

      <div className="arena-badge-bar relative z-10 shrink-0 border-b border-[var(--arena-border)] bg-[var(--arena-surface)]/60 px-2 py-1.5 sm:px-3">
        <div className="arena-badge-strip">
          <Badge
            variant="outline"
            className="shrink-0 gap-1 border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 text-[10px] text-[var(--arena-cyan)] sm:text-xs"
          >
            <Sparkles className="h-3 w-3 shrink-0" />
            <span className="max-w-[7.5rem] truncate sm:max-w-none">
              {isStakeCashedOut ? (
                <>
                  <span className="sm:hidden">Cashed out</span>
                  <span className="hidden sm:inline">Test balance cashed out</span>
                </>
              ) : isArenaUnlocked ? (
                <>
                  <span className="sm:hidden">Staked</span>
                  <span className="hidden sm:inline">Test stake session active</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Lock stake</span>
                  <span className="hidden sm:inline">Lock test stake to play</span>
                </>
              )}
            </span>
          </Badge>
          {result && !stepDemo.isActive && !agentBattleReplayActive ? (
            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
              Hand #{result.handNumber}
            </Badge>
          ) : agentBattleReplay?.finalResult ? (
            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
              Hand #{agentBattleReplay.finalResult.handNumber}
            </Badge>
          ) : null}
          <SharedAgentBattleStatus
            active={sharedAgentBattleStatusActive}
            source={sharedAgentBattleStatusSource}
            lifecyclePhase={sharedAgentBattleStatusPhase}
            secondsUntilNextHand={sharedNextHandCountdown}
          />
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1 border-[var(--arena-border)] bg-[var(--arena-surface-2)]/80 text-[10px] text-[var(--arena-text)] sm:text-xs",
              activeGameMode === "agent-vs-agent" && "border-[var(--arena-cyan)]/40 text-[var(--arena-cyan)]",
            )}
          >
            {activeGameMode === "agent-vs-agent" ? (
              <Swords className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            {gameModeLabel(activeGameMode)}
          </Badge>
          {analytics.sessionStats.totalGames > 0 ? (
            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
              <span className="max-sm:hidden sm:inline md:hidden">
                {analytics.sessionStats.totalGames} games
              </span>
              <span className="sm:hidden">{analytics.sessionStats.totalGames}g</span>
              <span className="hidden md:inline">
                {analytics.sessionStats.totalGames} games tracked
              </span>
            </Badge>
          ) : null}
          {!isArenaUnlocked && !isStakeCashedOut ? (
            <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
              Test stake required
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="arena-main-grid">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden arena-table-column">
          <div className="arena-table-stage">
            <div className="arena-table-stage-inner">
              <PokerTable
                className="arena-table-surface"
                roomLayout
                onLockStake={() => lockTestStake(selectedTestStake)}
                onPayMock={() => payMockEntryFee(selectedTestStake)}
                onBeginNewStakeSession={beginNewStakeSession}
                payingLockStake={payingLock}
                payingMockStake={payingMock}
                lockStakePhase={lockStakePhase}
                paymentError={paymentError}
                selectedTestStake={selectedTestStake}
                onTestStakeChange={setSelectedTestStake}
                stakeCashedOut={isStakeCashedOut}
                cashOutRecord={stakeSessionMeta?.cashOut ?? null}
                pot={tablePot}
                communityCards={agentBattleTableCommunityCards}
                agentBattleVisibleBoardCount={agentBattleVisibleBoardCount}
                seats={seats}
                winnerName={
                  stepDemo.isActive
                    ? stepDemo.winner?.name
                    : agentBattleReplayDisplay?.showResult
                      ? agentBattleReplayDisplay.winnerName
                      : isAgentBattleSpectator && result
                        ? result.winner.name
                        : undefined
                }
                winningHand={showdownHandName}
                resultType={handResultType}
                locked={!isArenaUnlocked}
                fourPlayerLayout={isAgentBattleSpectator}
                spectatorMode={isAgentBattleSpectator}
                agentBattleMode={isAgentBattleSpectator}
                headsUpGuidedMode={isHeadsUpGuided}
                showHumanVsAiBadge={stepDemo.isActive}
                humanTurnSecondsLeft={
                  isHeadsUpGuided && stepDemo.isActive ? humanTurnSecondsLeft : null
                }
              />
            </div>
          </div>
        </div>

        <aside className="arena-sidebar">
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
            <div className="flex min-h-0 flex-col gap-1.5">
              <EntryFeePanel
                compact
                className="min-h-0 shrink-0"
                paymentResult={paymentResult}
                stakeSessionMeta={stakeSessionMeta}
                onLockStake={lockTestStake}
                onPayMock={payMockEntryFee}
                onBeginNewStakeSession={beginNewStakeSession}
                onCashOut={handleCashOut}
                onResolveEscrow={handleResolveEscrow}
                payingLock={payingLock}
                payingMock={payingMock}
                lockStakePhase={lockStakePhase}
                cashingOut={cashingOut}
                resolvingEscrow={resolvingEscrow}
                escrowCashOutPhase={escrowCashOutPhase}
                error={paymentError}
                selectedStake={selectedTestStake}
                onStakeChange={setSelectedTestStake}
                startingChips={lockedStartingChips}
                currentHumanChips={currentHumanChips}
                handInProgress={handInProgress}
              />
              {isArenaUnlocked ? (
                <AiDecisionPanel
                  compact
                  latest={latestAiDecision}
                  handSettled={agentBattleHandSettled}
                  settledWinnerName={
                    agentBattleHandSettled
                      ? agentBattleReplayDisplay?.winnerName ?? result?.winner.name
                      : undefined
                  }
                  settledWinningHand={agentBattleHandSettled ? showdownHandName : undefined}
                  settledResultType={agentBattleHandSettled ? handResultType : undefined}
                  guidedHand={stepDemo.isActive}
                  hidePrivateHandInfo={hidePrivatePokerMasterInfo}
                  thinking={pokerMasterThinking || agentBattleThinking}
                  thinkingLabel={agentBattleThinkingLabel}
                  spectatorMode={isAgentBattleSpectator}
                  humanCallAmount={
                    stepDemo.isActive ? stepDemoHumanCallAmount : undefined
                  }
                  totalDecisions={
                    stepDemo.isActive
                      ? stepDemo.aiDecision
                        ? 1
                        : 0
                      : agentBattleReplayDisplay
                        ? agentBattleReplayDisplay.visibleDecisionCount
                        : aiDecisions.length
                  }
                />
              ) : null}
            </div>
          </div>
          <ArenaMenuTrigger
            onClick={() => setMenuOpen(true)}
            className="mt-1.5 w-full shrink-0"
            compact
          />
        </aside>
      </div>

      <ArenaActionBar
        className="relative z-30 shrink-0"
        onSimulateAgentBattle={handleSimulateAgentBattle}
        onReturnToHumanVsAi={handleReturnToHumanVsAi}
        onPlayStepDemo={handlePlayStepDemo}
        onResetDemoStacks={handleResetDemoStacks}
        onOpenMenu={() => setMenuOpen(true)}
        stepDemoActive={stepDemo.isActive}
        stepDemoUi={isHeadsUpGuided ? stepDemoUi : undefined}
        stepDemoGuidance={stepDemo.isActive ? stepDemoGuidance : undefined}
        onStepDemoReset={handleNewHand}
        onRevealFlop={handleStepDemoRevealFlop}
        onRevealTurn={handleStepDemoRevealTurn}
        onRevealRiver={handleStepDemoRevealRiver}
        onRunoutBoard={handleStepDemoRunoutBoard}
        onShowResult={handleStepDemoShowResult}
        onHumanFold={handleHumanFold}
        onHumanCall={handleHumanCall}
        onHumanCheck={handleHumanCheck}
        onHumanRaise={handleHumanRaise}
        onHumanAllIn={handleHumanAllIn}
        pokerMasterThinking={pokerMasterThinking}
        loading={loading}
        loadingMode={loadingMode}
        disabled={!isArenaUnlocked}
        disabledReason={
          !isArenaUnlocked
            ? "Lock a test stake session to play."
            : undefined
        }
        error={error}
        headsUpStackDepleted={headsUpStackDepleted}
        agentBattleStackDepleted={agentBattleStackDepleted}
        agentBattleLocalFallback={agentBattleLocalFallback}
        agentBattleSharedSpectator={agentBattleSharedSpectator}
        agentBattleWatchingShared={agentBattleWatchingShared}
        agentBattleSharedResultPause={agentBattleSharedResultPause}
        onResetAgentBattleStacks={handleResetAgentBattleStacks}
        agentBattleSpectator={isAgentBattleSpectator && !stepDemo.isActive}
        agentBattleHasResult={
          isAgentBattleSpectator &&
          !stepDemo.isActive &&
          !agentBattleReplayActive &&
          result != null
        }
        agentBattleReplayActive={agentBattleReplayActive}
        onSkipAgentBattleReplay={handleSkipAgentBattleReplay}
        agentBattleActionHint={agentBattleThinkingLabel}
        humanTurnSecondsLeft={
          isHeadsUpGuided && stepDemo.isActive ? humanTurnSecondsLeft : null
        }
      />

      <ArenaMenuDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        actionLogEntries={actionLogEntries}
        agentBattleMode={isAgentBattleSpectator && !stepDemo.isActive}
        leaderboardEntries={analytics.leaderboard}
        highlightId={stepDemo.winner?.id ?? result?.winner.id}
        sessionStats={analytics.sessionStats}
        sessionStatus={isArenaUnlocked ? "unlocked" : "locked"}
        paymentMode={paymentResult?.mode ?? null}
        entryFee={paymentResult?.amount ?? stakeSessionMeta?.stakeAmount ?? "0.25"}
        onResetStats={handleResetStats}
        handHistoryEntries={handHistory}
        onClearHandHistory={handleClearHandHistory}
        isArenaUnlocked={isArenaUnlocked}
        latestAiDecision={latestAiDecision}
        hidePrivateHandInfo={hidePrivatePokerMasterInfo}
        aiThinking={pokerMasterThinking || agentBattleThinking}
        aiThinkingLabel={agentBattleThinkingLabel}
        spectatorMode={isAgentBattleSpectator}
        guidedHand={stepDemo.isActive}
        handSettled={agentBattleHandSettled}
        settledWinnerName={
          agentBattleHandSettled
            ? agentBattleReplayDisplay?.winnerName ?? result?.winner.name
            : undefined
        }
        settledWinningHand={agentBattleHandSettled ? showdownHandName : undefined}
        settledResultType={agentBattleHandSettled ? handResultType : undefined}
        humanCallAmount={
          stepDemo.isActive ? stepDemoHumanCallAmount : undefined
        }
        totalDecisions={
          stepDemo.isActive
            ? stepDemo.aiDecision
              ? 1
              : 0
            : agentBattleReplayDisplay
              ? agentBattleReplayDisplay.visibleDecisionCount
              : aiDecisions.length
        }
        stakeSessionActive={isArenaUnlocked}
        stakeCashedOut={isStakeCashedOut}
        currentHumanChips={currentHumanChips}
        startingChips={lockedStartingChips}
        stakeAmount={
          stakeSessionMeta?.stakeAmount ?? paymentResult?.amount ?? selectedTestStake
        }
        lockSettlement={stakeSessionMeta?.lockSettlement ?? "mock"}
        handInProgress={handInProgress}
        cashingOut={cashingOut}
        payingStake={payingLock || payingMock}
        onCashOut={handleCashOut}
      />
    </div>
  );
}
