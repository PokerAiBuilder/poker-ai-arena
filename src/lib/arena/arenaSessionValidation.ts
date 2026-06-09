import type { ArenaServerSessionStatus } from "@/lib/arena/arenaServerSessionTypes";
import { ARENA_SERVER_SESSION_STATUSES } from "@/lib/arena/arenaServerSessionTypes";

export const MAX_CHIP_MULTIPLIER = 10;

export type ValidationError = { ok: false; status: number; error: string };
export type ValidationOk<T> = { ok: true; value: T };

export function isValidWalletAddress(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^0x[a-fA-F0-9]{40}$/.test(value.trim())
  );
}

export function normalizeWalletAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function parseEscrowSessionId(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) return null;
  try {
    const id = BigInt(raw);
    if (id <= BigInt(0)) return null;
    return id.toString();
  } catch {
    return null;
  }
}

export function parseStartingChips(value: unknown): number | null {
  const chips = Math.floor(Number(value));
  if (!Number.isFinite(chips) || chips <= 0) return null;
  return chips;
}

export function parseNonNegativeInt(value: unknown): number | null {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseCurrentChips(
  value: unknown,
  startingChips: number,
): number | null {
  const chips = Math.floor(Number(value));
  if (!Number.isFinite(chips) || chips < 0) return null;
  // TODO(v1.3+): signed hand receipts instead of a fixed multiplier cap.
  if (chips > startingChips * MAX_CHIP_MULTIPLIER) return null;
  return chips;
}

export function parseStakeAmountWei(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const raw = String(value).trim();
  if (!/^\d+$/.test(raw)) return null;
  try {
    const wei = BigInt(raw);
    if (wei <= BigInt(0)) return null;
    return wei.toString();
  } catch {
    return null;
  }
}

export function parseDepositTxHash(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const hash = value.trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return null;
  return hash;
}

export function parseOptionalTxHash(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const hash = String(value).trim();
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) return undefined;
  return hash;
}

export function parseArenaSessionStatus(
  value: unknown,
): ArenaServerSessionStatus | null {
  if (typeof value !== "string") return null;
  return ARENA_SERVER_SESSION_STATUSES.includes(value as ArenaServerSessionStatus)
    ? (value as ArenaServerSessionStatus)
    : null;
}

export function validateLockSettlement(
  value: unknown,
): value is "escrow-deposit" {
  return value === "escrow-deposit";
}

export function deriveStatusFromChips(
  currentChips: number,
  explicit?: ArenaServerSessionStatus | null,
): ArenaServerSessionStatus {
  if (explicit) return explicit;
  return currentChips <= 0 ? "depleted" : "active";
}
