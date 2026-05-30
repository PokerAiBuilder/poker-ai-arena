import { cn } from "@/lib/utils";

type ChipStackProps = {
  amount: number | string;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const chipColors = ["bg-red-600", "bg-blue-600", "bg-casino-gold", "bg-emerald-600"];

export function ChipStack({
  amount,
  size = "md",
  label,
  className,
}: ChipStackProps) {
  const display =
    typeof amount === "number" ? amount.toLocaleString() : amount;

  const chipSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[size];

  const textSize = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  }[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex items-end">
        {chipColors.slice(0, 3).map((color, i) => (
          <div
            key={color}
            className={cn(
              "rounded-full border border-white/30 shadow-sm",
              chipSize,
              color,
              i > 0 && "-ml-1.5",
            )}
            style={{ zIndex: i }}
          />
        ))}
      </div>
      <div className={cn("font-semibold tabular-nums text-casino-goldLight", textSize)}>
        {label ? (
          <span className="mr-1 text-[9px] uppercase tracking-wider text-white/40">
            {label}
          </span>
        ) : null}
        {display}
      </div>
    </div>
  );
}
