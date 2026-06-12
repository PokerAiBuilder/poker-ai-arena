import { normalizeAgentStyleBadge } from "@/lib/arena/agentBattleDisplay";
import { cn } from "@/lib/utils";
import { ChipStack } from "@/components/arena/ChipStack";
import type { AgentStrategy } from "@/lib/agents/agentTypes";

export type AgentStatus = "active" | "folded" | "winner" | "idle";

export type AgentAvatarProps = {
  name: string;
  avatar: string;
  strategy?: AgentStrategy | string;
  stack: number;
  status?: AgentStatus;
  compact?: boolean;
  /** Text-only stack in tight heads-up zones (avoids chip overlap) */
  stackTextOnly?: boolean;
  /** Softer folded styling for spectator tables */
  readableFold?: boolean;
  /** Agent Battle personality badge (Balanced, Bluffy, …) */
  styleBadge?: string;
  className?: string;
};

const strategyLabels: Record<string, string> = {
  balanced: "Balanced",
  tight: "Tight",
  aggressive: "Aggressive",
  bluff: "Bluff",
};

export function AgentAvatar({
  name,
  avatar,
  strategy,
  stack,
  status = "idle",
  compact = false,
  stackTextOnly = false,
  readableFold = false,
  styleBadge,
  className,
}: AgentAvatarProps) {
  const strategyLine =
    normalizeAgentStyleBadge(styleBadge) ??
    (strategy ? (strategyLabels[strategy] ?? strategy) : undefined);
  const hoverTitle = styleBadge
    ? `${name} — ${styleBadge} style`
    : strategy
      ? `${name} — ${strategyLabels[strategy] ?? strategy}`
      : name;
  const isWinner = status === "winner";
  const isActive = status === "active";
  const isFolded = status === "folded";
  const isIdle = status === "idle";

  const statusLabel = isFolded
    ? "Folded"
    : isWinner
      ? "Winner"
      : isActive
        ? "Active"
        : null;

  return (
    <div
      title={hoverTitle}
      className={cn(
        "arena-seat-panel relative z-[2] flex flex-col items-center gap-0.5 rounded-xl border bg-black/45 px-1.5 py-1 backdrop-blur-md transition-[border-color,box-shadow,opacity]",
        compact && "h-[5.5rem] w-[4.75rem] min-w-[4.75rem] max-h-[5.5rem]",
        !compact && "h-[5.5rem] w-[6rem] min-w-[6rem] max-h-[5.5rem]",
        isActive &&
          "border-cyan-400/45 shadow-[0_0_12px_rgba(34,211,238,0.16)]",
        isWinner &&
          "border-[var(--arena-gold-accent)]/55 shadow-[0_0_16px_rgba(212,175,55,0.18)]",
        !isActive &&
          !isWinner &&
          (isFolded
            ? readableFold
              ? "border-white/12 opacity-90"
              : "border-white/10 opacity-65"
            : "border-[rgb(34_211_238_/_0.12)]"),
        isIdle && !isWinner && !isFolded && "opacity-80",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-bold",
          isWinner &&
            "border-[var(--arena-gold-accent)]/60 text-[var(--arena-gold-accent)] shadow-[0_0_10px_rgba(212,175,55,0.22)]",
          !isWinner && isActive && "border-cyan-400/60",
          !isWinner && !isActive && "border-white/20",
          isFolded && (readableFold ? "grayscale-[0.35]" : "grayscale"),
        )}
      >
        {avatar.length <= 2 ? avatar : <span className="text-lg">{avatar}</span>}
      </div>

      <div className="text-center">
        <p
          className={cn(
            "max-w-full truncate font-semibold leading-tight text-white",
            compact ? "text-[9px]" : "text-[11px]",
            isFolded && (readableFold ? "text-white/90" : "text-white/50"),
          )}
        >
          {name}
        </p>
        {strategyLine && !isFolded ? (
          <p className="max-w-full truncate text-[8px] uppercase tracking-wider text-[var(--arena-muted)]">
            {strategyLine}
          </p>
        ) : (
          <span className="block h-[10px]" aria-hidden />
        )}
      </div>

      {stackTextOnly ? (
        <p
          className={cn(
            "text-[9px] font-semibold tabular-nums leading-none text-[var(--arena-cyan)]",
            isFolded && readableFold && "text-[var(--arena-cyan)]/75",
          )}
        >
          {stack.toLocaleString()}
        </p>
      ) : (
        <ChipStack amount={stack} size="sm" />
      )}

      <div className="flex min-h-[1.125rem] w-full items-center justify-center">
        {statusLabel === "Folded" ? (
          <span className="rounded border border-red-400/40 bg-red-950/60 px-1 py-0.5 text-[7px] font-bold uppercase tracking-widest text-red-300">
            Folded
          </span>
        ) : statusLabel === "Winner" ? (
          <span className="rounded border border-[var(--arena-gold-accent)]/50 bg-[var(--arena-gold-accent)]/15 px-1 py-0.5 text-[7px] font-bold uppercase tracking-widest text-[var(--arena-gold-accent)]">
            Winner
          </span>
        ) : statusLabel === "Active" ? (
          <span className="rounded bg-cyan-500/15 px-1 py-0.5 text-[7px] font-semibold uppercase tracking-wider text-cyan-300">
            Active
          </span>
        ) : (
          <span className="h-[1.125rem]" aria-hidden />
        )}
      </div>
    </div>
  );
}
