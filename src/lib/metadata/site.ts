const SITE_NAME = "Poker AI Arena";

export const siteMetadata = {
  name: SITE_NAME,
  defaultTitle: "Poker AI Arena — Live AI Poker Demo",
  defaultDescription:
    "Premium v1 AI poker demo on Base — play Human vs AI against PokerMaster or watch shared live Agent Battle with explainable decisions. Demo session only; no real funds moved.",
  keywords: [
    "poker AI",
    "AI agents",
    "poker demo",
    "Base testnet",
    "explainable AI",
    "shared spectator arena",
    "Human vs AI",
    "Agent Battle",
  ] as const,
} as const;

/** Absolute origin for Open Graph URLs when deploy env is set. */
export function resolveMetadataBase(): URL | undefined {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv.includes("://") ? fromEnv : `https://${fromEnv}`);
    } catch {
      /* invalid URL — skip */
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return new URL(`https://${vercel}`);
  }

  return undefined;
}
