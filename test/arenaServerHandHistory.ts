import { expect } from "chai";

/** Mirrors arenaServerHandHistory helpers for hardhat tests. */
const MAX_HANDS = 50;

type ArenaServerHandRecord = {
  handId: string;
  walletAddress: string;
  escrowSessionId: string;
  mode: "human-vs-ai";
  winner: "human" | "ai";
  pot: number;
  chipDelta: number;
  finalChips: number;
  resultLabel?: string;
  completedAt: string;
};

function parseHandWinner(value: unknown): "human" | "ai" | null {
  return value === "human" || value === "ai" ? value : null;
}

function parseLatestHandResult(
  value: unknown,
): Record<string, unknown> | { error: string } {
  if (!value || typeof value !== "object") return { error: "Invalid latestHandResult." };
  const body = value as Record<string, unknown>;
  if (!parseHandWinner(body.winner)) return { error: "Invalid hand winner." };
  if (body.mode != null && body.mode !== "human-vs-ai") return { error: "Invalid hand mode." };
  const pot = Math.floor(Number(body.pot));
  if (!Number.isFinite(pot) || pot < 0) return { error: "Invalid hand chip fields." };
  return body;
}

function appendRecentHands(
  existing: ArenaServerHandRecord[] | undefined,
  hand: ArenaServerHandRecord,
): ArenaServerHandRecord[] {
  const deduped = (existing ?? []).filter((entry) => entry.handId !== hand.handId);
  return [hand, ...deduped].slice(0, MAX_HANDS);
}

function aggregateHandStatsFromHistory(hands: ArenaServerHandRecord[] | undefined) {
  if (!hands?.length) return { handsPlayed: 0, wins: 0, losses: 0, biggestPot: 0 };
  let wins = 0;
  let losses = 0;
  let biggestPot = 0;
  for (const hand of hands) {
    if (hand.winner === "human") wins += 1;
    else losses += 1;
    biggestPot = Math.max(biggestPot, hand.pot);
  }
  return { handsPlayed: hands.length, wins, losses, biggestPot };
}

function resolveSessionHandStats(session: {
  handsPlayed?: number;
  wins?: number;
  losses?: number;
  biggestPot?: number;
  recentHands?: ArenaServerHandRecord[];
}) {
  const fromHistory = aggregateHandStatsFromHistory(session.recentHands);
  if (fromHistory.handsPlayed > 0) return fromHistory;
  return {
    handsPlayed: session.handsPlayed ?? 0,
    wins: session.wins ?? 0,
    losses: session.losses ?? 0,
    biggestPot: session.biggestPot ?? 0,
  };
}

const wallet = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function hand(id: string, winner: "human" | "ai", pot: number): ArenaServerHandRecord {
  return {
    handId: id,
    walletAddress: wallet,
    escrowSessionId: "1",
    mode: "human-vs-ai",
    winner,
    pot,
    chipDelta: winner === "human" ? pot : -pot,
    finalChips: 1000,
    completedAt: "2026-06-03T12:00:00.000Z",
  };
}

describe("arena server hand history helpers", function () {
  it("appends hand result to session history", function () {
    const first = appendRecentHands([], hand("h1", "human", 120));
    expect(first).to.have.length(1);
    expect(first[0].handId).to.equal("h1");
    const second = appendRecentHands(first, hand("h2", "ai", 80));
    expect(second[0].handId).to.equal("h2");
    expect(second[1].handId).to.equal("h1");
  });

  it("caps recent hands at max", function () {
    let history: ArenaServerHandRecord[] = [];
    for (let i = 0; i < 55; i += 1) {
      history = appendRecentHands(history, hand(`h${i}`, "human", 10));
    }
    expect(history).to.have.length(MAX_HANDS);
    expect(history[0].handId).to.equal("h54");
  });

  it("aggregates leaderboard stats from server hand history", function () {
    const stats = aggregateHandStatsFromHistory([
      hand("h1", "human", 150),
      hand("h2", "ai", 90),
      hand("h3", "human", 200),
    ]);
    expect(stats.handsPlayed).to.equal(3);
    expect(stats.wins).to.equal(2);
    expect(stats.losses).to.equal(1);
    expect(stats.biggestPot).to.equal(200);
  });

  it("falls back to session counters when history is missing", function () {
    const stats = resolveSessionHandStats({
      handsPlayed: 2,
      wins: 1,
      losses: 1,
      biggestPot: 40,
    });
    expect(stats.handsPlayed).to.equal(2);
    expect(stats.biggestPot).to.equal(40);
  });

  it("prefers server hand history over stale session counters", function () {
    const stats = resolveSessionHandStats({
      handsPlayed: 0,
      wins: 0,
      losses: 0,
      biggestPot: 0,
      recentHands: [hand("h1", "human", 75)],
    });
    expect(stats.handsPlayed).to.equal(1);
    expect(stats.wins).to.equal(1);
  });

  it("rejects invalid hand payload safely", function () {
    expect(parseLatestHandResult(null)).to.have.property("error");
    expect(parseLatestHandResult({ winner: "bot", pot: 10 })).to.have.property(
      "error",
    );
    expect(parseLatestHandResult({ winner: "human", pot: -1 })).to.have.property(
      "error",
    );
  });
});
