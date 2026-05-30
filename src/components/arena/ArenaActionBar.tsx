"use client";

import { Loader2, Play, RotateCcw, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepDemoHumanActions } from "@/lib/arena/stepDemo";
import { cn } from "@/lib/utils";

type ArenaActionBarProps = {
  onSimulateHumanVsAi: () => void;
  onSimulateAgentBattle: () => void;
  onPlayStepDemo?: () => void;
  onOpenMenu?: () => void;
  stepDemoActive?: boolean;
  stepDemoHumanActions?: StepDemoHumanActions;
  onHumanFold?: () => void;
  onHumanCall?: () => void;
  onHumanCheck?: () => void;
  onHumanRaise?: () => void;
  stepDemoHandComplete?: boolean;
  onStepDemoReset?: () => void;
  loading?: boolean;
  loadingMode?: "human-vs-ai" | "agent-vs-agent" | null;
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
  className?: string;
};

export function ArenaActionBar({
  onSimulateHumanVsAi,
  onSimulateAgentBattle,
  onPlayStepDemo,
  onOpenMenu,
  stepDemoActive = false,
  stepDemoHumanActions,
  onHumanFold,
  onHumanCall,
  onHumanCheck,
  onHumanRaise,
  stepDemoHandComplete = false,
  onStepDemoReset,
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

  return (
    <div
      className={cn(
        "shrink-0 border-t border-emerald-500/20 bg-[#050508]/95 backdrop-blur-xl",
        "shadow-[0_-8px_32px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-4 sm:py-3.5">
        {stepDemoHandComplete && onStepDemoReset ? (
          <div className="mb-3 flex justify-center">
            <Button
              type="button"
              size="lg"
              className={cn(
                "h-12 min-w-[220px] border-2 border-casino-gold bg-gradient-to-r from-casino-gold/35 to-emerald-600/30",
                "text-base font-bold text-casino-goldLight shadow-glow hover:from-casino-gold/45 hover:to-emerald-500/35",
              )}
              onClick={onStepDemoReset}
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              New Hand
            </Button>
          </div>
        ) : null}

        {humanTurnActive ? (
          <div className="mb-2 flex justify-center">
            <span className="rounded-full border border-emerald-400/50 bg-emerald-950/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.25)] animate-pulse">
              Your turn
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
            {onPlayStepDemo ? (
              <Button
                onClick={onPlayStepDemo}
                disabled={disabled || loading || stepDemoActive}
                size="lg"
                className={cn(
                  "h-11 min-w-[200px] shadow-glow",
                  "border border-emerald-400/50 bg-emerald-600 text-white hover:bg-emerald-500",
                  stepDemoActive && "ring-2 ring-emerald-400/40",
                )}
              >
                <Play className="h-4 w-4" />
                Play Step Demo
              </Button>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant={humanTurnActive ? "default" : "secondary"}
                size="lg"
                className={cn(
                  "h-11 min-w-[4.5rem] font-semibold",
                  humanTurnActive && humanActions?.canFold && "bg-red-900/80 hover:bg-red-800",
                )}
                disabled={!humanTurnActive || !humanActions?.canFold}
                title={humanActions?.disabledHint}
                onClick={onHumanFold}
              >
                Fold
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-11 min-w-[4.5rem] font-semibold"
                disabled={!humanTurnActive || !humanActions?.canCheck}
                title={humanActions?.disabledHint}
                onClick={onHumanCheck}
              >
                Check
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-11 min-w-[4.5rem] font-semibold"
                disabled={!humanTurnActive || !humanActions?.canCall}
                title={humanActions?.disabledHint}
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
                title={humanActions?.disabledHint}
                onClick={onHumanRaise}
              >
                {humanTurnActive && humanActions?.canRaise
                  ? `+${humanActions.raiseAmount}`
                  : "Raise"}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="h-11 min-w-[4.5rem] font-semibold opacity-50"
                disabled
                title="All-in coming later"
              >
                All-in
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            <Button
              onClick={onSimulateHumanVsAi}
              disabled={controlsDisabled}
              size="sm"
              variant="outline"
              className="h-9 border-white/15 text-xs"
            >
              {loading && loadingMode === "human-vs-ai" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              Full Hand
            </Button>
            <Button
              onClick={onSimulateAgentBattle}
              disabled={controlsDisabled}
              size="sm"
              variant="outline"
              className="h-9 border-white/15 text-xs"
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

        {(error || (humanActions?.disabledHint && !disabled)) ? (
          <p
            className={cn(
              "mt-2 text-center text-[10px] leading-relaxed",
              error ? "text-red-400" : "text-muted-foreground",
              humanTurnActive && !error && "text-emerald-300/80",
            )}
          >
            {error ??
              (humanTurnActive
                ? humanActions?.disabledHint
                : humanActions?.disabledHint)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
