import { cn } from "@/lib/utils";
import type { Suit } from "@/lib/poker/types";

export type PlayingCardProps = {
  rank?: string;
  suit?: Suit;
  faceDown?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
  /** Turn/River placeholders — not dealt in MVP */
  locked?: boolean;
  lockedLabel?: string;
  /** Folded or inactive — reduced emphasis */
  dimmed?: boolean;
};

const suitColors: Record<Suit, string> = {
  hearts: "text-red-600",
  diamonds: "text-red-600",
  clubs: "text-slate-900",
  spades: "text-slate-900",
};

const suitSymbols: Record<Suit, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

const sizeClasses = {
  xs: "h-[3rem] w-[1.85rem] text-[8px]",
  sm: "h-[4rem] w-[2.5rem] text-[9px]",
  md: "h-[5rem] w-[3.1rem] text-[10px]",
  lg: "h-[6.5rem] w-[4rem] text-xs",
};

const centerSuitSize = {
  xs: "text-lg",
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
};

export function PlayingCard({
  rank = "A",
  suit = "spades",
  faceDown = false,
  size = "md",
  className,
  animate = true,
  locked = false,
  lockedLabel,
  dimmed = false,
}: PlayingCardProps) {
  if (locked) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/25 bg-black/40 text-white/40 shadow-md",
          sizeClasses[size],
          dimmed && "opacity-40",
          className,
        )}
        aria-label={lockedLabel ? `${lockedLabel} not dealt` : "Street not dealt in MVP"}
      >
        <span className="text-[10px] leading-none opacity-70">{"\u{1F512}"}</span>
        {lockedLabel ? (
          <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-wide">
            {lockedLabel}
          </span>
        ) : null}
      </div>
    );
  }

  if (faceDown) {
    return (
      <div
        className={cn(
          "relative z-[1] overflow-hidden rounded-lg border-2 border-[var(--arena-cyan)]/35 shadow-lg",
          sizeClasses[size],
          animate && "animate-card-deal",
          dimmed && "opacity-45 saturate-50",
          className,
        )}
        aria-label="Face down card"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900" />
        <div
          className="absolute inset-1 rounded-md border border-white/10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(34,211,238,0.12) 0, rgba(34,211,238,0.12) 2px, transparent 2px, transparent 8px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[var(--arena-cyan)]/40">
          <span className={cn(size === "xs" ? "text-sm" : "text-lg")}>{"\u2660"}</span>
        </div>
      </div>
    );
  }

  const color = suitColors[suit];
  const symbol = suitSymbols[suit];

  return (
    <div
      className={cn(
        "relative z-[1] overflow-hidden rounded-lg border border-slate-200/90 bg-white font-bold shadow-[0_6px_18px_rgba(0,0,0,0.35)]",
        sizeClasses[size],
        animate && "animate-card-deal",
        dimmed && "opacity-45 saturate-50",
        className,
      )}
    >
      <div className={cn("absolute left-1 top-0.5 flex flex-col leading-none", color)}>
        <span>{rank}</span>
        <span className={cn(size === "xs" ? "text-[9px]" : "text-sm")}>{symbol}</span>
      </div>

      <div
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 leading-none",
          color,
          centerSuitSize[size],
        )}
      >
        {symbol}
      </div>

      <div
        className={cn(
          "absolute bottom-0.5 right-1 flex rotate-180 flex-col leading-none",
          color,
        )}
      >
        <span>{rank}</span>
        <span className={cn(size === "xs" ? "text-[9px]" : "text-sm")}>{symbol}</span>
      </div>
    </div>
  );
}
