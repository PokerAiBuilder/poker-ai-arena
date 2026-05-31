import { NextResponse } from "next/server";
import { runAgentSelfCheck } from "@/lib/agents/agentRegistry";
import {
  runEngineSelfCheck,
  canRunAgentBattle,
  simulateAgentBattle,
  simulateHumanVsAi,
} from "@/lib/poker/engine";
import type { GameMode } from "@/lib/poker/types";

function parseGameMode(value: string | null): GameMode {
  return value === "agent-vs-agent" ? "agent-vs-agent" : "human-vs-ai";
}

function parseStartingStacks(
  raw: string | null,
): Record<string, number> | undefined {
  if (!raw) return undefined;
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (!parsed || typeof parsed !== "object") return undefined;
    const stacks: Record<string, number> = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        stacks[id] = Math.max(0, Math.floor(value));
      }
    }
    return Object.keys(stacks).length > 0 ? stacks : undefined;
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const debug = searchParams.get("debug") === "1";
  const agentCheck = searchParams.get("agentCheck") === "1";
  const mode = parseGameMode(searchParams.get("mode"));
  const startingStacks =
    mode === "agent-vs-agent"
      ? parseStartingStacks(searchParams.get("stacks"))
      : undefined;

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

    if (mode === "agent-vs-agent" && !canRunAgentBattle(startingStacks)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Agent Battle stacks depleted — reset spectator stacks to continue.",
        },
        { status: 400 },
      );
    }

    const result =
      mode === "agent-vs-agent"
        ? simulateAgentBattle(startingStacks)
        : simulateHumanVsAi();

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
