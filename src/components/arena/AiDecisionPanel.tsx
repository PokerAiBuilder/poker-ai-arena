import { Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SimulationAgentDecision } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

type AiDecisionPanelProps = {
  latest?: SimulationAgentDecision;
  totalDecisions?: number;
  /** Human vs AI — amount the player must call after the latest AI action */
  humanCallAmount?: number;
  className?: string;
};

export function AiDecisionPanel({
  latest,
  totalDecisions = 0,
  humanCallAmount,
  className,
}: AiDecisionPanelProps) {
  if (!latest) {
    return (
      <div
        className={cn(
          "glass-panel rounded-2xl border border-white/10 p-4 shadow-lg",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-casino-goldLight">AI Decision</h3>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Run a full-hand simulation to see the latest AI reasoning.
        </p>
        <p className="mt-1 text-[10px] text-white/40">
          Latest decision from full-hand simulation.
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(latest.confidence * 100);

  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-2xl border border-cyan-500/20 shadow-[0_0_32px_rgba(34,211,238,0.08)]",
        className,
      )}
    >
      <div className="border-b border-white/5 bg-cyan-500/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-casino-goldLight">AI Decision</h3>
          </div>
          <Badge variant="secondary">{latest.strategy}</Badge>
        </div>
        <p className="mt-1.5 text-[10px] text-white/45">
          Latest decision from full-hand simulation.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{latest.agentName}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {latest.stage}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1.5 text-sm font-bold uppercase text-cyan-300">
            {latest.action === "raise" || latest.action === "all-in"
              ? "Raise"
              : latest.action}
          </span>
          {latest.amount != null ? (
            <span className="text-sm text-casino-goldLight">
              {latest.action === "raise" || latest.action === "all-in"
                ? `+${latest.amount} chips`
                : `${latest.amount} chips`}
            </span>
          ) : null}
        </div>

        {humanCallAmount != null && humanCallAmount > 0 ? (
          <p className="text-[11px] font-medium text-amber-300/90">
            Your call: {humanCallAmount} chips
          </p>
        ) : null}

        <div>
          <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
            <span>Confidence</span>
            <span>{confidencePct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-casino-gold transition-all"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          &ldquo;{latest.reasoning}&rdquo;
        </p>

        {totalDecisions > 1 ? (
          <p className="text-[10px] text-white/40">
            +{totalDecisions - 1} earlier decision
            {totalDecisions - 1 === 1 ? "" : "s"} this hand
          </p>
        ) : null}
      </div>
    </div>
  );
}
