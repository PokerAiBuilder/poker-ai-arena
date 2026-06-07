"use client";

import { Sparkles, Swords, Users } from "lucide-react";
import {
  SharedAgentBattleStatus,
  type SharedAgentBattleLifecyclePhase,
  type SharedAgentBattleStatusSource,
} from "@/components/arena/SharedAgentBattleStatus";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ArenaStatusBadgesProps = {
  isArenaUnlocked: boolean;
  isStakeCashedOut: boolean;
  handNumber: number | null;
  sharedAgentBattleStatusActive: boolean;
  sharedAgentBattleStatusSource: SharedAgentBattleStatusSource | null;
  sharedAgentBattleStatusPhase: SharedAgentBattleLifecyclePhase | null;
  sharedNextHandCountdown: number | null;
  gameModeLabel: string;
  isAgentVsAgentMode: boolean;
  totalGames: number;
  /** Tighter pills when merged into the desktop header row */
  compact?: boolean;
  className?: string;
};

export function ArenaStatusBadges({
  isArenaUnlocked,
  isStakeCashedOut,
  handNumber,
  sharedAgentBattleStatusActive,
  sharedAgentBattleStatusSource,
  sharedAgentBattleStatusPhase,
  sharedNextHandCountdown,
  gameModeLabel,
  isAgentVsAgentMode,
  totalGames,
  compact = false,
  className,
}: ArenaStatusBadgesProps) {
  const pillClass = cn(
    "arena-badge-pill shrink-0",
    compact ? "arena-badge-pill-header text-[10px]" : "sm:text-xs",
  );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-nowrap items-center gap-1.5",
        compact && "overflow-x-auto scrollbar-hide",
        className,
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          pillClass,
          isArenaUnlocked && !isStakeCashedOut && "arena-badge-pill-active",
        )}
      >
        <Sparkles className={cn("shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
        <span className={cn(!compact && "max-w-[7.5rem] truncate sm:max-w-none")}>
          {isStakeCashedOut ? (
            <>
              <span className="sm:hidden">Cashed out</span>
              <span className="hidden sm:inline">Cashed out</span>
            </>
          ) : isArenaUnlocked ? (
            <>
              <span className="sm:hidden">Staked</span>
              <span className="hidden sm:inline">Stake active</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">Lock stake</span>
              <span className="hidden sm:inline">Lock stake to play</span>
            </>
          )}
        </span>
      </Badge>
      {handNumber != null ? (
        <Badge variant="outline" className={cn(pillClass, "arena-badge-pill-muted")}>
          #{handNumber}
        </Badge>
      ) : null}
      <SharedAgentBattleStatus
        active={sharedAgentBattleStatusActive}
        source={sharedAgentBattleStatusSource}
        lifecyclePhase={sharedAgentBattleStatusPhase}
        secondsUntilNextHand={sharedNextHandCountdown}
        className={compact ? "text-[10px]" : undefined}
      />
      <Badge
        variant="outline"
        className={cn(pillClass, isAgentVsAgentMode && "arena-badge-pill-active")}
      >
        {isAgentVsAgentMode ? (
          <Swords className={cn("shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
        ) : (
          <Users className={cn("shrink-0", compact ? "h-2.5 w-2.5" : "h-3 w-3")} />
        )}
        {gameModeLabel}
      </Badge>
      {totalGames > 0 ? (
        <Badge variant="outline" className={cn(pillClass, "arena-badge-pill-muted")}>
          {totalGames} games
        </Badge>
      ) : null}
    </div>
  );
}
