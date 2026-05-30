import { cn } from "@/lib/utils";

type DemoDisclaimersProps = {
  className?: string;
  compact?: boolean;
};

export function DemoDisclaimers({ className, compact = false }: DemoDisclaimersProps) {
  const items = [
    "Demo chips only",
    "Mock payment flow",
    "No real-money gambling",
  ] as const;

  return (
    <ul
      className={cn(
        "flex flex-wrap justify-center gap-x-3 gap-y-1 text-muted-foreground",
        compact ? "text-[9px] leading-snug" : "text-[10px] leading-relaxed",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex items-center gap-1.5">
          <span className="h-1 w-1 shrink-0 rounded-full bg-casino-gold/50" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}
