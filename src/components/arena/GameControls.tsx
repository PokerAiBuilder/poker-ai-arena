import { Loader2, Play, Swords, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepDemoHumanActions } from "@/lib/arena/stepDemo";
import { cn } from "@/lib/utils";

type GameControlsProps = {
  onSimulateHumanVsAi: () => void;
  onSimulateAgentBattle: () => void;
  onPlayStepDemo?: () => void;
  stepDemoActive?: boolean;
  stepDemoHumanActions?: StepDemoHumanActions;
  onHumanFold?: () => void;
  onHumanCall?: () => void;
  onHumanCheck?: () => void;
  onHumanRaise?: () => void;
  loading?: boolean;
  loadingMode?: "human-vs-ai" | "agent-vs-agent" | null;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
};

export function GameControls({
  onSimulateHumanVsAi,
  onSimulateAgentBattle,
  onPlayStepDemo,
  stepDemoActive = false,
  stepDemoHumanActions,
  onHumanFold,
  onHumanCall,
  onHumanCheck,
  onHumanRaise,
  loading = false,
  loadingMode = null,
  disabled = false,
  disabledReason,
  className,
}: GameControlsProps) {
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
        "glass-panel rounded-2xl border border-white/10 p-4 shadow-lg sm:p-5",
        disabled && "opacity-80",
        className,
      )}
    >
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
        Recommended demo
      </p>

      {onPlayStepDemo ? (
        <div className="flex justify-center">
          <Button
            onClick={onPlayStepDemo}
            disabled={disabled || loading || stepDemoActive}
            size="lg"
            className={cn(
              "w-full max-w-md shadow-glow",
              "border border-emerald-400/50 bg-emerald-600 text-white hover:bg-emerald-500",
              stepDemoActive && "ring-2 ring-emerald-400/40",
            )}
          >
            <Play className="h-4 w-4" />
            Play Step Demo: Human vs AI
          </Button>
        </div>
      ) : null}

      <p className="mt-4 mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Full-hand simulations (optional)
      </p>

      <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <Button
          onClick={onSimulateHumanVsAi}
          disabled={controlsDisabled}
          size="default"
          variant="outline"
          className="w-full border-white/15 sm:min-w-[200px] sm:w-auto"
        >
          {loading && loadingMode === "human-vs-ai" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Simulating…
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Full Hand: Human vs AI
            </>
          )}
        </Button>

        <Button
          onClick={onSimulateAgentBattle}
          disabled={controlsDisabled}
          size="default"
          variant="outline"
          className="w-full border-white/15 sm:min-w-[200px] sm:w-auto"
        >
          {loading && loadingMode === "agent-vs-agent" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Simulating…
            </>
          ) : (
            <>
              <Swords className="h-4 w-4" />
              Full Hand: Agent Battle
            </>
          )}
        </Button>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Your actions (Step Demo only)
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            disabled={!humanTurnActive || !humanActions?.canFold}
            title={
              humanActions?.canFold
                ? "Fold your hand"
                : humanActions?.disabledHint
            }
            onClick={onHumanFold}
          >
            Fold
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            disabled={!humanTurnActive || !humanActions?.canCheck}
            title={
              humanActions?.canCheck
                ? "Check"
                : humanActions?.disabledHint ?? "Nothing to call — check unavailable"
            }
            onClick={onHumanCheck}
          >
            Check
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            disabled={!humanTurnActive || !humanActions?.canCall}
            title={
              humanActions?.canCall
                ? `Call ${humanActions.callAmount}`
                : humanActions?.disabledHint
            }
            onClick={onHumanCall}
          >
            {humanActions?.canCall
              ? `Call ${humanActions.callAmount}`
              : "Check / Call"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[4.5rem]"
            disabled={!humanTurnActive || !humanActions?.canRaise}
            title={
              humanActions?.canRaise
                ? `Raise +${humanActions.raiseAmount}`
                : humanActions?.disabledHint
            }
            onClick={onHumanRaise}
          >
            {humanTurnActive && humanActions?.canRaise
              ? `Raise +${humanActions.raiseAmount}`
              : "Bet / Raise"}
          </Button>
          <Button variant="destructive" size="sm" disabled title="All-in coming later">
            All-in
          </Button>
        </div>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          {humanTurnActive
            ? humanActions?.disabledHint
            : (humanActions?.disabledHint ??
              "Fold / Check / Call / Raise unlock during Step Demo on your turn.")}
        </p>
      </div>

      {disabled && disabledReason ? (
        <p className="mt-3 text-center text-[10px] text-amber-400/90">
          {disabledReason}
        </p>
      ) : null}

      <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
        Start with Step Demo for the guided experience. Full-hand modes run the
        engine in one click (MVP streets).
      </p>
    </div>
  );
}
