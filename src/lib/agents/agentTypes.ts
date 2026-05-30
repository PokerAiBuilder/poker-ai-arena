import type { Card, GameAction, GameStage } from "@/lib/poker/types";

export type AgentAction = "fold" | "check" | "call" | "raise" | "all-in";

export type AgentStrategy = "tight" | "balanced" | "aggressive" | "bluff";

export type AgentInput = {
  agentId: string;
  agentName: string;
  holeCards: Card[];
  communityCards: Card[];
  currentBet: number;
  amountToCall: number;
  minRaise: number;
  stack: number;
  pot: number;
  position: string;
  gameStage: GameStage;
  previousActions: GameAction[];
  strategy: AgentStrategy;
};

export type AgentDecision = {
  action: AgentAction;
  amount?: number;
  confidence: number;
  reasoning: string;
};

export type PokerAgentDef = {
  id: string;
  name: string;
  avatar: string;
  strategy: AgentStrategy;
};

export type AgentDecisionRecord = {
  agentId: string;
  agentName: string;
  strategy: AgentStrategy;
  stage: GameStage;
  action: AgentAction;
  amount?: number;
  confidence: number;
  reasoning: string;
};

export type AgentSelfCheckScenario = {
  name: string;
  input: AgentInput;
  decision: AgentDecision;
};
