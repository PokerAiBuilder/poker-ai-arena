import { ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_STEPS = [
  "Mock Pay Entry Fee",
  "Play vs PokerMaster",
  "Choose Fold / Call / Check / Raise",
  "Reveal Flop / Turn / River",
  "Show Result",
  "Try Agent Battle (spectator)",
] as const;

type DemoHelpPanelProps = {
  className?: string;
};

export function DemoHelpPanel({ className }: DemoHelpPanelProps) {
  return (
    <div
      className={cn(
        "glass-panel rounded-2xl border border-white/10 p-4 shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <ListOrdered className="h-3.5 w-3.5 text-casino-goldLight" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-casino-goldLight/90">
          How to demo
        </p>
      </div>
      <ol className="mt-3 space-y-1.5 text-left text-xs leading-relaxed text-muted-foreground">
        {DEMO_STEPS.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="shrink-0 font-semibold tabular-nums text-emerald-400/90">
              {index + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-white/45">
        Demo chips only · Mock payment flow · No real-money gambling
      </p>
    </div>
  );
}
