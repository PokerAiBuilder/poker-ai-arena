import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SimulationAgentDecision } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

type AiDecisionPanelProps = {
  latest?: SimulationAgentDecision;
  totalDecisions?: number;
  /** Human vs AI — amount the player must call after the latest AI action */
  humanCallAmount?: number;
  /** Human vs AI guided hand — friendlier empty state copy */
  guidedHand?: boolean;
  /** Tighter sidebar layout — hides long reasoning */
  compact?: boolean;
  className?: string;
};

export function AiDecisionPanel({
  latest,
  totalDecisions = 0,
  humanCallAmount,
  guidedHand = false,
  compact = false,
  className,
}: AiDecisionPanelProps) {
  if (!latest) {
    return (
      <div
        className={cn(
          "glass-panel shrink-0 rounded-xl border border-white/10 shadow-lg",
          compact ? "p-2" : "p-4",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-cyan-400" />
          <h3 className="text-xs font-semibold text-casino-goldLight">AI Decision</h3>
        </div>
        <p
          className={cn(
            "leading-snug text-muted-foreground",
            compact ? "mt-1.5 line-clamp-2 text-[10px]" : "mt-3 text-xs",
          )}
        >
          {guidedHand
            ? "PokerMaster decisions will appear here during the hand."
            : "Run a full-hand simulation to see the latest AI reasoning."}
        </p>
        {!guidedHand && !compact ? (
          <p className="mt-1 text-[10px] text-white/40">
            Latest decision from Agent Battle or full-hand simulation.
          </p>
        ) : null}
      </div>
    );
  }

  const confidencePct = Math.round(latest.confidence * 100);
  const actionLabel =
    latest.action === "raise" || latest.action === "all-in"
      ? "Raise"
      : latest.action;

  return (
    <div
      className={cn(
        "glass-panel shrink-0 rounded-xl border border-cyan-500/20 shadow-[0_0_24px_rgba(34,211,238,0.06)]",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-white/5 bg-cyan-500/5",
          compact ? "px-2 py-1.5" : "px-4 py-3",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <h3 className="truncate text-xs font-semibold text-casino-goldLight">
              AI Decision
            </h3>
          </div>
          {!compact ? (
            <Badge variant="secondary" className="shrink-0 text-[9px]">
              {latest.strategy}
            </Badge>
          ) : null}
        </div>
        {!compact ? (
          <p className="mt-1.5 text-[10px] text-white/45">
            {guidedHand
              ? "Latest PokerMaster decision this hand."
              : "Latest decision from simulation."}
          </p>
        ) : null}
      </div>

      <div className={cn(compact ? "space-y-1.5 p-2" : "space-y-3 p-4")}>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] font-medium text-white">
            {latest.agentName}
          </span>
          {!compact ? (
            <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
              {latest.stage}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-cyan-300">
            {actionLabel}
          </span>
          {latest.amount != null ? (
            <span className="text-[11px] text-casino-goldLight">
              {latest.action === "raise" || latest.action === "all-in"
                ? `+${latest.amount} chips`
                : `${latest.amount} chips`}
            </span>
          ) : null}
        </div>

        {humanCallAmount != null && humanCallAmount > 0 ? (
          <p className="text-[10px] font-medium leading-none text-amber-300/90">
            Your call: {humanCallAmount} chips
          </p>
        ) : null}

        <div className="space-y-0.5">
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Confidence</span>
            <span>{confidencePct}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-casino-gold transition-all"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {!compact ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            &ldquo;{latest.reasoning}&rdquo;
          </p>
        ) : (
          <p className="text-[9px] leading-none text-white/35">
            Full reasoning in Action Log.
          </p>
        )}

        {totalDecisions > 1 && !guidedHand && !compact ? (
          <p className="text-[10px] text-white/40">
            +{totalDecisions - 1} earlier decision
            {totalDecisions - 1 === 1 ? "" : "s"} this hand
          </p>
        ) : null}
      </div>
    </div>
  );
}
