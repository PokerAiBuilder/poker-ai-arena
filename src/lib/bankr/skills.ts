import { callBankrSkill } from "@/lib/bankr/bankrClient";
import type { BankrSkillCallResult } from "@/lib/bankr/types";

export async function requestWalletSkill(
  params: Record<string, unknown> = {},
): Promise<BankrSkillCallResult> {
  return callBankrSkill({
    skill: "wallet",
    action: "get-status",
    params,
  });
}

export async function requestPaymentSkill(
  params: Record<string, unknown> = {},
): Promise<BankrSkillCallResult> {
  return callBankrSkill({
    skill: "payments",
    action: "prepare-x402-payment",
    params,
  });
}

export async function requestAgentSkill(
  params: Record<string, unknown> = {},
): Promise<BankrSkillCallResult> {
  return callBankrSkill({
    skill: "agent",
    action: "evaluate-poker-state",
    params,
  });
}

export const POKER_MASTER_BANKR_PROFILE = {
  id: "poker-master",
  name: "PokerMaster",
  description: "Rules-based Texas Hold'em agent for Poker AI Arena demo sessions.",
  skills: ["agent", "wallet", "payments"],
  walletRequired: true,
  x402Required: true,
} as const;
