import { cn } from "@/lib/utils";

type PokerActionKind = "fold" | "call" | "allin";

/** Visual states for Human vs AI poker actions (no logic). */
export function pokerActionButtonClass(
  enabled: boolean,
  humanTurnActive: boolean | undefined,
  kind: PokerActionKind,
  extra?: string,
): string {
  const disabled = !humanTurnActive || !enabled;
  return cn(
    disabled && "arena-poker-btn--disabled",
    !disabled && kind === "fold" && "arena-poker-btn--fold-active",
    !disabled && kind === "allin" && "arena-poker-btn--allin-active",
    !disabled && kind === "call" && "arena-poker-btn--call-active",
    extra,
  );
}
