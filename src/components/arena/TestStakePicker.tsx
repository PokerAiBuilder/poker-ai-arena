"use client";

import {
  DEFAULT_TEST_STAKE,
  TEST_STAKE_TIERS,
  type TestStakeAmount,
} from "@/lib/stake/testnetStake";
import { cn } from "@/lib/utils";

type TestStakePickerProps = {
  value: TestStakeAmount;
  onChange: (amount: TestStakeAmount) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
};

export function TestStakePicker({
  value = DEFAULT_TEST_STAKE,
  onChange,
  disabled = false,
  compact = false,
  className,
}: TestStakePickerProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Choose stake
      </p>
      <p className="text-[9px] leading-relaxed text-muted-foreground">
        Stake tier → chip stack
      </p>
      <div
        className={cn("grid grid-cols-2 gap-1.5", compact && "gap-1")}
        role="radiogroup"
        aria-label="Choose test stake amount"
      >
        {TEST_STAKE_TIERS.map((tier) => {
          const selected = value === tier.amount;
          return (
            <button
              key={tier.amount}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(tier.amount)}
              className={cn(
                "rounded-lg border px-2 py-1.5 text-left transition-colors",
                compact ? "py-1 text-[10px]" : "text-[11px]",
                selected
                  ? "border-[var(--arena-cyan)]/60 bg-[var(--arena-blue)]/20 text-[var(--arena-cyan)]"
                  : "border-white/10 bg-black/30 text-white/80 hover:border-white/20",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <span className="block font-semibold">{tier.testEthAmount} ETH</span>
              <span className="block text-[9px] opacity-80">
                {tier.chipAmount.toLocaleString()} chips
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
