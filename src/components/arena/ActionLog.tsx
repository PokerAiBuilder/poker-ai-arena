import {
  CircleDollarSign,
  Crown,
  Eye,
  Hand,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import type { GameAction } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

type ActionLogProps = {
  entries: GameAction[];
  className?: string;
};

function actionIcon(action: GameAction["action"]) {
  switch (action) {
    case "deal":
      return Sparkles;
    case "fold":
      return Hand;
    case "check":
    case "call":
      return CircleDollarSign;
    case "raise":
    case "all-in":
      return Swords;
    case "showdown":
      return Eye;
    case "blind":
      return CircleDollarSign;
    default:
      return Sparkles;
  }
}

function isWinMessage(message: string): boolean {
  return message.toLowerCase().includes("wins");
}

function isErrorMessage(message: string): boolean {
  return message.startsWith("Error:");
}

export function ActionLog({ entries, className }: ActionLogProps) {
  return (
    <div
      className={cn(
        "glass-panel overflow-hidden rounded-2xl border border-white/10 shadow-lg",
        className,
      )}
    >
      <div className="border-b border-white/5 px-4 py-3">
        <h3 className="text-sm font-semibold text-casino-goldLight">Action Log</h3>
        <p className="text-[10px] text-muted-foreground">Live hand feed</p>
      </div>

      <div className="max-h-[280px] space-y-1 overflow-y-auto p-3">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No activity yet. Unlock the arena and run a simulation.
          </p>
        ) : (
          entries.map((entry, index) => {
            const isError = isErrorMessage(entry.message);
            const Icon = isError
              ? Hand
              : isWinMessage(entry.message)
                ? Trophy
                : actionIcon(entry.action);
            const highlight =
              !isError &&
              (entry.stage === "showdown" || isWinMessage(entry.message));

            return (
              <div
                key={`${entry.timestamp}-${index}`}
                className={cn(
                  "flex gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/5",
                  isError && "bg-red-500/10",
                  highlight && "bg-casino-gold/5",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                    isError &&
                      "border-red-500/40 bg-red-500/10 text-red-300",
                    highlight &&
                      !isError &&
                      "border-casino-gold/40 bg-casino-gold/10 text-casino-goldLight",
                    !highlight &&
                      !isError &&
                      "border-white/10 bg-white/5 text-muted-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      isError && "text-red-300",
                      highlight && !isError && "text-casino-goldLight",
                      !highlight && !isError && "text-muted-foreground",
                    )}
                  >
                    {entry.message}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-white/30">
                    {entry.stage}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
