import { NextResponse } from "next/server";
import {
  buildTestnetLeaderboardFromSessions,
  takeTopLeaderboardEntries,
  TESTNET_LEADERBOARD_DEFAULT_LIMIT,
  TESTNET_LEADERBOARD_STORE_TODO,
} from "@/lib/arena/arenaLeaderboard";
import {
  ARENA_SERVER_SESSION_STORE_NOTE,
} from "@/lib/arena/arenaServerSessionTypes";
import { getArenaServerSessionStore } from "@/lib/arena/arenaServerSessionStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseLimit(raw: string | null): number {
  if (!raw) return TESTNET_LEADERBOARD_DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return TESTNET_LEADERBOARD_DEFAULT_LIMIT;
  }
  return Math.min(parsed, 50);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));

  const sessions = getArenaServerSessionStore().listAll();
  const entries = takeTopLeaderboardEntries(
    buildTestnetLeaderboardFromSessions(sessions),
    limit,
  );

  return NextResponse.json({
    title: "Testnet Wallet Leaderboard",
    subtitle: "Demo rankings from active escrow sessions",
    entries,
    limit,
    source: "server-session",
    storeNote: ARENA_SERVER_SESSION_STORE_NOTE,
    todo: TESTNET_LEADERBOARD_STORE_TODO,
  });
}
