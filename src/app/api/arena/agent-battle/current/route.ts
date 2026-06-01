import { NextResponse } from "next/server";
import {
  SHARED_AGENT_BATTLE_RESULT_PAUSE_MS,
  getOrCreateSharedHand,
} from "@/lib/arena/sharedAgentBattleCache";
import {
  formatCommunityCardsForDebug,
  type SharedAgentBattleCurrentResponse,
} from "@/lib/arena/sharedAgentBattleTypes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const serverNow = Date.now();
    const { hand, cacheStatus } = getOrCreateSharedHand(serverNow);

    const playingEndsAt = hand.playingEndsAt;
    const nextHandAt = hand.nextHandAt;
    const lifecyclePhase =
      serverNow < playingEndsAt ? ("playing" as const) : ("result_pause" as const);
    const msUntilNextHand = Math.max(0, nextHandAt - serverNow);

    const body: SharedAgentBattleCurrentResponse = {
      ok: true,
      handId: hand.handId,
      startedAt: hand.startedAt,
      playingEndsAt,
      nextHandAt,
      resultPauseMs: SHARED_AGENT_BATTLE_RESULT_PAUSE_MS,
      msUntilNextHand,
      expiresAt: hand.expiresAt,
      generatedAt: hand.generatedAt,
      serverNow,
      cacheStatus,
      lifecyclePhase,
      timeline: hand.timeline,
      finalResult: hand.finalResult,
    };

    if (process.env.NODE_ENV === "development") {
      console.debug("[api/arena/agent-battle/current]", {
        cacheStatus,
        handId: hand.handId,
        startedAt: hand.startedAt,
        expiresAt: hand.expiresAt,
        serverNow,
        timelineSteps: hand.timeline.steps.length,
        communityCards: formatCommunityCardsForDebug(hand.finalResult.communityCards),
        winner: hand.finalResult.winner.name,
      });
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shared Agent Battle unavailable";
    console.error("[api/arena/agent-battle/current] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
