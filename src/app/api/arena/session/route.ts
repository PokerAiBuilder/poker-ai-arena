import { NextResponse } from "next/server";
import {
  ARENA_SERVER_SESSION_STORE_NOTE,
  type ArenaServerSession,
} from "@/lib/arena/arenaServerSessionTypes";
import { parseLatestHandResult } from "@/lib/arena/arenaServerHandHistory";
import { getArenaServerSessionStore } from "@/lib/arena/arenaServerSessionStore";
import {
  deriveStatusFromChips,
  isValidWalletAddress,
  normalizeWalletAddress,
  parseArenaSessionStatus,
  parseCurrentChips,
  parseDepositTxHash,
  parseEscrowSessionId,
  parseNonNegativeInt,
  parseOptionalTxHash,
  parseStartingChips,
  parseStakeAmountWei,
  validateLockSettlement,
} from "@/lib/arena/arenaSessionValidation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonSession(session: ArenaServerSession) {
  return NextResponse.json({
    session,
    recentHands: session.recentHands ?? [],
    storeNote: ARENA_SERVER_SESSION_STORE_NOTE,
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get("walletAddress");
  const escrowSessionId = searchParams.get("escrowSessionId");

  if (!isValidWalletAddress(walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const sessionId = parseEscrowSessionId(escrowSessionId);
  if (!sessionId) {
    return NextResponse.json({ error: "Invalid escrow session id." }, { status: 400 });
  }

  const session = getArenaServerSessionStore().get(walletAddress, sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return jsonSession(session);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidWalletAddress(body.walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const escrowSessionId = parseEscrowSessionId(body.escrowSessionId);
  if (!escrowSessionId) {
    return NextResponse.json({ error: "Invalid escrow session id." }, { status: 400 });
  }

  if (!validateLockSettlement(body.lockSettlement)) {
    return NextResponse.json(
      { error: "lockSettlement must be escrow-deposit." },
      { status: 400 },
    );
  }

  const startingChips = parseStartingChips(body.startingChips);
  if (startingChips == null) {
    return NextResponse.json({ error: "Invalid starting chips." }, { status: 400 });
  }

  const currentChips = parseCurrentChips(body.currentChips ?? startingChips, startingChips);
  if (currentChips == null) {
    return NextResponse.json({ error: "Invalid current chips." }, { status: 400 });
  }

  const stakeAmountWei = parseStakeAmountWei(body.stakeAmountWei);
  if (!stakeAmountWei) {
    return NextResponse.json({ error: "Invalid stakeAmountWei." }, { status: 400 });
  }

  const depositTxHash = parseDepositTxHash(body.depositTxHash);
  if (!depositTxHash) {
    return NextResponse.json({ error: "Invalid depositTxHash." }, { status: 400 });
  }

  const explicitStatus = body.status
    ? parseArenaSessionStatus(body.status)
    : null;
  if (body.status != null && !explicitStatus) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const handsPlayed = parseNonNegativeInt(body.handsPlayed) ?? 0;
  const wins = parseNonNegativeInt(body.wins) ?? 0;
  const losses = parseNonNegativeInt(body.losses) ?? 0;
  const biggestPot = parseNonNegativeInt(body.biggestPot) ?? 0;

  const now = new Date().toISOString();
  const session = getArenaServerSessionStore().upsert({
    walletAddress: normalizeWalletAddress(body.walletAddress as string),
    escrowSessionId,
    stakeAmountWei,
    startingChips,
    currentChips,
    lockSettlement: "escrow-deposit",
    depositTxHash,
    resolveTxHash: parseOptionalTxHash(body.resolveTxHash),
    claimTxHash: parseOptionalTxHash(body.claimTxHash),
    status: deriveStatusFromChips(currentChips, explicitStatus),
    handsPlayed,
    wins,
    losses,
    biggestPot,
    createdAt: now,
    updatedAt: now,
  });

  return jsonSession(session);
}

export async function PATCH(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidWalletAddress(body.walletAddress)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const escrowSessionId = parseEscrowSessionId(body.escrowSessionId);
  if (!escrowSessionId) {
    return NextResponse.json({ error: "Invalid escrow session id." }, { status: 400 });
  }

  const store = getArenaServerSessionStore();
  const wallet = body.walletAddress as string;
  const existing = store.get(wallet, escrowSessionId);
  if (!existing) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (body.latestHandResult != null) {
    const parsedHand = parseLatestHandResult(body.latestHandResult);
    if ("error" in parsedHand) {
      return NextResponse.json({ error: parsedHand.error }, { status: 400 });
    }

    const update: Parameters<typeof store.patch>[2] = {};

    if (body.currentChips != null) {
      const currentChips = parseCurrentChips(body.currentChips, existing.startingChips);
      if (currentChips == null) {
        return NextResponse.json({ error: "Invalid current chips." }, { status: 400 });
      }
      parsedHand.finalChips = currentChips;
      update.currentChips = currentChips;
    }

    const appended = store.appendHandResult(wallet, escrowSessionId, parsedHand);
    if (!appended) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    let session = appended;

    if (body.status != null) {
      const status = parseArenaSessionStatus(body.status);
      if (!status) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      session =
        store.patch(wallet, escrowSessionId, { status }) ?? session;
    } else if (update.currentChips != null) {
      session =
        store.patch(wallet, escrowSessionId, {
          status: deriveStatusFromChips(update.currentChips),
        }) ?? session;
    }

    return jsonSession(session);
  }

  const update: Parameters<typeof store.patch>[2] = {};

  if (body.currentChips != null) {
    const currentChips = parseCurrentChips(body.currentChips, existing.startingChips);
    if (currentChips == null) {
      return NextResponse.json({ error: "Invalid current chips." }, { status: 400 });
    }
    update.currentChips = currentChips;
  }

  if (body.status != null) {
    const status = parseArenaSessionStatus(body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = status;
  } else if (update.currentChips != null) {
    update.status = deriveStatusFromChips(update.currentChips);
  }

  const resolveTxHash = parseOptionalTxHash(body.resolveTxHash);
  if (body.resolveTxHash != null && !resolveTxHash) {
    return NextResponse.json({ error: "Invalid resolveTxHash." }, { status: 400 });
  }
  if (resolveTxHash) update.resolveTxHash = resolveTxHash;

  const claimTxHash = parseOptionalTxHash(body.claimTxHash);
  if (body.claimTxHash != null && !claimTxHash) {
    return NextResponse.json({ error: "Invalid claimTxHash." }, { status: 400 });
  }
  if (claimTxHash) update.claimTxHash = claimTxHash;

  if (body.handsPlayed != null) {
    const handsPlayed = parseNonNegativeInt(body.handsPlayed);
    if (handsPlayed == null) {
      return NextResponse.json({ error: "Invalid handsPlayed." }, { status: 400 });
    }
    update.handsPlayed = handsPlayed;
  }

  if (body.wins != null) {
    const wins = parseNonNegativeInt(body.wins);
    if (wins == null) {
      return NextResponse.json({ error: "Invalid wins." }, { status: 400 });
    }
    update.wins = wins;
  }

  if (body.losses != null) {
    const losses = parseNonNegativeInt(body.losses);
    if (losses == null) {
      return NextResponse.json({ error: "Invalid losses." }, { status: 400 });
    }
    update.losses = losses;
  }

  if (body.biggestPot != null) {
    const biggestPot = parseNonNegativeInt(body.biggestPot);
    if (biggestPot == null) {
      return NextResponse.json({ error: "Invalid biggestPot." }, { status: 400 });
    }
    update.biggestPot = biggestPot;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const session = store.patch(
    body.walletAddress as string,
    escrowSessionId,
    update,
  );

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  return jsonSession(session);
}
