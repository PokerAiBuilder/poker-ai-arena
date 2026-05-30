import type { AgentDecision, AgentInput } from "@/lib/agents/agentTypes";
import { decidePokerAction } from "@/lib/agents/rulesBasedStrategy";

export const PokerMaster = {
  id: "poker-master",
  name: "PokerMaster",
  avatar: "\u2660\uFE0F",
  strategy: "balanced" as const,
};

export function getPokerMasterDecision(
  input: Omit<AgentInput, "agentId" | "agentName" | "strategy">,
): AgentDecision {
  return decidePokerAction({
    ...input,
    agentId: PokerMaster.id,
    agentName: PokerMaster.name,
    strategy: PokerMaster.strategy,
  });
}
