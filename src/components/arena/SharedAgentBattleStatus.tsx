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
      <Badge variant="outline" className={cn("arena-badge-pill-muted shrink-0", className)}>
        Local replay
      </Badge>
    );
  }

  const isPause = lifecyclePhase === "result_pause";

  return (
    <div
      className={cn("flex shrink-0 flex-nowrap items-center gap-1", className)}
      role="status"
      aria-live="polite"
      aria-label={`Shared live arena, ${isPause ? "result pause" : "playing"}`}
    >
      <Badge variant="outline" className="arena-badge-pill arena-badge-pill-active shrink-0">
        <span className="hidden min-[1280px]:inline">Shared live</span>
        <span className="min-[1280px]:hidden">Shared</span>
      </Badge>
      {isPause && secondsUntilNextHand != null ? (
        <Badge variant="outline" className="arena-badge-pill-muted shrink-0">
          Next {secondsUntilNextHand}s
        </Badge>
      ) : null}
    </div>
  );
}
