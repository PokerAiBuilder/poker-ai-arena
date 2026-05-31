"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  AgentBattleReplaySession,
  AgentBattleReplayStep,
} from "@/lib/arena/agentBattleReplay";

type UseAgentBattleReplayOptions = {
  session: AgentBattleReplaySession | null;
  steps: AgentBattleReplayStep[];
  onAdvance: (nextIndex: number) => void;
  onComplete: () => void;
};

export function useAgentBattleReplay({
  session,
  steps,
  onAdvance,
  onComplete,
}: UseAgentBattleReplayOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const clearReplayTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearReplayTimer();

    if (!session || session.status !== "playing") {
      activeSessionIdRef.current = null;
      return;
    }

    activeSessionIdRef.current = session.id;

    if (session.stepIndex >= steps.length) {
      onComplete();
      return;
    }

    const sessionId = session.id;
    const stepIndex = session.stepIndex;
    const delayMs = steps[stepIndex]?.delayMs ?? 0;

    timerRef.current = setTimeout(() => {
      if (activeSessionIdRef.current !== sessionId) return;
      onAdvance(stepIndex + 1);
    }, delayMs);

    return clearReplayTimer;
  }, [
    session,
    steps,
    onAdvance,
    onComplete,
    clearReplayTimer,
  ]);

  return { clearReplayTimer };
}
