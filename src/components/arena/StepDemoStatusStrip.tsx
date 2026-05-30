import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getStepDemoStreetLabel,
  getStepDemoTurnLabel,
  humanAmountToCall,
  isStepDemoBettingInProgress,
  isStepDemoFacingAiRaise,
  STEP_DEMO_LABELS,
  type StepDemoState,
} from "@/lib/arena/stepDemo";
import { cn } from "@/lib/utils";

type StepDemoStatusStripProps = {
  stepDemo: StepDemoState;
  onRevealFlop: () => void;
  onRevealTurn: () => void;
  onRevealRiver: () => void;
  onShowResult: () => void;
  onReset: () => void;
  disabled?: boolean;
  className?: string;
};

export function StepDemoStatusStrip({
  stepDemo,
  onRevealFlop,
  onRevealTurn,
  onRevealRiver,
  onShowResult,
  onReset,
  disabled = false,
  className,
}: StepDemoStatusStripProps) {
  if (!stepDemo.isActive) return null;

  const step = stepDemo.step;
  const facingAiRaise = isStepDemoFacingAiRaise(stepDemo);
  const bettingPending = isStepDemoBettingInProgress(stepDemo);
  const canRevealFlop =
    step === "preflop-complete" && !disabled && !bettingPending;
  const canRevealTurn =
    step === "flop-complete" && !disabled && !bettingPending;
  const canRevealRiver =
    step === "turn-complete" && !disabled && !bettingPending;
  const canShowResult =
    step === "river-complete" && !disabled && !bettingPending;
  const handComplete = step === "result";
  const toCall = humanAmountToCall(stepDemo);

  const revealAction = canRevealFlop
    ? { label: "Reveal Flop", onClick: onRevealFlop }
    : canRevealTurn
      ? { label: "Reveal Turn", onClick: onRevealTurn }
      : canRevealRiver
        ? { label: "Reveal River", onClick: onRevealRiver }
        : canShowResult
          ? { label: "Show Result", onClick: onShowResult }
          : null;

  return (
    <div
      className={cn(
        "shrink-0 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2",
        "shadow-[0_0_20px_rgba(16,185,129,0.08)] backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Street
            </span>
            <p className="font-semibold text-white">
              {getStepDemoStreetLabel(stepDemo)}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Turn
            </span>
            <p className="font-semibold text-cyan-300">
              {getStepDemoTurnLabel(stepDemo)}
            </p>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Pot
            </span>
            <p className="font-semibold text-casino-goldLight">
              {stepDemo.pot.toLocaleString()}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <p className="truncate font-medium text-white/90">
              {STEP_DEMO_LABELS[step]}
              {toCall > 0 && stepDemo.turn === "human"
                ? ` · To call ${toCall}`
                : ""}
              {facingAiRaise ? " · AI raised" : ""}
            </p>
          </div>
          {step === "result" && stepDemo.winner ? (
            <p className="text-[11px] font-medium text-casino-goldLight">
              {stepDemo.winner.name}
              {stepDemo.winningHandName === "Win by fold"
                ? " — fold win"
                : ` — ${stepDemo.winningHandName}`}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {revealAction ? (
            <Button
              type="button"
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-500"
              onClick={revealAction.onClick}
            >
              {revealAction.label}
            </Button>
          ) : null}
          <Button
            type="button"
            size={handComplete ? "default" : "sm"}
            className={cn(
              handComplete
                ? "h-10 min-w-[9.5rem] border-2 border-casino-gold bg-casino-gold/25 text-sm font-bold text-casino-goldLight shadow-glow hover:bg-casino-gold/40"
                : "h-8 border-casino-gold/45 bg-casino-gold/10 text-xs font-semibold text-casino-goldLight hover:bg-casino-gold/20",
            )}
            onClick={onReset}
          >
            <RotateCcw className={cn("h-4 w-4", handComplete ? "mr-1.5" : "mr-1")} />
            {handComplete ? "New Hand" : "Reset Hand"}
          </Button>
        </div>
      </div>
    </div>
  );
}
