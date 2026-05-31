"use client";

import { ChevronRight, Loader2, Play, RotateCcw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  StepDemoGameplayGuidance,
  StepDemoHumanActions,
  StepDemoRaiseSize,
} from "@/lib/arena/stepDemo";
import type { StepDemoUiControls } from "@/lib/arena/stepDemoUiState";
import { stepDemoUiBannerPhase } from "@/lib/arena/stepDemoUiState";
import { cn } from "@/lib/utils";

type ArenaActionBarProps = {
  onSimulateAgentBattle: () => void;
  onPlayStepDemo?: () => void;
  onOpenMenu?: () => void;
  stepDemoActive?: boolean;
  stepDemoUi?: StepDemoUiControls;
  stepDemoHumanActions?: StepDemoHumanActions;
  stepDemoGuidance?: StepDemoGameplayGuidance;
  onHumanFold?: () => void;
  onHumanCall?: () => void;
  onHumanCheck?: () => void;
  onHumanRaise?: (size: StepDemoRaiseSize) => void;
  onHumanAllIn?: () => void;
  stepDemoHandComplete?: boolean;
  onStepDemoReset?: () => void;
  onResetDemoStacks?: () => void;
  headsUpStackDepleted?: boolean;
  onRevealFlop?: () => void;
  onRevealTurn?: () => void;
  onRevealRiver?: () => void;
  onRunoutBoard?: () => void;
  onShowResult?: () => void;
  /** Human vs AI — PokerMaster is deciding after a human action */
  pokerMasterThinking?: boolean;
  loading?: boolean;
  loadingMode?: "human-vs-ai" | "agent-vs-agent" | null;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
  /** AI Agent Battle spectator — override Human vs AI action hints */
  agentBattleSpectator?: boolean;
  agentBattleHasResult?: boolean;
  agentBattleStackDepleted?: boolean;
  onResetAgentBattleStacks?: () => void;
  /** Human vs AI — seconds left on player turn timer */
  humanTurnSecondsLeft?: number | null;
  className?: string;
};

const bannerStyles: Record<
  NonNullable<StepDemoGameplayGuidance["phase"]>,
  string
> = {
  "start-hand":
    "border-casino-gold/40 bg-casino-gold/10 text-casino-goldLight",
  "your-turn":
    "border-emerald-400/50 bg-emerald-950/80 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)] animate-pulse",
  waiting:
    "border-cyan-400/40 bg-cyan-950/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.2)] animate-pulse",
  "advance-street":
    "border-emerald-400/50 bg-emerald-950/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.2)]",
  "hand-complete":
    "border-casino-gold/50 bg-casino-gold/15 text-casino-goldLight",
  "all-in":
    "border-red-400/45 bg-red-950/65 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.18)]",
};

export function ArenaActionBar({
  onSimulateAgentBattle,
  onPlayStepDemo,
  onOpenMenu,
  stepDemoActive = false,
  stepDemoUi,
  stepDemoHumanActions,
  stepDemoGuidance,
  onHumanFold,
  onHumanCall,
  onHumanCheck,
  onHumanRaise,
  onHumanAllIn,
  stepDemoHandComplete = false,
  onStepDemoReset,
  onResetDemoStacks,
  headsUpStackDepleted = false,
  onRevealFlop,
  onRevealTurn,
  onRevealRiver,
  onRunoutBoard,
  onShowResult,
  loading = false,
  loadingMode = null,
  disabled = false,
  disabledReason,
  error,
  agentBattleSpectator = false,
  agentBattleHasResult = false,
  agentBattleStackDepleted = false,
  onResetAgentBattleStacks,
  pokerMasterThinking = false,
  humanTurnSecondsLeft = null,
  className,
}: ArenaActionBarProps) {
  const useHeadsUpUi = !agentBattleSpectator && stepDemoUi != null;
  const humanActions = useHeadsUpUi ? stepDemoUi.humanActions : stepDemoHumanActions;
  const humanTurnActive = useHeadsUpUi
    ? stepDemoUi.pokerActionsEnabled
    : stepDemoActive &&
      !pokerMasterThinking &&
      humanActions &&
      (humanActions.canFold ||
        humanActions.canCall ||
        humanActions.canCheck ||
        humanActions.canRaise ||
        humanActions.canAllIn);
  const playStepDemoDisabled = useHeadsUpUi
    ? !stepDemoUi.playEnabled || disabled || loading
    : disabled || loading || stepDemoActive || headsUpStackDepleted || pokerMasterThinking;
  const agentBattleDisabled = useHeadsUpUi
    ? !stepDemoUi.agentBattleEnabled || disabled || loading
    : disabled ||
      loading ||
      pokerMasterThinking ||
      agentBattleStackDepleted ||
      (stepDemoActive && !stepDemoHandComplete);
  const showStackDepletedUi = useHeadsUpUi
    ? stepDemoUi.state === "stack_depleted"
    : headsUpStackDepleted && !agentBattleSpectator && !humanTurnActive;
  const showAgentBattleDepletedUi =
    agentBattleSpectator && agentBattleStackDepleted;

  const guidance: StepDemoGameplayGuidance | undefined = showStackDepletedUi
    ? {
        phase: "hand-complete",
        banner: "STACK DEPLETED",
        actionHint: "Stack depleted — reset demo stacks to continue.",
      }
    : useHeadsUpUi
      ? {
          phase: stepDemoUiBannerPhase(stepDemoUi.state),
          banner: stepDemoUi.banner,
          actionHint: stepDemoUi.actionHint,
          nextStep: stepDemoUi.nextStep ?? undefined,
        }
    : stepDemoActive
    ? stepDemoGuidance
    : showAgentBattleDepletedUi
      ? {
          phase: "hand-complete" as const,
          banner: "SPECTATOR STACKS DEPLETED",
          actionHint:
            "Agent Battle stacks depleted — reset spectator stacks to continue.",
        }
    : agentBattleSpectator
      ? {
          phase: agentBattleHasResult ? "hand-complete" : "waiting",
          banner: agentBattleHasResult ? "SPECTATOR RESULT" : "AI AGENT BATTLE",
          actionHint: agentBattleHasResult
            ? "Spectator result — run Agent Battle again or play vs PokerMaster."
            : "Spectator Mode — player actions are disabled while watching.",
        }
      : stepDemoGuidance ?? {
          phase: "start-hand",
          banner: "START HAND",
          actionHint: "Start a hand first — tap Play vs PokerMaster.",
        };

  const spectatorBannerClass =
    "border-violet-400/45 bg-violet-950/70 text-violet-100 shadow-[0_0_12px_rgba(139,92,246,0.15)]";

  const showGuidanceBanner =
    guidance && (!humanTurnActive || guidance.phase !== "your-turn");

  const actionHint = useHeadsUpUi
    ? stepDemoUi.actionHint
    : pokerMasterThinking && !agentBattleSpectator
      ? stepDemoGuidance?.actionHint ?? "PokerMaster is thinking..."
      : humanTurnActive && humanActions?.disabledHint && !agentBattleSpectator
        ? humanActions.disabledHint
        : guidance?.actionHint ??
          (agentBattleSpectator
            ? "Spectator Mode — player actions are disabled while watching."
            : humanActions?.disabledHint);

  const nextStep = useHeadsUpUi ? stepDemoUi.nextStep : guidance?.nextStep;
  const nextStepEnabled = useHeadsUpUi
    ? stepDemoUi.nextStepEnabled && !disabled && !loading
    : Boolean(nextStep) &&
      stepDemoActive &&
      !stepDemoHandComplete &&
      !loading &&
      !disabled &&
      !pokerMasterThinking;
  const newHandEnabled = useHeadsUpUi
    ? stepDemoUi.newHandEnabled
    : stepDemoHandComplete && !showStackDepletedUi;
  const resetStacksEnabled = useHeadsUpUi
    ? stepDemoUi.resetStacksEnabled
    : showStackDepletedUi;

  const controlsDisabled = disabled || loading || stepDemoActive;

  function handleNextStep() {
    if ((useHeadsUpUi ? !stepDemoUi.nextStepEnabled : pokerMasterThinking) || !nextStep) {
      return;
    }
    switch (nextStep.action) {
      case "reveal-flop":
        onRevealFlop?.();
        break;
      case "reveal-turn":
        onRevealTurn?.();
        break;
      case "reveal-river":
        onRevealRiver?.();
        break;
      case "runout-board":
        onRunoutBoard?.();
        break;
      case "show-result":
        onShowResult?.();
        break;
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t bg-[#050508]/95 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.45)]",
        agentBattleSpectator
          ? "border-violet-500/25"
          : "border-emerald-500/20",
        className,
      )}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-4 sm:py-3.5">
        {humanTurnActive ? (
          <div className="mb-2 flex justify-center">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
                bannerStyles["your-turn"],
              )}
            >
              Your turn
              {humanTurnSecondsLeft != null
                ? ` · ${String(Math.max(0, humanTurnSecondsLeft)).padStart(2, "0")}s`
                : null}
            </span>
          </div>
        ) : showGuidanceBanner && guidance.phase ? (
          <div className="mb-2 flex justify-center">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                agentBattleSpectator
                  ? spectatorBannerClass
                  : bannerStyles[guidance.phase],
              )}
            >
              {guidance.banner}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {agentBattleSpectator ? (
            <div className="flex flex-wrap items-center justify-center gap-2 lg:flex-1 lg:justify-start">
              {onPlayStepDemo ? (
                <Button
                  onClick={onPlayStepDemo}
                  disabled={playStepDemoDisabled}
                  size="lg"
                  variant="outline"
                  className="h-11 min-w-[200px] border-emerald-400/40 text-emerald-100 hover:bg-emerald-950/40"
                >
                  <Play className="h-4 w-4" />
                  Play vs PokerMaster
                </Button>
              ) : null}
              {showAgentBattleDepletedUi && onResetAgentBattleStacks ? (
                <Button
                  type="button"
                  size="lg"
                  className={cn(
                    "h-11 min-w-[240px] border-2 border-violet-400/50 bg-violet-700 font-semibold text-white",
                    "shadow-glow hover:bg-violet-600",
                  )}
                  onClick={onResetAgentBattleStacks}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Agent Battle Stacks
                </Button>
              ) : (
                <Button
                  onClick={onSimulateAgentBattle}
                  disabled={agentBattleDisabled}
                  size="lg"
                  className={cn(
                    "h-11 min-w-[220px] border-2 border-violet-400/50 bg-violet-700 font-semibold text-white",
                    "shadow-glow hover:bg-violet-600",
                  )}
                  title="Spectator Mode — watch AI agents play a simulated hand"
                >
                  {loading && loadingMode === "agent-vs-agent" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="h-4 w-4" />
                  )}
                  Run Agent Battle Again
                </Button>
              )}
              {headsUpStackDepleted && onResetDemoStacks ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-11 min-w-[11rem] border-casino-gold/40 text-casino-goldLight hover:bg-casino-gold/15"
                  onClick={onResetDemoStacks}
                >
                  <RotateCcw className="mr-1.5 h-4 w-4" />
                  Reset Demo Stacks
                </Button>
              ) : null}
              {onOpenMenu ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 border-casino-gold/30 text-xs lg:hidden"
                  onClick={onOpenMenu}
                >
                  Menu
                </Button>
              ) : null}
            </div>
          ) : (
            <>
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {onPlayStepDemo ? (
              <Button
                onClick={onPlayStepDemo}
                disabled={playStepDemoDisabled}
                size="lg"
                className={cn(
                  "h-11 min-w-[200px] shadow-glow",
                  "border border-emerald-400/50 bg-emerald-600 text-white hover:bg-emerald-500",
                  stepDemoActive && "ring-2 ring-emerald-400/40",
                  !stepDemoActive &&
                    !disabled &&
                    !agentBattleSpectator &&
                    guidance?.phase === "start-hand" &&
                    "ring-2 ring-casino-gold/30",
                )}
              >
                <Play className="h-4 w-4" />
                Play vs PokerMaster
              </Button>
            ) : null}

            <Button
              variant={humanTurnActive ? "default" : "secondary"}
              size="lg"
              className={cn(
                "h-11 min-w-[4.5rem] font-semibold",
                humanTurnActive && humanActions?.canFold && "bg-red-900/80 hover:bg-red-800",
              )}
              disabled={!humanTurnActive || !humanActions?.canFold}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanFold}
            >
              Fold
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-11 min-w-[4.5rem] font-semibold"
              disabled={!humanTurnActive || !humanActions?.canCheck}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanCheck}
            >
              Check
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="h-11 min-w-[4.5rem] font-semibold"
              disabled={!humanTurnActive || !humanActions?.canCall}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanCall}
            >
              {humanActions?.canCall
                ? `Call ${humanActions.callAmount}`
                : "Call"}
            </Button>
            {showStackDepletedUi ? (
              <Button
                variant="secondary"
                size="lg"
                className="h-11 min-w-[4.5rem] font-semibold"
                disabled
              >
                Raise
              </Button>
            ) : humanActions?.raiseOptions?.length ? (
              humanActions.raiseOptions.map((option) => (
                <Button
                  key={option.size}
                  variant="secondary"
                  size="lg"
                  className={cn(
                    "h-11 font-semibold",
                    option.size === 10 ? "min-w-[5.5rem]" : "min-w-[3.25rem] px-2",
                    humanTurnActive &&
                      option.enabled &&
                      "border-casino-gold/40 bg-casino-gold/15 text-casino-goldLight hover:bg-casino-gold/25",
                  )}
                  disabled={
                    !humanTurnActive ||
                    !humanActions?.canRaise ||
                    !option.enabled
                  }
                  title={
                    option.cappedToStack
                      ? `${option.label} — capped to ${option.increment} (stack limit)`
                      : humanActions?.disabledHint ?? actionHint ?? option.label
                  }
                  onClick={() => onHumanRaise?.(option.size)}
                >
                  {option.label}
                </Button>
              ))
            ) : (
              <Button
                variant="secondary"
                size="lg"
                className="h-11 min-w-[4.5rem] font-semibold"
                disabled
              >
                Raise
              </Button>
            )}
            <Button
              variant="destructive"
              size="lg"
              className={cn(
                "h-11 min-w-[4.5rem] font-semibold",
                humanTurnActive &&
                  humanActions?.canAllIn &&
                  "border-red-400/50 bg-red-700 opacity-100 hover:bg-red-600",
                !humanActions?.canAllIn && "opacity-40",
              )}
              disabled={!humanTurnActive || !humanActions?.canAllIn}
              title={
                humanActions?.canAllIn
                  ? `All-in ${humanActions.allInAmount} chips`
                  : humanActions?.disabledHint ?? actionHint ?? "All-in unavailable"
              }
              aria-label={
                humanActions?.canAllIn
                  ? `All-in ${humanActions.allInAmount} chips`
                  : "All-in — unavailable"
              }
              onClick={onHumanAllIn}
            >
              All-in
            </Button>

            {nextStepEnabled && nextStep && !resetStacksEnabled ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "ml-1 h-11 min-w-[9.5rem] border-2 border-emerald-400/60 bg-emerald-600 font-bold text-white",
                  "shadow-glow hover:bg-emerald-500",
                )}
                onClick={handleNextStep}
              >
                {nextStep.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : null}

            {newHandEnabled && onStepDemoReset ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "ml-1 h-11 min-w-[9rem] border-2 border-casino-gold bg-casino-gold/25 font-bold text-casino-goldLight",
                  "shadow-glow hover:bg-casino-gold/40",
                )}
                onClick={onStepDemoReset}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                New Hand
              </Button>
            ) : null}

            {resetStacksEnabled && onResetDemoStacks ? (
              <Button
                type="button"
                size="lg"
                className={cn(
                  "ml-1 h-11 min-w-[11rem] border-2 border-casino-gold bg-casino-gold/25 font-bold text-casino-goldLight",
                  "shadow-glow hover:bg-casino-gold/40",
                )}
                onClick={onResetDemoStacks}
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset Demo Stacks
              </Button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            <Button
              onClick={onSimulateAgentBattle}
              disabled={agentBattleDisabled}
              size="lg"
              variant="outline"
              className="h-11 min-w-[160px] border-violet-400/35 text-sm font-semibold text-violet-100 hover:bg-violet-950/40"
              title={
                controlsDisabled
                  ? actionHint ?? "Start a hand first or wait for your turn."
                  : "Spectator Mode — watch AI agents play a simulated hand"
              }
            >
              {loading && loadingMode === "agent-vs-agent" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Swords className="h-3.5 w-3.5" />
              )}
              Agent Battle
            </Button>
            {onOpenMenu ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 border-casino-gold/30 text-xs lg:hidden"
                onClick={onOpenMenu}
              >
                Menu
              </Button>
            ) : null}
          </div>
            </>
          )}
        </div>

        {disabled && disabledReason ? (
          <p className="mt-2 text-center text-xs font-medium text-amber-300/90">
            {disabledReason}
          </p>
        ) : null}

        {error ? (
          <p className="mt-2 text-center text-xs leading-relaxed text-red-400">
            {error}
          </p>
        ) : actionHint ? (
          <p
            className={cn(
              "mt-2 text-center text-xs leading-relaxed",
              humanTurnActive
                ? "text-emerald-300/90"
                : agentBattleSpectator
                  ? "text-violet-200/85"
                  : showStackDepletedUi
                    ? "text-casino-goldLight/90"
                    : nextStepEnabled
                    ? "font-medium text-emerald-200/90"
                    : "text-muted-foreground",
            )}
          >
            {actionHint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
