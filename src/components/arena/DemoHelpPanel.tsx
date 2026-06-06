import { ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

const STAKE_FLOW_STEPS = [
  "Connect wallet on Base Sepolia (optional mock session without wallet)",
  "Choose test stake — $0.10 / $0.25 / $0.50 / $1.00 test tiers",
  "Lock test stake — Base Sepolia test ETH transfer or mock session",
  "Play vs PokerMaster — chips come from your locked stake",
  "Choose Fold / Call / Check / Raise on your turn",
  "Current chips update through hand results — cash out when ready",
  "Try AI Agent Battle — full-board spectator simulation (watch only)",
  "Open Arena Menu for Action Log, stats, and full AI reasoning",
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
          Testnet stake flow
        </p>
      </div>
      <ol className="mt-3 space-y-1.5 text-left text-xs leading-relaxed text-muted-foreground">
        {STAKE_FLOW_STEPS.map((step, index) => (
          <li key={step} className="flex gap-2">
            <span className="shrink-0 font-semibold tabular-nums text-emerald-400/90">
              {index + 1}.
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-[10px] leading-relaxed text-white/45">
        Human vs AI is playable · AI Agent Battle is spectator-only · Test
        tokens only · No mainnet funds
      </p>
      <p className="mt-2 text-center text-[10px] leading-relaxed text-violet-200/55">
        Testnet payout receipt coming soon. Agent Battle uses a shared server
        timeline — multiple viewers watch the same AI hand.
      </p>
    </div>
  );
}
