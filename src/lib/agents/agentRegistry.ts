import type {
  AgentDecision,
  AgentInput,
  AgentSelfCheckScenario,
  PokerAgentDef,
} from "@/lib/agents/agentTypes";
import { PokerMaster, getPokerMasterDecision } from "@/lib/agents/pokerMaster";
import { decidePokerAction } from "@/lib/agents/rulesBasedStrategy";

export const BluffBot: PokerAgentDef = {
  id: "bluff-bot",
  name: "BluffBot",
  avatar: "🎭",
  strategy: "bluff",
};

export const RiverMind: PokerAgentDef = {
  id: "river-mind",
  name: "RiverMind",
  avatar: "🌊",
  strategy: "tight",
};

export const ChipHunter: PokerAgentDef = {
  id: "chip-hunter",
  name: "ChipHunter",
  avatar: "🎯",
  strategy: "aggressive",
};

export const AGENT_REGISTRY: PokerAgentDef[] = [
  PokerMaster,
  BluffBot,
  RiverMind,
  ChipHunter,
];

export function getAgentById(agentId: string): PokerAgentDef | undefined {
  return AGENT_REGISTRY.find((agent) => agent.id === agentId);
}

export function getAgentDecision(
  agentId: string,
  input: Omit<AgentInput, "agentId" | "agentName" | "strategy">,
): AgentDecision {
  if (agentId === PokerMaster.id) {
    return getPokerMasterDecision(input);
  }

  const agent = getAgentById(agentId);
  if (!agent) {
    throw new Error(`Unknown agent: ${agentId}`);
  }

  return decidePokerAction({
    ...input,
    agentId: agent.id,
    agentName: agent.name,
    strategy: agent.strategy,
  });
}

function baseScenarioInput(
  overrides: Partial<AgentInput> & Pick<AgentInput, "agentId" | "agentName" | "strategy" | "holeCards">,
): AgentInput {
  return {
    communityCards: [],
    currentBet: 20,
    amountToCall: 10,
    minRaise: 10,
    stack: 500,
    pot: 30,
    position: "button",
    gameStage: "preflop",
    previousActions: [],
    ...overrides,
  };
}

/** Debug helper — runs fixed agent scenarios. */
export function runAgentSelfCheck(): AgentSelfCheckScenario[] {
  const scenarios: Array<{ name: string; input: AgentInput }> = [
    {
      name: "strong hand — pocket aces",
      input: baseScenarioInput({
        agentId: PokerMaster.id,
        agentName: PokerMaster.name,
        strategy: PokerMaster.strategy,
        holeCards: [
          { rank: "A", suit: "spades" },
          { rank: "A", suit: "hearts" },
        ],
        amountToCall: 0,
        currentBet: 10,
      }),
    },
    {
      name: "weak hand — seven-deuce offsuit",
      input: baseScenarioInput({
        agentId: PokerMaster.id,
        agentName: PokerMaster.name,
        strategy: PokerMaster.strategy,
        holeCards: [
          { rank: "7", suit: "clubs" },
          { rank: "2", suit: "diamonds" },
        ],
        amountToCall: 30,
        currentBet: 40,
      }),
    },
    {
      name: "suited hand — king-ten suited",
      input: baseScenarioInput({
        agentId: PokerMaster.id,
        agentName: PokerMaster.name,
        strategy: PokerMaster.strategy,
        holeCards: [
          { rank: "K", suit: "hearts" },
          { rank: "10", suit: "hearts" },
        ],
        amountToCall: 10,
        currentBet: 20,
      }),
    },
    {
      name: "short stack all-in — pocket kings",
      input: baseScenarioInput({
        agentId: PokerMaster.id,
        agentName: PokerMaster.name,
        strategy: PokerMaster.strategy,
        holeCards: [
          { rank: "K", suit: "spades" },
          { rank: "K", suit: "diamonds" },
        ],
        stack: 25,
        minRaise: 10,
        amountToCall: 0,
        currentBet: 10,
      }),
    },
    {
      name: "bluff strategy — weak hand",
      input: baseScenarioInput({
        agentId: BluffBot.id,
        agentName: BluffBot.name,
        strategy: BluffBot.strategy,
        holeCards: [
          { rank: "9", suit: "clubs" },
          { rank: "4", suit: "diamonds" },
        ],
        amountToCall: 0,
        currentBet: 10,
      }),
    },
    {
      name: "flop — top pair",
      input: baseScenarioInput({
        agentId: PokerMaster.id,
        agentName: PokerMaster.name,
        strategy: PokerMaster.strategy,
        holeCards: [
          { rank: "A", suit: "hearts" },
          { rank: "K", suit: "diamonds" },
        ],
        communityCards: [
          { rank: "A", suit: "clubs" },
          { rank: "8", suit: "spades" },
          { rank: "3", suit: "hearts" },
        ],
        gameStage: "flop",
        amountToCall: 0,
        currentBet: 10,
      }),
    },
  ];

  const results: AgentSelfCheckScenario[] = scenarios.map((scenario) => ({
    name: scenario.name,
    input: scenario.input,
    decision: decidePokerAction(scenario.input),
  }));

  if (process.env.NODE_ENV !== "production") {
    console.debug(
      "[agents] self-check",
      results.map((r) => ({
        name: r.name,
        action: r.decision.action,
        confidence: r.decision.confidence,
        reasoning: r.decision.reasoning,
      })),
    );
  }

  return results;
}
