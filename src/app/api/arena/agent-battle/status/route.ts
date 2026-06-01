import { NextResponse } from "next/server";
import { getSharedArenaStatus } from "@/lib/arena/sharedAgentBattleCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const body = getSharedArenaStatus(Date.now());

    if (process.env.NODE_ENV === "development") {
      console.debug("[api/arena/agent-battle/status]", body);
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Shared arena status unavailable";
    console.error("[api/arena/agent-battle/status] error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
