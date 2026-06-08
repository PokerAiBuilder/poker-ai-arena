import type { ArenaServerSession } from "@/lib/arena/arenaServerSessionTypes";
import type { EscrowResolveRequestBody } from "@/lib/stake/escrowResolveValidation";

export type EscrowResolveChipSource = "server" | "client";

/**
 * Prefer server-persisted chip counts for escrow resolve when available.
 * Falls back to client-reported chips for legacy local-only sessions.
 *
 * TODO(testnet): remove client chip trust once all sessions sync server-side.
 */
export function applyServerChipsToResolveRequest(
  body: EscrowResolveRequestBody,
  stored: ArenaServerSession | null,
): {
  body: EscrowResolveRequestBody;
  chipSource: EscrowResolveChipSource;
} {
  if (
    !stored ||
    stored.lockSettlement !== "escrow-deposit" ||
    stored.escrowSessionId !== String(body.sessionId).trim()
  ) {
    return { body, chipSource: "client" };
  }

  return {
    body: {
      ...body,
      currentChips: stored.currentChips,
      startingChips: stored.startingChips,
      lockSettlement: "escrow-deposit",
    },
    chipSource: "server",
  };
}
