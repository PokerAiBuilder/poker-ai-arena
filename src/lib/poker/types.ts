export type Suit = "hearts" | "diamonds" | "clubs" | "spades";

export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K"
  | "A";

export type Card = {
  suit: Suit;
  rank: Rank;
};

export type PlayerRole = "human" | "ai";

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  stack: number;
  holeCards: Card[];
  currentBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
};

/** Stages supported in MVP: preflop → flop → showdown. Turn/river reserved for later. */
export type GameStage = "preflop" | "flop" | "turn" | "river" | "showdown";

export type GameActionType =
  | "fold"
  | "check"
  | "call"
  | "raise"
  | "all-in"
  | "deal"
  | "showdown"
  | "blind";

export type GameAction = {
  playerId: string;
  playerName: string;
  action: GameActionType;
  amount?: number;
  stage: GameStage;
  message: string;
  timestamp: number;
};

export type HandRank =
  | "high_card"
  | "pair"
  | "two_pair"
  | "three_of_a_kind"
  | "straight"
  | "flush"
  | "full_house"
  | "four_of_a_kind"
  | "straight_flush";

export type EvaluatedHand = {
  rank: HandRank;
  rankName: string;
  /** Lexicographic tiebreaker scores — higher wins. */
  scores: number[];
  bestFive: Card[];
};

export type HandResult = {
  winnerId: string;
  winnerName: string;
  winningHand: EvaluatedHand;
  pot: number;
  isSplit: boolean;
  loserIds: string[];
};

export type AgentBattleHandMeta = {
  startingStacks: Record<string, number>;
  contributions: Record<string, number>;
};

export type AgentBattleAccountingSnapshot = {
  startingStacks: Record<string, number>;
  contributions: Record<string, number>;
  finalStacks: Record<string, number>;
  pot: number;
  winnerId: string;
  winnerIds: string[];
};

export type GameState = {
  id: string;
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;
  currentBet: number;
  stage: GameStage;
  actionLog: GameAction[];
  agentDecisions: SimulationAgentDecision[];
  dealerIndex: number;
  smallBlind: number;
  bigBlind: number;
  handNumber: number;
  /** Agent Battle only — per-hand contribution ledger. */
  agentBattleMeta?: AgentBattleHandMeta;
  /** Agent Battle only — settlement snapshot after finalize. */
  agentBattleAccounting?: AgentBattleAccountingSnapshot;
};

export type SimulationPlayerResult = {
  id: string;
  name: string;
  role: PlayerRole;
  holeCards: Card[];
  stack: number;
  hasFolded: boolean;
  finalHand?: EvaluatedHand;
};

export type SimulationAgentDecision = {
  agentId: string;
  agentName: string;
  strategy: "tight" | "balanced" | "aggressive" | "bluff";
  stage: GameStage;
  action: "fold" | "check" | "call" | "raise" | "all-in";
  amount?: number;
  confidence: number;
  reasoning: string;
};

export type GameMode = "human-vs-ai" | "agent-vs-agent";

export type SimulationResult = {
  gameId: string;
  handNumber: number;
  gameMode: GameMode;
  agents: string[];
  players: SimulationPlayerResult[];
  communityCards: Card[];
  winner: {
    id: string;
    name: string;
  };
  winningHand: {
    rank: HandRank;
    rankName: string;
    cards: Card[];
  };
  pot: number;
  actionLog: GameAction[];
  stage: GameStage;
  agentDecisions: SimulationAgentDecision[];
  /** Agent Battle only — authoritative stack ledger for this hand. */
  agentBattleAccounting?: AgentBattleAccountingSnapshot;
};

export const RANK_VALUES: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const HAND_RANK_LABELS: Record<HandRank, string> = {
  high_card: "High Card",
  pair: "Pair",
  two_pair: "Two Pair",
  three_of_a_kind: "Three of a Kind",
  straight: "Straight",
  flush: "Flush",
  full_house: "Full House",
  four_of_a_kind: "Four of a Kind",
  straight_flush: "Straight Flush",
};

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit[0].toUpperCase()}`;
}

export function formatCards(cards: Card[]): string {
  return cards.map(cardToString).join(" ");
}
