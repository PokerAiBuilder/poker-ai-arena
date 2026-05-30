"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  clearSessionStacks,
  createInitialArenaAnalytics,
  createInitialSessionStacks,
  canStartHeadsUpHand,
  isHeadsUpStackDepleted,
  loadArenaAnalytics,
  loadSessionStacks,
  resetHeadsUpDemoStacks,
  saveArenaAnalytics,
  saveSessionStacks,
  sanitizeSessionStacks,
  updateLeaderboardAfterGame,
  updateSessionStacksAfterGame,
  updateSessionStatsAfterGame,
} from "@/lib/analytics";
import type { ArenaAnalyticsState, SessionStacksState } from "@/lib/analytics";
import { buildTableSeats } from "@/lib/arena/buildTableSeats";
import {
  advanceStepDemoRevealFlop,
  advanceStepDemoRevealRiver,
  advanceStepDemoRevealTurn,
  advanceStepDemoShowResult,
  applyHumanCall,
  applyHumanCheck,
  applyHumanFold,
  applyHumanRaise,
  buildStepDemoSeats,
  createInitialStepDemoState,
  dealStepDemoHand,
  getStepDemoHumanActions,
  getStepDemoHumanCallAmount,
  getStepDemoGameplayGuidance,
  getStepDemoPotDisplay,
  getStepDemoStackUpdates,
  type StepDemoRaiseSize,
  type StepDemoState,
} from "@/lib/arena/stepDemo";
import {
  getHandResultDisplayType,
  isWinByFoldResult,
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
  const [preferredSeatLayout, setPreferredSeatLayout] =
    useState<GameMode>("human-vs-ai");
  const [paymentResult, setPaymentResult] = useState<X402PaymentResult | null>(
    null,
  );
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sessionLog, setSessionLog] = useState<GameAction[]>([]);
  const [stepDemo, setStepDemo] = useState<StepDemoState>(createInitialStepDemoState);
  const [menuOpen, setMenuOpen] = useState(false);

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
    setAnalyticsReady(true);
    setStacksReady(true);
  }, []);

  useEffect(() => {
    if (!analyticsReady) return;
    saveArenaAnalytics(analytics);
  }, [analytics, analyticsReady]);

  useEffect(() => {
    if (!stacksReady) return;
    saveSessionStacks(sessionStacks);
  }, [sessionStacks, stacksReady]);

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

      try {
        const response = await fetch(`/api/poker/simulate?mode=${mode}`);
        if (!response.ok) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? "Simulation failed");
        }
        const data = (await response.json()) as SimulationResult;
        setResult(data);
        setAnalytics((prev) => applySimulationAnalytics(prev, data));
        setSessionStacks((prev) => sanitizeSessionStacks(updateSessionStacksAfterGame(prev, data)));

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
    [isArenaUnlocked],
  );

  const handleResetStats = useCallback(() => {
    clearArenaAnalytics();
    clearSessionStacks();
    setAnalytics(createInitialArenaAnalytics());
    setSessionStacks(createInitialSessionStacks());
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Arena stats and demo stacks reset."),
    ]);
  }, []);

  const handleSimulateAgentBattle = useCallback(
    () => runSimulation("agent-vs-agent"),
    [runSimulation],
  );

  const handlePlayStepDemo = useCallback(() => {
    if (!isArenaUnlocked) {
      setError("Start demo session to play.");
      return;
    }
    const readyStacks = sanitizeSessionStacks(sessionStacks);
    if (!canStartHeadsUpHand(readyStacks)) {
      setError("One player is out of chips — reset demo stacks to continue.");
      return;
    }
    setError(null);
    setResult(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionStacks(readyStacks);
    setStepDemo(dealStepDemoHand(readyStacks));
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Human vs AI — new hand started."),
    ]);
  }, [isArenaUnlocked, sessionStacks]);

  const handleResetDemoStacks = useCallback(() => {
    setSessionStacks((prev) => resetHeadsUpDemoStacks(prev));
    setStepDemo(createInitialStepDemoState());
    setResult(null);
    setError(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Demo stacks reset."),
    ]);
  }, []);

  const commitStepDemo = useCallback(
    (updater: (prev: StepDemoState) => StepDemoState) => {
      setStepDemo((prev) => {
        const next = updater(prev);
        const stackUpdates = getStepDemoStackUpdates(next);
        if (stackUpdates) {
          setSessionStacks((stacks) =>
            sanitizeSessionStacks({ ...stacks, ...stackUpdates }),
          );
        }
        return next;
      });
    },
    [],
  );

  const handleResetStepDemo = useCallback(() => {
    setStepDemo(createInitialStepDemoState());
    setResult(null);
    setPreferredSeatLayout("human-vs-ai");
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Human vs AI — hand ended."),
    ]);
  }, []);

  const handleStepDemoRevealFlop = useCallback(() => {
    commitStepDemo((prev) => advanceStepDemoRevealFlop(prev));
  }, [commitStepDemo]);

  const handleStepDemoRevealTurn = useCallback(() => {
    commitStepDemo((prev) => advanceStepDemoRevealTurn(prev));
  }, [commitStepDemo]);

  const handleStepDemoRevealRiver = useCallback(() => {
    commitStepDemo((prev) => advanceStepDemoRevealRiver(prev));
  }, [commitStepDemo]);

  const handleStepDemoShowResult = useCallback(() => {
    commitStepDemo((prev) => advanceStepDemoShowResult(prev));
  }, [commitStepDemo]);

  const handleHumanFold = useCallback(() => {
    commitStepDemo((prev) => applyHumanFold(prev));
  }, [commitStepDemo]);

  const handleHumanCall = useCallback(() => {
    commitStepDemo((prev) => applyHumanCall(prev));
  }, [commitStepDemo]);

  const handleHumanCheck = useCallback(() => {
    commitStepDemo((prev) => applyHumanCheck(prev));
  }, [commitStepDemo]);

  const handleHumanRaise = useCallback((size: StepDemoRaiseSize) => {
    commitStepDemo((prev) => applyHumanRaise(prev, size));
  }, [commitStepDemo]);

  const stepDemoHumanActions = useMemo(
    () => getStepDemoHumanActions(stepDemo),
    [stepDemo],
  );

  const stepDemoGuidance = useMemo(
    () => getStepDemoGameplayGuidance(stepDemo),
    [stepDemo],
  );

  const stepDemoHumanCallAmount = useMemo(
    () => getStepDemoHumanCallAmount(stepDemo),
    [stepDemo],
  );

  const headsUpStackDepleted = useMemo(
    () => isHeadsUpStackDepleted(sessionStacks),
    [sessionStacks],
  );

  const activeGameMode = stepDemo.isActive
    ? "human-vs-ai"
    : (result?.gameMode ?? preferredSeatLayout);
  const isHeadsUpGuided = activeGameMode === "human-vs-ai";

  const seats = useMemo(() => {
    if (isHeadsUpGuided) {
      return buildStepDemoSeats(stepDemo, sessionStacks);
    }
    return buildTableSeats(result, preferredSeatLayout, sessionStacks);
  }, [stepDemo, result, preferredSeatLayout, sessionStacks, isHeadsUpGuided]);

  const aiDecisions = result?.agentDecisions ?? [];
  const latestAiDecision = stepDemo.isActive
    ? (stepDemo.aiDecision ?? undefined)
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

  const isAgentBattleSpectator =
    activeGameMode === "agent-vs-agent" && !isHeadsUpGuided;

  const actionLogEntries = useMemo(
    () =>
      stepDemo.isActive
        ? [...sessionLog, ...stepDemo.actionLog]
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
        stepDemoHumanActions={stepDemoHumanActions}
        stepDemoGuidance={stepDemo.isActive ? stepDemoGuidance : undefined}
        stepDemoHandComplete={stepDemo.isActive && stepDemo.step === "result"}
        headsUpStackDepleted={headsUpStackDepleted}
        onStepDemoReset={handleResetStepDemo}
        onRevealFlop={handleStepDemoRevealFlop}
        onRevealTurn={handleStepDemoRevealTurn}
        onRevealRiver={handleStepDemoRevealRiver}
        onShowResult={handleStepDemoShowResult}
        onHumanFold={handleHumanFold}
        onHumanCall={handleHumanCall}
        onHumanCheck={handleHumanCheck}
        onHumanRaise={handleHumanRaise}
        loading={loading}
        loadingMode={loadingMode}
        disabled={!isArenaUnlocked}
        disabledReason={
          !isArenaUnlocked
            ? "Start demo session to play."
            : undefined
        }
        error={error}
        agentBattleSpectator={isAgentBattleSpectator && !stepDemo.isActive}
        agentBattleHasResult={isAgentBattleSpectator && !stepDemo.isActive && result != null}
      />

      <ArenaMenuDrawer
        open={menuOpen}
        onOpenChange={setMenuOpen}
        actionLogEntries={actionLogEntries}
        leaderboardEntries={analytics.leaderboard}
        highlightId={stepDemo.winner?.id ?? result?.winner.id}
        sessionStats={analytics.sessionStats}
        sessionStatus={isArenaUnlocked ? "unlocked" : "locked"}
        paymentMode={paymentResult?.mode ?? null}
        entryFee={paymentResult?.amount ?? "0.01"}
        onResetStats={handleResetStats}
      />
    </div>
  );
}
