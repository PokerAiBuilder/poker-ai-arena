import { Button } from "@/components/ui/button";
import {
  getStepDemoStreetLabel,
  getStepDemoTurnLabel,
  getStepDemoHumanCallAmount,
  isStepDemoBettingInProgress,
  isStepDemoFacingAiRaise,
  STEP_DEMO_LABELS,
  type StepDemoState,
} from "@/lib/arena/stepDemo";
import { cn } from "@/lib/utils";

type StepDemoPanelProps = {
  stepDemo: StepDemoState;
  onRevealFlop: () => void;
  onRevealTurn: () => void;
  onRevealRiver: () => void;
  onShowResult: () => void;
  onReset: () => void;
  disabled?: boolean;
  className?: string;
};

export function StepDemoPanel({
  stepDemo,
  onRevealFlop,
  onRevealTurn,
  onRevealRiver,
  onShowResult,
  onReset,
  disabled = false,
  className,
}: StepDemoPanelProps) {
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
  const toCall = getStepDemoHumanCallAmount(stepDemo);

  return (
    <div
      className={cn(
        "glass-panel rounded-2xl border border-emerald-500/40 p-4 shadow-lg",
        "ring-1 ring-emerald-500/30 shadow-[0_0_28px_rgba(16,185,129,0.12)]",
        "sm:p-5",
        className,
      )}
    >
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400/90">
        Human vs AI — guided poker hand
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Street
          </p>
          <p className="text-xs font-medium text-white">
            {getStepDemoStreetLabel(stepDemo)}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/30 px-2 py-2">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Turn
          </p>
          <p className="text-xs font-medium text-cyan-300">
            {getStepDemoTurnLabel(stepDemo)}
          </p>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-center">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {STEP_DEMO_LABELS[step]}
        </p>
        <p className="mt-1 text-sm font-semibold text-casino-goldLight">
          Pot: {stepDemo.pot.toLocaleString()}
        </p>
        {stepDemo.turn === "human" && toCall > 0 ? (
          <p className="text-[10px] font-medium text-amber-300/90">
            To call: {toCall} chips
          </p>
        ) : null}
        {facingAiRaise ? (
          <p className="mt-1 text-[10px] font-medium text-amber-300/90">
            PokerMaster raised. Your response required.
          </p>
        ) : null}
      </div>

      <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
        Human vs AI: Flop → Turn → River. Use Fold / Call / Check / Raise above when
        it is your turn.
      </p>

      {canRevealFlop ? (
        <Button
          type="button"
          className="mt-3 w-full"
          size="sm"
          onClick={onRevealFlop}
        >
          Next: Reveal Flop
        </Button>
      ) : null}

      {canRevealTurn ? (
        <Button
          type="button"
          className="mt-3 w-full"
          size="sm"
          onClick={onRevealTurn}
        >
          Next: Reveal Turn
        </Button>
      ) : null}

      {canRevealRiver ? (
        <Button
          type="button"
          className="mt-3 w-full"
          size="sm"
          onClick={onRevealRiver}
        >
          Next: Reveal River
        </Button>
      ) : null}

      {canShowResult ? (
        <Button
          type="button"
          className="mt-3 w-full"
          size="sm"
          onClick={onShowResult}
        >
          Show Result
        </Button>
      ) : null}

      {step === "result" ? (
        <p className="mt-2 text-center text-[10px] text-casino-goldLight/90">
          {stepDemo.winner?.name}
          {stepDemo.winningHandName === "Win by fold"
            ? " — Win by fold"
            : ` — ${stepDemo.winningHandName}`}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2 w-full border-white/10 text-xs"
        onClick={onReset}
      >
        New Hand
      </Button>
    </div>
  );
}
