"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SharedAgentBattleStatusSource = "shared" | "local";

export type SharedAgentBattleLifecyclePhase = "playing" | "result_pause";

type SharedAgentBattleStatusProps = {
  active: boolean;
  source: SharedAgentBattleStatusSource | null;
  lifecyclePhase: SharedAgentBattleLifecyclePhase | null;
  secondsUntilNextHand: number | null;
  className?: string;
};

/** Compact top-row badges for shared / local Agent Battle spectator mode. */
export function SharedAgentBattleStatus({
  active,
  source,
  lifecyclePhase,
  secondsUntilNextHand,
  className,
}: SharedAgentBattleStatusProps) {
  if (!active || !source) return null;

  if (source === "local") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-amber-400/40 bg-amber-950/30 text-[10px] font-semibold text-amber-100",
          className,
        )}
      >
        Local replay
      </Badge>
    );
  }

  const isPause = lifecyclePhase === "result_pause";
  const phaseLabel = isPause ? "Result pause" : "Playing";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      role="status"
      aria-live="polite"
      aria-label={`Shared Live Arena, ${phaseLabel}`}
    >
      <Badge
        variant="outline"
        className="border-violet-400/50 bg-violet-950/40 text-[10px] font-semibold text-violet-100"
      >
        Shared Live Arena
      </Badge>
      <Badge variant="secondary" className="text-[10px] font-medium">
        {phaseLabel}
      </Badge>
      {isPause && secondsUntilNextHand != null ? (
        <Badge
          variant="outline"
          className="border-casino-gold/40 bg-casino-gold/10 text-[10px] font-medium text-casino-goldLight"
        >
          Next hand in {secondsUntilNextHand}s
        </Badge>
      ) : null}
    </div>
  );
}
