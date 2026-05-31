import type {
  AgentBattleAccountingSnapshot,
  AgentBattleHandMeta,
  GameState,
  HandResult,
  Player,
} from "@/lib/poker/types";

function clampStack(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function initAgentBattleHandMeta(players: Player[]): AgentBattleHandMeta {
  return {
    startingStacks: Object.fromEntries(
      players.map((player) => [player.id, clampStack(player.stack)]),
    ),
    contributions: Object.fromEntries(players.map((player) => [player.id, 0])),
  };
}

export function recordAgentBattleContribution(
  meta: AgentBattleHandMeta,
  playerId: string,
  amount: number,
): void {
  const paid = clampStack(amount);
  if (paid <= 0) return;
  meta.contributions[playerId] = (meta.contributions[playerId] ?? 0) + paid;
}

/** Record blind posts already written to the action log this hand. */
export function recordAgentBattleBlindsFromLog(state: GameState): void {
  const meta = state.agentBattleMeta;
  if (!meta) return;

  for (const entry of state.actionLog) {
    if (entry.action !== "blind" || entry.amount == null || entry.amount <= 0) {
      continue;
    }
    recordAgentBattleContribution(meta, entry.playerId, entry.amount);
  }
}

function sumRecord(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, value) => sum + value, 0);
}

function buildWinnerPayouts(
  players: Player[],
  winnerIds: string[],
  pot: number,
): Record<string, number> {
  const payouts: Record<string, number> = Object.fromEntries(
    players.map((player) => [player.id, 0]),
  );
  if (winnerIds.length === 0) return payouts;

  const share = Math.floor(pot / winnerIds.length);
  const remainder = pot - share * winnerIds.length;
  winnerIds.forEach((winnerId, index) => {
    payouts[winnerId] = share + (index === 0 ? remainder : 0);
  });
  return payouts;
}

function assertAgentBattleInvariants(
  meta: AgentBattleHandMeta,
  players: Player[],
  pot: number,
  winnerIds: string[],
): void {
  if (process.env.NODE_ENV === "production") return;

  const totalBefore = sumRecord(meta.startingStacks);
  const contributionSum = sumRecord(meta.contributions);

  if (contributionSum !== pot) {
    console.warn("[agentBattle/accounting] pot mismatch", {
      pot,
      contributionSum,
      contributions: meta.contributions,
    });
  }

  const payouts = buildWinnerPayouts(players, winnerIds, pot);

  const finalStacks: Record<string, number> = {};
  for (const player of players) {
    const starting = meta.startingStacks[player.id] ?? 0;
    const contributed = meta.contributions[player.id] ?? 0;
    const payout = payouts[player.id] ?? 0;
    finalStacks[player.id] = starting - contributed + payout;
  }

  const totalAfter = sumRecord(finalStacks);
  if (totalAfter !== totalBefore) {
    console.warn("[agentBattle/accounting] chip total changed", {
      totalBefore,
      totalAfter,
      startingStacks: meta.startingStacks,
      contributions: meta.contributions,
      finalStacks,
      pot,
      winnerIds,
    });
  }

  for (const player of players) {
    const starting = meta.startingStacks[player.id] ?? 0;
    const contributed = meta.contributions[player.id] ?? 0;
    const payout = payouts[player.id] ?? 0;
    const expected = starting - contributed + payout;
    const isWinner = winnerIds.includes(player.id);

    if (!isWinner && finalStacks[player.id] > starting) {
      console.warn("[agentBattle/accounting] loser gained chips", {
        playerId: player.id,
        starting,
        contributed,
        final: finalStacks[player.id],
      });
    }

    if (finalStacks[player.id] < 0 || !Number.isFinite(finalStacks[player.id])) {
      console.warn("[agentBattle/accounting] invalid final stack", {
        playerId: player.id,
        final: finalStacks[player.id],
      });
    }
  }
}

export function finalizeAgentBattleStacks(
  state: GameState,
  result: HandResult,
): AgentBattleAccountingSnapshot | null {
  const meta = state.agentBattleMeta;
  if (!meta) return null;

  const pot = clampStack(result.pot);
  const winnerIds = state.players
    .filter((player) => !result.loserIds.includes(player.id))
    .map((player) => player.id);

  assertAgentBattleInvariants(meta, state.players, pot, winnerIds);

  const payouts = buildWinnerPayouts(state.players, winnerIds, pot);
  const finalStacks: Record<string, number> = {};

  for (const player of state.players) {
    const starting = meta.startingStacks[player.id] ?? 0;
    const contributed = meta.contributions[player.id] ?? 0;
    const payout = payouts[player.id] ?? 0;
    const finalStack = clampStack(starting - contributed + payout);
    player.stack = finalStack;
    finalStacks[player.id] = finalStack;
  }

  state.pot = 0;

  const winnerName =
    state.players.find((player) => player.id === result.winnerId)?.name ??
    result.winnerName;

  state.actionLog.push({
    playerId: "system",
    playerName: "Arena",
    action: "showdown",
    stage: "showdown",
    message: `Pot settled: ${winnerName} wins ${pot.toLocaleString()} chips.`,
    timestamp: Date.now(),
  });

  const stackDeltas = state.players
    .map((player) => {
      const starting = meta.startingStacks[player.id] ?? 0;
      const delta = finalStacks[player.id] - starting;
      if (delta === 0) return null;
      const sign = delta > 0 ? "+" : "";
      return `${player.name} ${sign}${delta}`;
    })
    .filter((line): line is string => line != null);

  if (stackDeltas.length > 0) {
    state.actionLog.push({
      playerId: "system",
      playerName: "Arena",
      action: "showdown",
      stage: "showdown",
      message: `Stacks updated: ${stackDeltas.join(", ")}.`,
      timestamp: Date.now(),
    });
  }

  return {
    startingStacks: { ...meta.startingStacks },
    contributions: { ...meta.contributions },
    finalStacks,
    pot,
    winnerId: result.winnerId,
    winnerIds,
  };
}

export function attachAgentBattleAccounting(
  state: GameState,
  snapshot: AgentBattleAccountingSnapshot | null,
): void {
  if (snapshot) {
    state.agentBattleAccounting = snapshot;
  }
}
