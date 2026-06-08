import { expect } from "chai";

/** Mirrors arena session validation + resolve chip preference for hardhat tests. */
function isValidWalletAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function parseCurrentChips(value: number, startingChips: number): number | null {
  const chips = Math.floor(Number(value));
  if (!Number.isFinite(chips) || chips < 0) return null;
  if (chips > startingChips * 10) return null;
  return chips;
}

type StoredSession = {
  walletAddress: string;
  escrowSessionId: string;
  startingChips: number;
  currentChips: number;
  lockSettlement: "escrow-deposit";
};

function applyServerChipsToResolveRequest(
  clientCurrent: number,
  clientStarting: number,
  stored: StoredSession | null,
  sessionId: string,
): { currentChips: number; startingChips: number; chipSource: "server" | "client" } {
  if (
    !stored ||
    stored.lockSettlement !== "escrow-deposit" ||
    stored.escrowSessionId !== sessionId
  ) {
    return {
      currentChips: clientCurrent,
      startingChips: clientStarting,
      chipSource: "client",
    };
  }
  return {
    currentChips: stored.currentChips,
    startingChips: stored.startingChips,
    chipSource: "server",
  };
}

function createSession(input: {
  walletAddress: string;
  escrowSessionId: string;
  startingChips: number;
  currentChips: number;
}): StoredSession | { error: string } {
  if (!isValidWalletAddress(input.walletAddress)) {
    return { error: "Invalid wallet address." };
  }
  if (!/^\d+$/.test(input.escrowSessionId)) {
    return { error: "Invalid escrow session id." };
  }
  const startingChips = Math.floor(input.startingChips);
  if (startingChips <= 0) return { error: "Invalid starting chips." };
  const currentChips = parseCurrentChips(input.currentChips, startingChips);
  if (currentChips == null) return { error: "Invalid current chips." };

  return {
    walletAddress: input.walletAddress.toLowerCase(),
    escrowSessionId: input.escrowSessionId,
    startingChips,
    currentChips,
    lockSettlement: "escrow-deposit",
  };
}

describe("arena server session", function () {
  const wallet = "0x1234567890123456789012345678901234567890";

  it("creates a valid escrow session record", function () {
    const session = createSession({
      walletAddress: wallet,
      escrowSessionId: "42",
      startingChips: 250,
      currentChips: 250,
    });
    expect(session).to.not.have.property("error");
    expect((session as StoredSession).currentChips).to.equal(250);
  });

  it("rejects invalid current chips", function () {
    const session = createSession({
      walletAddress: wallet,
      escrowSessionId: "42",
      startingChips: 250,
      currentChips: -5,
    });
    expect(session).to.deep.equal({ error: "Invalid current chips." });
  });

  it("rejects chips above safe cap", function () {
    const session = createSession({
      walletAddress: wallet,
      escrowSessionId: "42",
      startingChips: 100,
      currentChips: 5000,
    });
    expect(session).to.deep.equal({ error: "Invalid current chips." });
  });

  it("resolver prefers server-stored chips over client values", function () {
    const stored: StoredSession = {
      walletAddress: wallet.toLowerCase(),
      escrowSessionId: "7",
      startingChips: 250,
      currentChips: 120,
      lockSettlement: "escrow-deposit",
    };
    const resolved = applyServerChipsToResolveRequest(
      9999,
      250,
      stored,
      "7",
    );
    expect(resolved.chipSource).to.equal("server");
    expect(resolved.currentChips).to.equal(120);
    expect(resolved.startingChips).to.equal(250);
  });

  it("falls back to client chips when no server session exists", function () {
    const resolved = applyServerChipsToResolveRequest(180, 250, null, "7");
    expect(resolved.chipSource).to.equal("client");
    expect(resolved.currentChips).to.equal(180);
    expect(resolved.startingChips).to.equal(250);
  });

  it("updates depleted status when chips reach zero", function () {
    const session = createSession({
      walletAddress: wallet,
      escrowSessionId: "9",
      startingChips: 250,
      currentChips: 0,
    }) as StoredSession;
    const status = session.currentChips <= 0 ? "depleted" : "active";
    expect(status).to.equal("depleted");
  });
});
