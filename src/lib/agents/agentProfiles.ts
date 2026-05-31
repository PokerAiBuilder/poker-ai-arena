import { AGENT_REGISTRY } from "@/lib/agents/agentRegistry";

export type TraitLevel = "low" | "medium" | "medium-high" | "high";

export type AgentProfile = {
  id: string;
  name: string;
  avatar: string;
  title: string;
  styleDescription: string;
  aggression: TraitLevel;
  bluff: TraitLevel;
  range: string;
  signature: string;
  watchFor: string;
  styleBadge: string;
};

const TRAIT_SCORE: Record<TraitLevel, number> = {
  low: 1,
  medium: 2,
  "medium-high": 3,
  high: 4,
};

export function traitLevelScore(level: TraitLevel): number {
  return TRAIT_SCORE[level];
}

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: "poker-master",
    name: "PokerMaster",
    avatar: "♠️",
    title: "Balanced Strategist",
    styleDescription:
      "Balanced and value-oriented — adapts to board texture and bet pressure without spewing.",
    aggression: "medium",
    bluff: "medium",
    range: "Balanced",
    signature: "Applies pressure with strong hands and continues with real equity.",
    watchFor: "Value bets on dry boards; disciplined folds when pressure exceeds hand strength.",
    styleBadge: "Balanced",
  },
  {
    id: "bluff-bot",
    name: "BluffBot",
    avatar: "🎭",
    title: "Pressure Bluffer",
    styleDescription:
      "Loose-aggressive and bluff-heavy — creates action with speculative hands and pressure bets.",
    aggression: "high",
    bluff: "high",
    range: "Loose",
    signature: "Creates action with speculative hands and pressure bets.",
    watchFor: "Wide continues and semi-bluffs; occasional river bluffs after missed draws.",
    styleBadge: "Bluffy",
  },
  {
    id: "river-mind",
    name: "RiverMind",
    avatar: "🌊",
    title: "Tight Analyst",
    styleDescription:
      "Tight, cautious, and value-heavy — avoids marginal spots and waits for strong holdings.",
    aggression: "medium",
    bluff: "low",
    range: "Tight",
    signature: "Avoids marginal spots and waits for strong value.",
    watchFor: "Folds weak pairs to large bets; value bets only with real strength.",
    styleBadge: "Tight",
  },
  {
    id: "chip-hunter",
    name: "ChipHunter",
    avatar: "🎯",
    title: "Aggressive Hunter",
    styleDescription:
      "Aggressive pot-pressure player with a wide continuing range — attacks weakness.",
    aggression: "high",
    bluff: "medium-high",
    range: "Semi-loose",
    signature: "Builds pots and attacks weakness.",
    watchFor: "Large value bets with two pair+; semi-bluffs draws; pressure on scary boards.",
    styleBadge: "Aggressive",
  },
];

export function getAgentProfile(agentId: string): AgentProfile | undefined {
  return AGENT_PROFILES.find((p) => p.id === agentId);
}

export function getAgentStyleBadge(agentId: string): string | undefined {
  return getAgentProfile(agentId)?.styleBadge;
}

export function formatAgentProfileLabel(agentId: string): string | null {
  const profile = getAgentProfile(agentId);
  if (!profile) return null;
  return `${profile.name} · ${profile.title}`;
}

/** Ensure registry order for UI cards. */
export function listAgentProfiles(): AgentProfile[] {
  const byId = new Map(AGENT_PROFILES.map((p) => [p.id, p]));
  return AGENT_REGISTRY.map((a) => byId.get(a.id)).filter(
    (p): p is AgentProfile => p != null,
  );
}
