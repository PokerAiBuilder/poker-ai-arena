export type LockStakePhase =
  | "idle"
  | "awaiting_wallet"
  | "submitted"
  | "confirming"
  | "locked"
  | "rejected"
  | "failed";

export function getLockStakePhaseLabel(phase: LockStakePhase): string | null {
  switch (phase) {
    case "awaiting_wallet":
      return "Awaiting wallet confirmation…";
    case "submitted":
      return "Transaction submitted…";
    case "confirming":
      return "Confirming on Base Sepolia…";
    case "locked":
      return "Stake locked on Base Sepolia";
    case "rejected":
      return "Transaction rejected in wallet";
    case "failed":
      return "Transaction failed";
    default:
      return null;
  }
}

export function isUserRejectedTransactionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: number; name?: string; message?: string };
  return (
    candidate.code === 4001 ||
    candidate.name === "UserRejectedRequestError" ||
    /user rejected|denied transaction|cancelled|canceled|rejected the request/i.test(
      candidate.message ?? "",
    )
  );
}
