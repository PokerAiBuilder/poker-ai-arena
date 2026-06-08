import { NextResponse } from "next/server";
import { applyServerChipsToResolveRequest } from "@/lib/arena/arenaSessionResolve";
import { getArenaServerSessionStore } from "@/lib/arena/arenaServerSessionStore";
import {
  getEscrowServerConfig,
  readEscrowContractBalanceServer,
  readEscrowSessionServer,
  resolveEscrowSessionServer,
} from "@/lib/onchain/escrowServer";
import {
  validateEscrowResolveRequest,
  type EscrowResolveRequestBody,
} from "@/lib/stake/escrowResolveValidation";

export async function GET() {
  const config = getEscrowServerConfig();
  return NextResponse.json({
    configured: config.configured,
    escrowAddress: config.escrowAddress,
    hasDeployerKey: config.hasDeployerKey,
    hasRpc: Boolean(config.rpcUrl),
    mode: "testnet-server-resolver",
    note: config.configured
      ? "Server can resolve escrow sessions as contract owner."
      : "Set TESTNET_DEPLOYER_PRIVATE_KEY, BASE_SEPOLIA_RPC_URL, and escrow address.",
  });
}

export async function POST(request: Request) {
  const config = getEscrowServerConfig();
  if (!config.configured) {
    return NextResponse.json(
      { error: "Resolver not configured", configured: false },
      { status: 503 },
    );
  }

  let body: EscrowResolveRequestBody;
  try {
    body = (await request.json()) as EscrowResolveRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const onChain = await readEscrowSessionServer(body.sessionId);
  const contractBalance = await readEscrowContractBalanceServer();

  const stored = getArenaServerSessionStore().get(
    body.walletAddress,
    body.sessionId,
  );
  const { body: resolveBody, chipSource } = applyServerChipsToResolveRequest(
    body,
    stored,
  );
  const validation = validateEscrowResolveRequest(
    resolveBody,
    onChain,
    contractBalance,
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const liquidityPayload = {
    estimatedPayoutWei: validation.estimatedPayoutWei.toString(),
    cappedPayoutWei: validation.cappedPayoutWei.toString(),
    wasPayoutCapped: validation.wasPayoutCapped,
    escrowBalanceWei: validation.escrowBalanceWei.toString(),
  };

  if (validation.alreadyResolved) {
    if (stored) {
      getArenaServerSessionStore().patch(
        validation.walletAddress,
        validation.sessionId.toString(),
        {
          currentChips: validation.currentChips,
          status: "resolved",
        },
      );
    }

    return NextResponse.json({
      sessionId: validation.sessionId.toString(),
      txHash: null,
      payoutAmountWei: validation.payoutAmountWei.toString(),
      ...liquidityPayload,
      resultHash: validation.resultHash,
      status: "resolved" as const,
      alreadyResolved: true,
      chipSource,
    });
  }

  try {
    const result = await resolveEscrowSessionServer(
      validation.sessionId,
      validation.resultHash,
      validation.payoutAmountWei,
    );

    if (stored) {
      getArenaServerSessionStore().patch(
        validation.walletAddress,
        validation.sessionId.toString(),
        {
          currentChips: validation.currentChips,
          status: "resolved",
          resolveTxHash: result.txHash ?? undefined,
        },
      );
    }

    return NextResponse.json({
      ...result,
      ...liquidityPayload,
      chipSource,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Escrow resolve transaction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
