"use client";

import { ChevronRight, Loader2, Play, RotateCcw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  StepDemoGameplayGuidance,
  StepDemoHumanActions,
} from "@/lib/arena/stepDemo";
import { cn } from "@/lib/utils";

type ArenaActionBarProps = {
  onSimulateAgentBattle: () => void;
  onPlayStepDemo?: () => void;
  onOpenMenu?: () => void;
  stepDemoActive?: boolean;
  stepDemoHumanActions?: StepDemoHumanActions;
  stepDemoGuidance?: StepDemoGameplayGuidance;
  onHumanFold?: () => void;
  onHumanCall?: () => void;
  onHumanCheck?: () => void;
  onHumanRaise?: () => void;
  stepDemoHandComplete?: boolean;
  onStepDemoReset?: () => void;
  onRevealFlop?: () => void;
  onRevealTurn?: () => void;
  onRevealRiver?: () => void;
  onShowResult?: () => void;
  loading?: boolean;
  loadingMode?: "human-vs-ai" | "agent-vs-agent" | null;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
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
  waiting: "border-cyan-400/30 bg-cyan-950/50 text-cyan-200",
  "advance-street":
    "border-emerald-400/50 bg-emerald-950/70 text-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.2)]",
  "hand-complete":
    "border-casino-gold/50 bg-casino-gold/15 text-casino-goldLight",
};

export function ArenaActionBar({
  onSimulateAgentBattle,
  onPlayStepDemo,
  onOpenMenu,
  stepDemoActive = false,
  stepDemoHumanActions,
  stepDemoGuidance,
  onHumanFold,
  onHumanCall,
  onHumanCheck,
  onHumanRaise,
  stepDemoHandComplete = false,
  onStepDemoReset,
  onRevealFlop,
  onRevealTurn,
  onRevealRiver,
  onShowResult,
  loading = false,
  loadingMode = null,
  disabled = false,
  disabledReason,
  error,
  className,
}: ArenaActionBarProps) {
  const controlsDisabled = disabled || loading || stepDemoActive;
  const humanActions = stepDemoHumanActions;
  const humanTurnActive =
    stepDemoActive &&
    humanActions &&
    (humanActions.canFold ||
      humanActions.canCall ||
      humanActions.canCheck ||
      humanActions.canRaise);

  const guidance =
    stepDemoGuidance ??
    (stepDemoActive
      ? undefined
      : {
          phase: "start-hand" as const,
          banner: "START HAND",
          actionHint: "Start a hand first — tap Play vs PokerMaster.",
        });

  const showGuidanceBanner =
    guidance && (!humanTurnActive || guidance.phase !== "your-turn");

  const actionHint =
    humanTurnActive && humanActions?.disabledHint
      ? humanActions.disabledHint
      : guidance?.actionHint ?? humanActions?.disabledHint;

  const nextStep = guidance?.nextStep;
  const nextStepEnabled =
    Boolean(nextStep) &&
    stepDemoActive &&
    !stepDemoHandComplete &&
    !loading &&
    !disabled;

  function handleNextStep() {
    if (!nextStep) return;
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
      case "show-result":
        onShowResult?.();
        break;
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 border-t border-emerald-500/20 bg-[#050508]/95 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.45)]",
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
            </span>
          </div>
        ) : showGuidanceBanner && guidance.phase ? (
          <div className="mb-2 flex justify-center">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                bannerStyles[guidance.phase],
              )}
            >
              {guidance.banner}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {onPlayStepDemo ? (
              <Button
                onClick={onPlayStepDemo}
                disabled={disabled || loading || stepDemoActive}
                size="lg"
                className={cn(
                  "h-11 min-w-[200px] shadow-glow",
                  "border border-emerald-400/50 bg-emerald-600 text-white hover:bg-emerald-500",
                  stepDemoActive && "ring-2 ring-emerald-400/40",
                  !stepDemoActive &&
                    !disabled &&
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
            <Button
              variant="secondary"
              size="lg"
              className={cn(
                "h-11 min-w-[4.5rem] font-semibold",
                humanTurnActive &&
                  humanActions?.canRaise &&
                  "border-casino-gold/40 bg-casino-gold/15 text-casino-goldLight hover:bg-casino-gold/25",
              )}
              disabled={!humanTurnActive || !humanActions?.canRaise}
              title={humanActions?.disabledHint ?? actionHint ?? undefined}
              onClick={onHumanRaise}
            >
              {humanTurnActive && humanActions?.canRaise
                ? `+${humanActions.raiseAmount}`
                : "Raise"}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="h-11 min-w-[4.5rem] font-semibold opacity-40"
              disabled
              title="Coming soon"
              aria-label="All-in — coming soon"
            >
              All-in
            </Button>

            {nextStepEnabled && nextStep ? (
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

            {stepDemoHandComplete && onStepDemoReset ? (
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
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            <Button
              onClick={onSimulateAgentBattle}
              disabled={controlsDisabled}
              size="lg"
              variant="outline"
              className="h-11 min-w-[160px] border-violet-400/35 text-sm font-semibold text-violet-100 hover:bg-violet-950/40"
              title={
                controlsDisabled
                  ? actionHint ?? "Start a hand first or wait for your turn."
                  : undefined
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
