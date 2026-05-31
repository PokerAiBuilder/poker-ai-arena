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
    styleBadge ??
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

  return (
    <div
      title={hoverTitle}
      className={cn(
        "relative z-[2] flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/50 px-2 py-1.5 backdrop-blur-md transition-all",
        isActive && "border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.2)]",
        isWinner &&
          "border-casino-gold shadow-[0_0_36px_rgba(212,175,55,0.55)] ring-2 ring-casino-gold/60",
        isFolded &&
          (readableFold
            ? "scale-[0.96] border-white/10 bg-black/45 opacity-90"
            : "scale-[0.92] border-white/5 bg-black/30 opacity-60"),
        isIdle && !isWinner && "opacity-75",
        compact ? "min-w-[76px]" : "min-w-[96px]",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 bg-gradient-to-br from-slate-800 to-slate-950 font-bold transition-shadow",
          compact ? "h-9 w-9 text-sm" : "h-11 w-11 text-base",
          isWinner &&
            "border-casino-gold text-casino-goldLight shadow-[0_0_28px_rgba(212,175,55,0.75)] ring-2 ring-amber-300/50",
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
            "font-semibold leading-tight text-white",
            compact ? "text-[9px]" : "text-[11px]",
            isFolded && (readableFold ? "text-white/90" : "text-white/50"),
          )}
        >
          {name}
        </p>
        {strategyLine && !isFolded ? (
          <p className="text-[8px] uppercase tracking-wider text-casino-gold/70">
            {strategyLine}
          </p>
        ) : null}
      </div>

      {stackTextOnly ? (
        <p
          className={cn(
            "text-[9px] font-semibold tabular-nums leading-none text-casino-goldLight",
            isFolded && readableFold && "text-casino-goldLight/90",
          )}
        >
          {stack.toLocaleString()}
        </p>
      ) : (
        <ChipStack amount={stack} size="sm" />
      )}

      {isFolded ? (
        <span className="rounded border border-red-400/40 bg-red-950/60 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-red-300">
          Folded
        </span>
      ) : null}

      {isWinner ? (
        <span className="rounded border border-casino-gold/50 bg-casino-gold/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-casino-goldLight">
          Winner
        </span>
      ) : null}

      {isActive && !isWinner ? (
        <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-cyan-300">
          Active
        </span>
      ) : null}
    </div>
  );
}
