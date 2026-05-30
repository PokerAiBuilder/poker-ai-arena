import { cn } from "@/lib/utils";

type ChipStackProps = {
  amount: number | string;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** Decorative chip icons — off for pot / tight seat zones */
  showIcons?: boolean;
  className?: string;
};

const chipColors = ["bg-red-600", "bg-blue-600", "bg-casino-gold", "bg-emerald-600"];

export function ChipStack({
  amount,
  size = "md",
  label,
  showIcons = true,
  className,
}: ChipStackProps) {
  const display =
    typeof amount === "number" ? amount.toLocaleString() : amount;

  const chipSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  }[size];

  const textSize = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  }[size];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {showIcons ? (
        <div className="relative flex shrink-0 items-end">
          {chipColors.slice(0, 2).map((color, i) => (
            <div
              key={color}
              className={cn(
                "rounded-full border border-white/30 shadow-sm",
                chipSize,
                color,
                i > 0 && "-ml-1",
              )}
              style={{ zIndex: i }}
            />
          ))}
        </div>
      ) : null}
      <div className={cn("font-semibold tabular-nums text-casino-goldLight", textSize)}>
        {label ? (
          <span className="mr-1 text-[9px] uppercase tracking-wider text-white/50">
            {label}
          </span>
        ) : null}
        {display}
      </div>
    </div>
  );
}
