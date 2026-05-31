"use client";

import { useEffect, useRef, useState } from "react";

/** Tick interval for elapsed-time replay (shared timeline prep). */
export const AGENT_BATTLE_TIMELINE_TICK_MS = 200;

type UseAgentBattleTimelineReplayOptions = {
  handId: string | null;
  playing: boolean;
  startedAt: number | null;
  totalDurationMs: number;
  onComplete: () => void;
};

/**
 * Derives replay progress from wall-clock elapsed time.
 * Timeline model prepares Agent Battle for future shared spectator mode.
 */
export function useAgentBattleTimelineReplay({
  handId,
  playing,
  startedAt,
  totalDurationMs,
  onComplete,
}: UseAgentBattleTimelineReplayOptions) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    completedRef.current = false;
    setElapsedMs(0);
  }, [handId]);

  useEffect(() => {
    if (!playing || startedAt == null || totalDurationMs <= 0) {
      setElapsedMs(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.max(0, Date.now() - startedAt);
      setElapsedMs(elapsed);
      if (elapsed >= totalDurationMs && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
    };

    tick();
    const intervalId = setInterval(tick, AGENT_BATTLE_TIMELINE_TICK_MS);
    return () => clearInterval(intervalId);
  }, [playing, startedAt, handId, totalDurationMs]);

  return elapsedMs;
}
