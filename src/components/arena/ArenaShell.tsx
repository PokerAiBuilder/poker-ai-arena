"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Sparkles, Swords, Users } from "lucide-react";
import { ArenaActionBar } from "@/components/arena/ArenaActionBar";
import { ArenaMenuDrawer, ArenaMenuTrigger } from "@/components/arena/ArenaMenuDrawer";
import { AiDecisionPanel } from "@/components/arena/AiDecisionPanel";
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
  applyHumanRaiseWithOutcome,
  buildStepDemoSeats,
  createInitialStepDemoState,
  dealStepDemoHand,
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
  getHandResultDisplayType,
  isWinByFoldResult,
  pickLatestAgentBattleDecision,
} from "@/lib/arena/simulationDisplay";
import type { X402PaymentResult } from "@/lib/bankr/x402Client";
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
  const [paying, setPaying] = useState(false);
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
  const [menuOpen, setMenuOpen] = useState(false);

  const tryStepDemoTransition = useCallback((run: () => void) => {
    if (pokerMasterThinkingRef.current || transitionLockRef.current) return false;
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

  useEffect(() => () => clearPokerMasterThinking(), [clearPokerMasterThinking]);

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

  const isArenaUnlocked = paymentResult?.success === true;

  useEffect(() => {
    const loaded = loadArenaAnalytics();
    if (loaded) {
      setAnalytics(loaded);
    }
    const loadedStacks = loadSessionStacks();
    if (loadedStacks) {
      setSessionStacks(loadedStacks);
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

  useEffect(() => {
    if (!result || result.gameMode !== "agent-vs-agent") return;
    const key = simulationHistoryFingerprint(result);
    if (lastSimHistoryKeyRef.current === key) return;
    lastSimHistoryKeyRef.current = key;
    setHandHistory((prev) =>
      prependHandHistory(prev, createHandHistoryFromSimulation(result)),
    );
  }, [result]);

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

  const payEntryFee = useCallback(async () => {
    setPaying(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/x402/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mock" }),
      });

      const data = (await response.json()) as X402PaymentResult;

      if (!data.success) {
        throw new Error(data.error ?? "Payment failed");
      }

      setPaymentResult(data);
      setSessionLog((prev) => [
        ...prev,
        createSessionLogEntry(
          `Demo session started (${data.amount} USDC demo access).`,
        ),
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setPaymentError(message);
      setSessionLog((prev) => [...prev, createErrorLogEntry(message)]);
    } finally {
      setPaying(false);
    }
  }, []);

  const runSimulation = useCallback(
    async (mode: GameMode) => {
      if (!isArenaUnlocked) {
        setError("Start demo session to play.");
        return;
      }

      setLoading(true);
      setLoadingMode(mode);
      setError(null);
      setPreferredSeatLayout(mode);
      setStepDemo(createInitialStepDemoState());

      if (mode === "agent-vs-agent") {
        const readyAgentBattleStacks = sanitizeAgentBattleStacks(agentBattleStacks);
        if (!canRunAgentBattle(readyAgentBattleStacks)) {
          setError(
            "Agent Battle stacks depleted — reset spectator stacks to continue.",
          );
          setLoading(false);
          setLoadingMode(null);
          return;
        }
      }

      try {
        const readyAgentBattleStacks = sanitizeAgentBattleStacks(agentBattleStacks);
        const url =
          mode === "agent-vs-agent"
            ? `/api/poker/simulate?mode=agent-vs-agent&stacks=${encodeURIComponent(JSON.stringify(readyAgentBattleStacks))}`
            : `/api/poker/simulate?mode=${mode}`;
        const response = await fetch(url);
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Simulation failed");
        }
        const data = (await response.json()) as SimulationResult;
        setResult(data);
        setAnalytics((prev) => applySimulationAnalytics(prev, data));
        if (mode === "agent-vs-agent") {
          setAgentBattleStacks((prev) =>
            sanitizeAgentBattleStacks(updateAgentBattleStacksAfterHand(prev, data)),
          );
        } else {
          setSessionStacks((prev) =>
            sanitizeSessionStacks(updateSessionStacksAfterGame(prev, data)),
          );
        }

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
    [isArenaUnlocked, agentBattleStacks],
  );

  const handleResetStats = useCallback(() => {
    clearArenaAnalytics();
    clearSessionStacks();
    clearAgentBattleStacks();
    setAnalytics(createInitialArenaAnalytics());
    setSessionStacks(createInitialSessionStacks());
    setAgentBattleStacks(createInitialAgentBattleStacks());
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Arena stats and demo stacks reset."),
    ]);
  }, []);

  const handleClearHandHistory = useCallback(() => {
    clearHandHistoryStorage();
    setHandHistory([]);
    lastSimHistoryKeyRef.current = null;
    lastStepDemoHistoryKeyRef.current = null;
  }, []);

  const handleResetAgentBattleStacks = useCallback(() => {
    setAgentBattleStacks(resetAgentBattleStacks());
    setResult(null);
    setError(null);
    setPreferredSeatLayout("agent-vs-agent");
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Agent Battle stacks reset."),
    ]);
  }, []);

  const handleSimulateAgentBattle = useCallback(
    () => runSimulation("agent-vs-agent"),
    [runSimulation],
  );

  const handlePlayStepDemo = useCallback(() => {
    if (pokerMasterThinkingRef.current || transitionLockRef.current) return;
    if (!isArenaUnlocked) {
      setError("Start demo session to play.");
      return;
    }
    const readyStacks = sanitizeSessionStacks(sessionStacks);
    if (!canStartHeadsUpHand(readyStacks)) {
      setError("One player is out of chips — reset demo stacks to continue.");
      return;
    }
    clearPokerMasterThinking();
    setError(null);
    setResult(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionStacks(readyStacks);
    setStepDemo(dealStepDemoHand(readyStacks));
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Human vs AI — new hand started."),
    ]);
  }, [isArenaUnlocked, sessionStacks, clearPokerMasterThinking]);

  const handleResetDemoStacks = useCallback(() => {
    clearPokerMasterThinking();
    setSessionStacks((prev) => resetHeadsUpDemoStacks(prev));
    setStepDemo(createInitialStepDemoState());
    setResult(null);
    setError(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Demo stacks reset."),
    ]);
  }, [clearPokerMasterThinking]);

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
      if (pokerMasterThinkingRef.current || transitionLockRef.current) return;

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
      }),
    [stepDemo, pokerMasterThinking, headsUpStackDepleted, isArenaUnlocked],
  );

  const stepDemoGuidance = useMemo(
    () => ({
      phase: stepDemoUiBannerPhase(stepDemoUi.state),
      banner: stepDemoUi.banner,
      actionHint: stepDemoUi.actionHint,
      nextStep: stepDemoUi.nextStep ?? undefined,
    }),
    [stepDemoUi],
  );

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

  const handleHumanFold = useCallback(() => {
    if (pokerMasterThinkingRef.current || transitionLockRef.current) return;
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
    : (result?.gameMode ?? preferredSeatLayout);
  const isHeadsUpGuided = activeGameMode === "human-vs-ai";

  const seats = useMemo(() => {
    if (isHeadsUpGuided) {
      return buildStepDemoSeats(stepDemo, sessionStacks);
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
  }, [stepDemo, result, preferredSeatLayout, sessionStacks, agentBattleStacks, isHeadsUpGuided, activeGameMode]);

  const aiDecisions = result?.agentDecisions ?? [];
  const isAgentBattleSpectatorEarly =
    activeGameMode === "agent-vs-agent" && !isHeadsUpGuided;
  const latestAiDecision = stepDemo.isActive
    ? (stepDemo.aiDecision ?? undefined)
    : isAgentBattleSpectatorEarly && aiDecisions.length > 0
      ? pickLatestAgentBattleDecision(aiDecisions)
      : aiDecisions[aiDecisions.length - 1];

  const headsUpLayoutKey = isHeadsUpGuided
    ? `${stepDemo.step}-${stepDemo.isActive}-${stepDemo.communityCards.length}-${stepDemo.players.pokerMaster.holeCards.length}-${stepDemo.players.human.holeCards.length}`
    : undefined;

  const handResultType = stepDemo.isActive
    ? stepDemo.winner
      ? stepDemo.winningHandName === "Win by fold"
        ? "fold"
        : "showdown"
      : undefined
    : result
      ? getHandResultDisplayType(result)
      : undefined;
  const showdownHandName = stepDemo.isActive
    ? stepDemo.winningHandName === "Win by fold"
      ? undefined
      : (stepDemo.winningHandName ?? undefined)
    : result && !isWinByFoldResult(result)
      ? result.winningHand.rankName
      : undefined;

  const tablePot = isHeadsUpGuided
    ? getStepDemoPotDisplay(stepDemo)
    : (result?.pot ?? null);

  const isAgentBattleSpectator = isAgentBattleSpectatorEarly;

  const actionLogEntries = useMemo(
    () =>
      stepDemo.isActive
        ? stepDemo.actionLog
        : [...sessionLog, ...(result?.actionLog ?? [])],
    [sessionLog, result?.actionLog, stepDemo.isActive, stepDemo.actionLog],
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#030305]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(13,92,54,0.12),transparent_50%)]" />

      <header className="relative z-20 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Lobby
            </Link>
          </Button>

          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-casino-goldLight">
              POKER AI ARENA
            </p>
          </div>

          <ConnectWalletButton size="sm" />
        </div>
      </header>

      <div className="relative z-10 shrink-0 border-b border-white/5 bg-black/20 px-4 py-2">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            {isArenaUnlocked ? "Demo session active" : "Start demo to play"}
          </Badge>
          {result && !stepDemo.isActive ? (
            <Badge variant="secondary">Hand #{result.handNumber}</Badge>
          ) : null}
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-casino-gold/30",
              activeGameMode === "agent-vs-agent" && "border-violet-400/40",
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
            <Badge variant="secondary">
              {analytics.sessionStats.totalGames} games tracked
            </Badge>
          ) : null}
          {!isArenaUnlocked ? (
            <Badge variant="secondary">Demo access required</Badge>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-3 pt-2 sm:px-4 lg:overflow-hidden lg:pr-2 lg:pb-0">
          <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col lg:min-h-0">
            <div className="relative mx-auto min-h-[280px] w-full max-w-4xl flex-1 lg:min-h-0">
              <PokerTable
                className="absolute inset-0 h-full w-full"
                roomLayout
                onPayEntryFee={payEntryFee}
                payingEntryFee={paying}
                paymentError={paymentError}
                pot={tablePot}
                communityCards={
                  isHeadsUpGuided
                    ? stepDemo.communityCards
                    : (result?.communityCards ?? [])
                }
                seats={seats}
                winnerName={
                  stepDemo.isActive
                    ? stepDemo.winner?.name
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
                headsUpLayoutKey={headsUpLayoutKey}
              />
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 w-[240px] shrink-0 flex-col overflow-hidden border-l border-white/5 bg-black/20 p-2 lg:flex">
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain">
            <div className="flex min-h-0 flex-col gap-1.5">
              <EntryFeePanel
                compact
                className="min-h-0 shrink-0"
                paymentResult={paymentResult}
                onPayMock={payEntryFee}
                paying={paying}
                error={paymentError}
              />
              {isArenaUnlocked ? (
                <AiDecisionPanel
                  compact
                  latest={latestAiDecision}
                  guidedHand={stepDemo.isActive}
                  thinking={pokerMasterThinking}
                  spectatorMode={isAgentBattleSpectator}
                  humanCallAmount={
                    stepDemo.isActive ? stepDemoHumanCallAmount : undefined
                  }
                  totalDecisions={
                    stepDemo.isActive
                      ? stepDemo.aiDecision
                        ? 1
                        : 0
                      : aiDecisions.length
                  }
                />
              ) : null}
            </div>
          </div>
          <ArenaMenuTrigger
            onClick={() => setMenuOpen(true)}
            className="mt-2 w-full shrink-0"
          />
        </aside>
      </div>

      <ArenaActionBar
        className="relative z-30 shrink-0"
        onSimulateAgentBattle={handleSimulateAgentBattle}
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
            ? "Start demo session to play."
            : undefined
        }
        error={error}
        headsUpStackDepleted={headsUpStackDepleted}
        agentBattleStackDepleted={agentBattleStackDepleted}
        onResetAgentBattleStacks={handleResetAgentBattleStacks}
        agentBattleSpectator={isAgentBattleSpectator && !stepDemo.isActive}
        agentBattleHasResult={isAgentBattleSpectator && !stepDemo.isActive && result != null}
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
        entryFee={paymentResult?.amount ?? "0.01"}
        onResetStats={handleResetStats}
        handHistoryEntries={handHistory}
        onClearHandHistory={handleClearHandHistory}
      />
    </div>
  );
}
