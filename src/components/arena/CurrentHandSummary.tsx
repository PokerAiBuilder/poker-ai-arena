"use client";

import { cn } from "@/lib/utils";

type CurrentHandSummaryProps = {
  handNumber?: number | null;
  street?: string;
  pot?: number;
  humanChips?: number;
  inProgress?: boolean;
  className?: string;
};

export function CurrentHandSummary({
  handNumber,
  street,
  pot,
  humanChips,
  inProgress = false,
  className,
}: CurrentHandSummaryProps) {
  if (!inProgress) {
    return (
      <p className={cn("text-[10px] leading-snug text-white/45", className)}>
        Start a hand to see live actions below.
      </p>
    );
  }

  const parts: string[] = [];
  if (handNumber != null) parts.push(`Hand #${handNumber}`);
  if (street) parts.push(street);
  if (pot != null && pot > 0) parts.push(`Pot ${pot.toLocaleString()}`);
  if (humanChips != null) parts.push(`Your stack ${humanChips.toLocaleString()}`);

  return (
    <p className={cn("text-[10px] leading-snug text-white/70", className)}>
      {parts.length > 0 ? parts.join(" · ") : "Hand in progress"}
    </p>
  );
}
