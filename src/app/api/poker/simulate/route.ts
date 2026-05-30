import { NextResponse } from "next/server";
import { runAgentSelfCheck } from "@/lib/agents/agentRegistry";
import {
  runEngineSelfCheck,
  simulateAgentBattle,
  simulateHumanVsAi,
} from "@/lib/poker/engine";
import type { GameMode } from "@/lib/poker/types";

function parseGameMode(value: string | null): GameMode {
  return value === "agent-vs-agent" ? "agent-vs-agent" : "human-vs-ai";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const agentCheck = searchParams.get("agentCheck") === "1";
  const mode = parseGameMode(searchParams.get("mode"));

  try {
    if (agentCheck) {
      const scenarios = runAgentSelfCheck();
      return NextResponse.json({
        ok: true,
        agentCheck: true,
        scenarios,
      });
    }

    if (debug) {
      const results = runEngineSelfCheck();
      return NextResponse.json({
        ok: true,
        debug: true,
        hands: results,
      });
    }

    const result =
      mode === "agent-vs-agent" ? simulateAgentBattle() : simulateHumanVsAi();

    if (process.env.NODE_ENV === "development") {
      console.log("[api/poker/simulate]", {
        mode: result.gameMode,
        winner: result.winner.name,
        hand: result.winningHand.rankName,
        pot: result.pot,
        actions: result.actionLog.length,
        agentDecisions: result.agentDecisions.length,
        agents: result.agents,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulation failed";
    console.error("[api/poker/simulate] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
