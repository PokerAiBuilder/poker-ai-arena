"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HUMAN_TURN_TIMER_SECONDS } from "@/lib/arena/humanTurnTimer";

type UseHumanTurnTimerOptions = {
  enabled: boolean;
  /** Changes reset the countdown (new human decision point). */
  turnKey: string | null;
  onTimeout: () => void;
};

export function useHumanTurnTimer({
  enabled,
  turnKey,
  onTimeout,
}: UseHumanTurnTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutFiredRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    timeoutFiredRef.current = true;
    setSecondsLeft(null);
  }, []);

  useEffect(() => {
    if (!enabled || !turnKey) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timeoutFiredRef.current = false;
      setSecondsLeft(null);
      return;
    }

    timeoutFiredRef.current = false;
    let remaining = HUMAN_TURN_TIMER_SECONDS;
    setSecondsLeft(remaining);

    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSecondsLeft(0);
        if (!timeoutFiredRef.current) {
          timeoutFiredRef.current = true;
          onTimeoutRef.current();
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, turnKey]);

  return {
    secondsLeft: enabled && turnKey ? secondsLeft : null,
    clearTimer,
  };
}
