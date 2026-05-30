"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Sparkles, Swords, Users } from "lucide-react";
import { ArenaActionBar } from "@/components/arena/ArenaActionBar";
import { ArenaMenuDrawer, ArenaMenuTrigger } from "@/components/arena/ArenaMenuDrawer";
import { AiDecisionPanel } from "@/components/arena/AiDecisionPanel";
import { EntryFeePanel } from "@/components/arena/EntryFeePanel";
import { StepDemoStatusStrip } from "@/components/arena/StepDemoStatusStrip";
import { PokerTable } from "@/components/arena/PokerTable";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearArenaAnalytics,
  clearSessionStacks,
  createInitialArenaAnalytics,
  createInitialSessionStacks,
  loadArenaAnalytics,
  loadSessionStacks,
  saveArenaAnalytics,
  saveSessionStacks,
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
  getStepDemoPotDisplay,
  getStepDemoStackUpdates,
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
  return mode === "agent-vs-agent" ? "Agent vs Agent" : "Human vs AI";
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
          `Arena unlocked via ${data.mode} x402 payment (${data.amount} USDC).`,
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
        setError("Pay entry fee first to launch the arena.");
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
        setSessionStacks((prev) => updateSessionStacksAfterGame(prev, data));

        if (process.env.NODE_ENV === "development") {
          console.debug("[arena] simulation result", data);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setSessionLog((prev) => [
          ...prev,
          createErrorLogEntry(
            `Simulation failed (${mode === "agent-vs-agent" ? "Agent Battle" : "Human vs AI"}): ${message}`,
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

  const handleSimulateHumanVsAi = useCallback(
    () => runSimulation("human-vs-ai"),
    [runSimulation],
  );

  const handleSimulateAgentBattle = useCallback(
    () => runSimulation("agent-vs-agent"),
    [runSimulation],
  );

  const handlePlayStepDemo = useCallback(() => {
    if (!isArenaUnlocked) {
      setError("Pay entry fee first to launch the arena.");
      return;
    }
    setError(null);
    setResult(null);
    setPreferredSeatLayout("human-vs-ai");
    setStepDemo(dealStepDemoHand(sessionStacks));
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Step demo hand started — Human vs AI."),
    ]);
  }, [isArenaUnlocked, sessionStacks]);

  const commitStepDemo = useCallback(
    (updater: (prev: StepDemoState) => StepDemoState) => {
      setStepDemo((prev) => {
        const next = updater(prev);
        const stackUpdates = getStepDemoStackUpdates(next);
        if (stackUpdates) {
          setSessionStacks((stacks) => ({ ...stacks, ...stackUpdates }));
        }
        return next;
      });
    },
    [],
  );

  const handleResetStepDemo = useCallback(() => {
    setStepDemo(createInitialStepDemoState());
    setSessionLog((prev) => [
      ...prev,
      createSessionLogEntry("Step demo reset."),
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

  const handleHumanRaise = useCallback(() => {
    commitStepDemo((prev) => applyHumanRaise(prev));
  }, [commitStepDemo]);

  const stepDemoHumanActions = useMemo(
    () => getStepDemoHumanActions(stepDemo),
    [stepDemo],
  );

  const seats = useMemo(() => {
    if (stepDemo.isActive) {
      return buildStepDemoSeats(stepDemo, sessionStacks);
    }
    return buildTableSeats(result, preferredSeatLayout, sessionStacks);
  }, [stepDemo, result, preferredSeatLayout, sessionStacks]);

  const aiDecisions = result?.agentDecisions ?? [];
  const latestAiDecision = stepDemo.isActive
    ? (stepDemo.aiDecision ?? undefined)
    : aiDecisions[aiDecisions.length - 1];
  const activeGameMode = stepDemo.isActive
    ? "human-vs-ai"
    : (result?.gameMode ?? preferredSeatLayout);
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

  const tablePot = stepDemo.isActive
    ? getStepDemoPotDisplay(stepDemo)
    : (result?.pot ?? null);

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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Casino Cockpit
            </p>
          </div>

          <ConnectWalletButton size="sm" />
        </div>
      </header>

      <div className="relative z-10 shrink-0 border-b border-white/5 bg-black/20 px-4 py-2">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2">
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            {isArenaUnlocked ? "Session active" : "Pay to unlock"}
          </Badge>
          {stepDemo.isActive ? (
            <Badge className="border-emerald-500/40 bg-emerald-950/50 text-emerald-100">
              Step Demo
            </Badge>
          ) : null}
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
            <Badge variant="secondary">x402 entry required</Badge>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-3 pb-1 pt-2 sm:px-4 lg:overflow-hidden lg:pr-2">
          <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">
            <div
              className="relative mx-auto w-full max-w-4xl shrink-0"
              style={{
                height: "clamp(380px, calc(100dvh - 15.5rem), 620px)",
              }}
            >
              <PokerTable
                className="absolute inset-0 h-full w-full"
                roomLayout
                onPayEntryFee={payEntryFee}
                payingEntryFee={paying}
                paymentError={paymentError}
                pot={tablePot}
                communityCards={
                  stepDemo.isActive
                    ? stepDemo.communityCards
                    : (result?.communityCards ?? [])
                }
                seats={seats}
                winnerName={
                  stepDemo.isActive
                    ? stepDemo.winner?.name
                    : result?.winner.name
                }
                winningHand={showdownHandName}
                resultType={handResultType}
                locked={!isArenaUnlocked}
                fourPlayerLayout={
                  !stepDemo.isActive && activeGameMode === "agent-vs-agent"
                }
                spectatorMode={
                  !stepDemo.isActive &&
                  activeGameMode === "agent-vs-agent" &&
                  result != null
                }
                stepDemoMode={stepDemo.isActive}
              />
            </div>

            <div className="mt-2 h-14 shrink-0 overflow-visible sm:h-16">
              <StepDemoStatusStrip
                stepDemo={stepDemo}
                onRevealFlop={handleStepDemoRevealFlop}
                onRevealTurn={handleStepDemoRevealTurn}
                onRevealRiver={handleStepDemoRevealRiver}
                onShowResult={handleStepDemoShowResult}
                onReset={handleResetStepDemo}
                disabled={!isArenaUnlocked}
              />
            </div>
          </div>
        </div>

        <aside className="hidden w-[248px] shrink-0 flex-col gap-3 border-l border-white/5 bg-black/20 p-3 lg:flex">
          <EntryFeePanel
            compact={!isArenaUnlocked}
            paymentResult={paymentResult}
            onPayMock={payEntryFee}
            paying={paying}
            error={paymentError}
          />
          {isArenaUnlocked ? (
            <>
              <AiDecisionPanel
                latest={latestAiDecision}
                totalDecisions={
                  stepDemo.isActive
                    ? stepDemo.aiDecision
                      ? 1
                      : 0
                    : aiDecisions.length
                }
              />
              <p className="text-center text-[9px] leading-relaxed text-muted-foreground/70">
                Demo chips only · local session stacks
              </p>
            </>
          ) : null}
          <ArenaMenuTrigger
            onClick={() => setMenuOpen(true)}
            className="w-full"
          />
        </aside>
      </div>

      <ArenaActionBar
        className="relative z-30"
        onSimulateHumanVsAi={handleSimulateHumanVsAi}
        onSimulateAgentBattle={handleSimulateAgentBattle}
        onPlayStepDemo={handlePlayStepDemo}
        onOpenMenu={() => setMenuOpen(true)}
        stepDemoActive={stepDemo.isActive}
        stepDemoHumanActions={stepDemoHumanActions}
        stepDemoHandComplete={stepDemo.isActive && stepDemo.step === "result"}
        onStepDemoReset={handleResetStepDemo}
        onHumanFold={handleHumanFold}
        onHumanCall={handleHumanCall}
        onHumanCheck={handleHumanCheck}
        onHumanRaise={handleHumanRaise}
        loading={loading}
        loadingMode={loadingMode}
        disabled={!isArenaUnlocked}
        disabledReason={
          !isArenaUnlocked
            ? "Pay entry fee first to launch the arena."
            : undefined
        }
        error={error}
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
