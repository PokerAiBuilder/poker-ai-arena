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
          "shrink-0 border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 text-[10px] font-semibold text-[var(--arena-muted)]",
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
      className={cn("flex shrink-0 flex-nowrap items-center gap-1", className)}
      role="status"
      aria-live="polite"
      aria-label={`Shared Live Arena, ${phaseLabel}`}
    >
      <Badge
        variant="outline"
        className="shrink-0 border-[var(--arena-cyan)]/45 bg-[var(--arena-blue)]/20 text-[10px] font-semibold text-[var(--arena-cyan)]"
      >
        <span className="hidden min-[1280px]:inline">Shared Live Arena</span>
        <span className="hidden max-sm:inline min-[1280px]:hidden">Shared Live</span>
        <span className="max-sm:inline sm:hidden">Shared</span>
      </Badge>
      <Badge
        variant="secondary"
        className="border-[var(--arena-border)] bg-[var(--arena-surface-2)]/90 text-[10px] font-medium text-[var(--arena-text)]"
      >
        <span className="max-sm:hidden">{phaseLabel}</span>
        <span className="hidden max-sm:inline">{isPause ? "Result" : "Playing"}</span>
      </Badge>
      {isPause && secondsUntilNextHand != null ? (
        <Badge
          variant="outline"
          className="shrink-0 border-[var(--arena-blue-bright)]/40 bg-[var(--arena-blue)]/15 text-[10px] font-medium text-[var(--arena-cyan)]"
        >
          <span className="hidden min-[1280px]:inline">Next hand in {secondsUntilNextHand}s</span>
          <span className="hidden max-sm:inline min-[1280px]:hidden">Next {secondsUntilNextHand}s</span>
          <span className="max-sm:inline sm:hidden">Next {secondsUntilNextHand}s</span>
        </Badge>
      ) : null}
    </div>
  );
}
