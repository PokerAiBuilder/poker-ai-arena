import { expect } from "chai";

const BASE_SEPOLIA_CHAIN_ID = 84532;

function isBaseSepolia(chainId?: number | null): boolean {
  return chainId === BASE_SEPOLIA_CHAIN_ID;
}

function shouldShowPublicTesterWrongNetwork(
  isWalletConnected: boolean,
  chainId: number | undefined | null,
): boolean {
  return isWalletConnected && !isBaseSepolia(chainId);
}

function isValidPublicTesterLink(link: { label: string; href: string }): boolean {
  try {
    const url = new URL(link.href);
    return url.protocol === "https:" && link.label.trim().length > 0;
  } catch {
    return false;
  }
}

const PUBLIC_TESTER_LINKS = [
  {
    label: "Base Sepolia faucet",
    href: "https://docs.base.org/base-chain/network-information/network-faucets",
  },
  {
    label: "Base Sepolia explorer",
    href: "https://sepolia.basescan.org",
  },
  {
    label: "GitHub docs",
    href: "https://github.com/PokerAiBuilder/poker-ai-arena",
  },
];

const PUBLIC_TESTER_HOW_TO_STEPS = [
  "Connect wallet",
  "Switch to Base Sepolia",
  "Get free Base Sepolia test ETH",
  "Lock test stake",
  "Play Human vs AI",
  "Prepare payout",
  "Claim payout",
  "Check tx on BaseScan",
];

describe("public tester UX helpers", function () {
  it("defines the full how-to-test flow", function () {
    expect(PUBLIC_TESTER_HOW_TO_STEPS).to.have.length(8);
    expect(PUBLIC_TESTER_HOW_TO_STEPS[0]).to.equal("Connect wallet");
    expect(PUBLIC_TESTER_HOW_TO_STEPS.at(-1)).to.equal("Check tx on BaseScan");
  });

  it("validates helpful link config", function () {
    for (const link of PUBLIC_TESTER_LINKS) {
      expect(isValidPublicTesterLink(link)).to.equal(true);
    }
    expect(
      isValidPublicTesterLink({ label: "Bad", href: "http://insecure.example" }),
    ).to.equal(false);
  });

  it("shows wrong-network helper only when connected off Base Sepolia", function () {
    expect(shouldShowPublicTesterWrongNetwork(false, 1)).to.equal(false);
    expect(shouldShowPublicTesterWrongNetwork(true, BASE_SEPOLIA_CHAIN_ID)).to.equal(
      false,
    );
    expect(shouldShowPublicTesterWrongNetwork(true, 1)).to.equal(true);
  });
});
