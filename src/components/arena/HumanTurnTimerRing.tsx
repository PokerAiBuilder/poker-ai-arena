import type { ReactNode } from "react";
import { HUMAN_TURN_TIMER_SECONDS } from "@/lib/arena/humanTurnTimer";
import { cn } from "@/lib/utils";

type HumanTurnTimerRingProps = {
  secondsLeft: number;
  className?: string;
  children: ReactNode;
};

export function HumanTurnTimerRing({
  secondsLeft,
  className,
  children,
}: HumanTurnTimerRingProps) {
  const radius = 26;
  const stroke = 3;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.max(0, Math.min(1, secondsLeft / HUMAN_TURN_TIMER_SECONDS));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className="pointer-events-none absolute -inset-2 hidden h-[calc(100%+16px)] w-[calc(100%+16px)] -rotate-90 sm:block"
        aria-hidden
      >
        <circle
          cx="50%"
          cy="50%"
          r={normalizedRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx="50%"
          cy="50%"
          r={normalizedRadius}
          fill="none"
          stroke="rgba(52,211,153,0.85)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      {children}
      <span className="absolute -right-1 -top-1 z-[3] hidden min-w-[1.75rem] rounded-full border border-emerald-400/40 bg-emerald-950/90 px-1 py-0.5 text-center text-[9px] font-bold tabular-nums text-emerald-200 shadow-sm sm:block">
        {String(Math.max(0, secondsLeft)).padStart(2, "0")}s
      </span>
    </div>
  );
}
