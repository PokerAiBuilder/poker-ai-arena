export type {
  ArenaAnalyticsState,
  LeaderboardEntry,
  SessionStats,
} from "@/lib/analytics/types";
export {
  createInitialLeaderboard,
  LEADERBOARD_AVATARS,
  sortLeaderboard,
  updateLeaderboardAfterGame,
} from "@/lib/analytics/leaderboard";
export {
  createInitialSessionStats,
  updateSessionStatsAfterGame,
  updateSessionStatsAfterStepDemoHand,
} from "@/lib/analytics/sessionStats";
export {
  buildPlayerSessionStatsView,
  computeNetChips,
  computeWinRate,
  formatChipDelta,
  formatHandHistoryCompactTitle,
  formatHandHistoryMetaLine,
  formatHandHistoryResultLine,
  formatWinRateLabel,
  settlementLabelFromMeta,
  sumClaimedTestEth,
  sumDepositedTestEth,
  type PlayerSessionStatsView,
} from "@/lib/analytics/playerSessionStats";
export type { HandHistoryCreateContext } from "@/lib/arena/handHistory";
export {
  ARENA_ANALYTICS_STORAGE_KEY,
  clearArenaAnalytics,
  createInitialArenaAnalytics,
  loadArenaAnalytics,
  saveArenaAnalytics,
} from "@/lib/analytics/storage";
export type { SessionStacksState } from "@/lib/analytics/sessionStacks";
export {
  SESSION_STACKS_STORAGE_KEY,
  clearSessionStacks,
  createInitialSessionStacks,
  canStartHeadsUpHand,
  isHeadsUpStackDepleted,
  loadSessionStacks,
  resetHeadsUpDemoStacks,
  applyStakeStartingStacks,
  isHumanStackDepleted,
  isOpponentStackDepleted,
  prepareHeadsUpHandStacks,
  saveSessionStacks,
  sanitizeSessionStacks,
  updateSessionStacksAfterGame,
} from "@/lib/analytics/sessionStacks";
export type { AgentBattleStacksState } from "@/lib/analytics/agentBattleStacks";
export {
  AGENT_BATTLE_STACKS_STORAGE_KEY,
  canRunAgentBattle,
  clearAgentBattleStacks,
  countAgentBattlePlayersWithChips,
  createInitialAgentBattleStacks,
  isAgentBattleStackDepleted,
  loadAgentBattleStacks,
  resetAgentBattleStacks,
  saveAgentBattleStacks,
  sanitizeAgentBattleStacks,
  updateAgentBattleStacksAfterHand,
} from "@/lib/analytics/agentBattleStacks";
