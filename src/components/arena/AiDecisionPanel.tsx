import { Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAgentProfile } from "@/lib/agents/agentProfiles";
import { sanitizeHumanVsAiDecisionDisplay } from "@/lib/arena/humanVsAiDecisionPrivacy";
import type { SimulationAgentDecision } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

type AiDecisionPanelProps = {
  latest?: SimulationAgentDecision;
  totalDecisions?: number;
  /** Human vs AI — amount the player must call after the latest AI action */
  humanCallAmount?: number;
  /** Human vs AI guided hand — friendlier empty state copy */
  guidedHand?: boolean;
  /** PokerMaster is deciding — show thinking state */
  thinking?: boolean;
  /** Override thinking copy (Agent Battle replay) */
  thinkingLabel?: string;
  /** AI Agent Battle spectator simulation */
  spectatorMode?: boolean;
  /** Tighter sidebar layout — hides long reasoning */
  compact?: boolean;
  /** Human vs AI — hide PokerMaster private hand metadata before showdown */
  hidePrivateHandInfo?: boolean;
  className?: string;
};

function ContextCell({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[8px] font-medium uppercase tracking-wide text-white/40">
        {label}
      </p>
      <p className="truncate text-[10px] leading-snug text-white/85">{value}</p>
    </div>
  );
}

function resolveStyleLabel(latest: SimulationAgentDecision): string | undefined {
  if (latest.styleLabel) return latest.styleLabel;
  return getAgentProfile(latest.agentId)?.title;
}

export function AiDecisionPanel({
  latest,
  totalDecisions = 0,
  humanCallAmount,
  guidedHand = false,
  thinking = false,
  thinkingLabel,
  spectatorMode = false,
  compact = false,
  hidePrivateHandInfo = false,
  className,
}: AiDecisionPanelProps) {
  if (thinking && (guidedHand || spectatorMode)) {
    return (
      <div
        className={cn(
          "glass-panel shrink-0 rounded-xl border border-cyan-500/25 shadow-[0_0_24px_rgba(34,211,238,0.08)]",
          compact ? "p-2" : "p-4",
          className,
        )}
      >
        <div className="flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
          <h3 className="text-xs font-semibold text-casino-goldLight">AI Decision</h3>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
          <p
            className={cn(
              "font-medium text-cyan-200/90",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {thinkingLabel ??
              (spectatorMode
                ? "Agent thinking..."
                : "PokerMaster is thinking...")}
          </p>
        </div>
        {!compact ? (
          <p className="mt-2 text-[10px] text-white/40">
            {spectatorMode
              ? "Decision context will appear once the agent acts."
              : "Decision context will appear once PokerMaster acts."}
          </p>
        ) : null}
      </div>
    );
  }

  const displayDecision =
    latest != null && hidePrivateHandInfo && !spectatorMode
      ? sanitizeHumanVsAiDecisionDisplay(latest, false)
      : latest;

  if (!displayDecision) {
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
            compact ? "mt-1.5 line-clamp-3 text-[10px]" : "mt-3 text-xs",
          )}
        >
          {guidedHand
            ? "PokerMaster decisions will appear here during the hand."
            : spectatorMode
              ? "Latest agent decision appears here during AI Agent Battle."
              : "Run a full-hand simulation to see the latest AI reasoning."}
        </p>
        {spectatorMode && compact ? (
          <p className="mt-1 text-[9px] leading-none text-white/35">
            Spectator Mode — full agent sequence in Action Log.
          </p>
        ) : null}
        {!guidedHand && !spectatorMode && !compact ? (
          <p className="mt-1 text-[10px] text-white/40">
            Latest decision from Agent Battle or full-hand simulation.
          </p>
        ) : null}
      </div>
    );
  }

  const confidencePct = Math.round(displayDecision.confidence * 100);
  const styleLabel = resolveStyleLabel(displayDecision);
  const hasContext =
    displayDecision.handLabel != null ||
    displayDecision.boardLabel != null ||
    displayDecision.pressureLabel != null;
  const actionLabel = (() => {
    if (displayDecision.reasoning.startsWith("CALL all-in")) return "CALL all-in";
    if (displayDecision.reasoning.startsWith("FOLD to all-in")) return "FOLD to all-in";
    if (displayDecision.action === "all-in") return "All-in";
    if (displayDecision.action === "raise") return "Raise";
    return displayDecision.action;
  })();

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
            <span className="shrink-0 text-[9px] uppercase tracking-wider text-muted-foreground">
              {displayDecision.stage}
            </span>
          ) : null}
        </div>
      </div>

      <div className={cn(compact ? "space-y-1.5 p-2" : "space-y-2.5 p-4")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[11px] font-semibold text-white">
            {displayDecision.agentName}
          </span>
          {styleLabel ? (
            <Badge
              variant="secondary"
              className="border-violet-400/25 bg-violet-500/10 text-[8px] text-violet-200"
            >
              {styleLabel}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-cyan-400/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-cyan-300">
            {actionLabel}
          </span>
          {displayDecision.amount != null ? (
            <span className="text-[11px] text-casino-goldLight">
              {displayDecision.action === "raise" || displayDecision.action === "all-in"
                ? `+${displayDecision.amount} chips`
                : `${displayDecision.amount} chips`}
            </span>
          ) : null}
        </div>

        {humanCallAmount != null && humanCallAmount > 0 && !spectatorMode ? (
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

        {hasContext ? (
          <div
            className={cn(
              "grid gap-1.5 rounded-lg border border-white/5 bg-black/20 p-1.5",
              displayDecision.handLabel != null ? "grid-cols-3" : "grid-cols-2",
            )}
          >
            {displayDecision.handLabel != null ? (
              <ContextCell label="Hand" value={displayDecision.handLabel} />
            ) : null}
            <ContextCell label="Board" value={displayDecision.boardLabel ?? "—"} />
            <ContextCell label="Pressure" value={displayDecision.pressureLabel} />
          </div>
        ) : null}

        {displayDecision.reasonTags != null && displayDecision.reasonTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {displayDecision.reasonTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] text-white/65"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <p
          className={cn(
            "leading-snug text-muted-foreground",
            compact ? "line-clamp-2 text-[9px]" : "text-[11px]",
          )}
        >
          &ldquo;{displayDecision.reasoning}&rdquo;
        </p>

        {spectatorMode && totalDecisions > 1 ? (
          <p className="text-[9px] leading-snug text-violet-300/55">
            Full agent sequence in Action Log.
          </p>
        ) : null}

        {guidedHand && compact ? (
          <p className="text-[9px] leading-none text-white/35">
            Full reasoning in Action Log.
          </p>
        ) : null}

        {totalDecisions > 1 && !spectatorMode && !guidedHand && !compact ? (
          <p className="text-[9px] leading-none text-white/35">
            +{totalDecisions - 1} earlier decision
            {totalDecisions - 1 === 1 ? "" : "s"} — see Action Log
          </p>
        ) : null}
      </div>
    </div>
  );
}
