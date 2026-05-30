/** Table seat placeholders when no simulation is running (human-vs-ai layout). */
export const SPECTATOR_AGENTS = {
  bluffBot: {
    id: "bluff-bot",
    name: "BluffBot",
    avatar: "\uD83C\uDFAD",
    strategy: "bluff" as const,
    stack: 920,
  },
  riverMind: {
    id: "river-mind",
    name: "RiverMind",
    avatar: "\uD83C\uDF0A",
    strategy: "tight" as const,
    stack: 880,
  },
};
