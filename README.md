# Poker AI Arena

**Public testnet demo** — play Human vs AI poker on **Base Sepolia**, lock a test ETH stake in an on-chain escrow contract, and claim test ETH payouts after your session. Watch a shared **AI Agent Battle** spectator mode with explainable bot decisions.

**Live demo:** [https://poker-ai-arena.vercel.app](https://poker-ai-arena.vercel.app)

---

## Project overview

Poker AI Arena is a v1 Base AI poker product: a navy/electric-blue arena where you connect a wallet, deposit **test ETH only** on Base Sepolia, play heads-up against PokerMaster, and cash out through an escrow **prepare → claim** flow. A server-side resolver prepares payouts; you claim test ETH from the `TestStakeEscrow` contract.

This is a **testnet demo**, not real-money wagering. No mainnet funds. No production database yet.

| Recommended | Status |
| ----------- | ------ |
| **Desktop browser** | Best experience — use this for testing |
| **Mobile** | Work in progress — layout and flows are rough; desktop is recommended |

---

## Testnet disclaimer

- **Base Sepolia only** (chain ID `84532`)
- **Test ETH only** — from faucets, not real money
- **No mainnet funds** — do not send mainnet ETH or USDC expecting gameplay or payout
- **No real-money wagering** — chip balances and payouts are demo/testnet mechanics
- Smart contracts and session storage are for **testing and demos**, not production gambling

---

## Features live today

| Feature | Description |
| ------- | ----------- |
| **Wallet connect** | MetaMask, Rabby, WalletConnect-compatible wallets |
| **Base Sepolia test ETH stake lock** | Choose a test stake tier and lock on-chain |
| **Escrow deposit** | Stake goes to the `TestStakeEscrow` contract on Base Sepolia |
| **Human vs AI poker** | Playable heads-up vs PokerMaster — timed actions, auto streets/result |
| **AI Agent Battle** | Spectator mode — shared live hand timeline across viewers |
| **Server-side payout resolver** | Prepares escrow payout from session chip results |
| **Claim payout from escrow** | Claim test ETH after prepare step (wallet transaction) |
| **History & session stats** | Local hand history, session stats, wallet session restore |

---

## How to test (step by step)

1. **Open the live demo** — [https://poker-ai-arena.vercel.app](https://poker-ai-arena.vercel.app) (desktop recommended).
2. **Connect wallet** — use **Connect Wallet** in the header or stake panel.
3. **Switch to Base Sepolia** — the app prompts you if you are on the wrong network.
4. **Get Base Sepolia test ETH** — use the [official Base faucet/docs](https://docs.base.org/base-chain/network-information/network-faucets) (see [Faucets](#faucets) below).
5. **Lock test stake** — choose a tier (e.g. 0.001 ETH → 1,000 chips) and confirm **Lock Test Stake** in your wallet.
6. **Play a hand** — **Play vs PokerMaster**, take actions (fold/call/check/raise). Chips update after each hand.
7. **Prepare payout** — when ready to cash out, use **Prepare payout** (server resolver signs the escrow resolve step).
8. **Claim payout** — confirm **Claim payout** in your wallet to receive test ETH from escrow.
9. **View tx on BaseScan** — use **View** links in the stake session panel or open [sepolia.basescan.org](https://sepolia.basescan.org) with your wallet address or transaction hash.

**Mock session (optional):** Without a wallet, you can start a **Mock session** for UI-only demo play — no on-chain deposit or claim. For the full escrow flow, connect a wallet and lock on Base Sepolia.

---

## Base Sepolia network details

| Field | Value |
| ----- | ----- |
| **Network name** | Base Sepolia |
| **RPC URL** | `https://sepolia.base.org` |
| **Chain ID** | `84532` |
| **Currency** | ETH |
| **Block explorer** | [https://sepolia.basescan.org](https://sepolia.basescan.org) |

Add Base Sepolia in your wallet if it is not listed. The app targets chain ID **84532** only for the public test flow.

---

## Wallet note

- **[Rabby Wallet](https://rabby.io)** is recommended for clearer **testnet balance** and **transaction detail** on Base Sepolia.
- **MetaMask** may sometimes not display Base Sepolia test ETH balance clearly. If your balance looks wrong, switch to Rabby or verify on [BaseScan](https://sepolia.basescan.org).

---

## Faucets

Get free **Base Sepolia test ETH** from the official Base documentation and faucet links:

**[Base network faucets (official docs)](https://docs.base.org/base-chain/network-information/network-faucets)**

You need a small amount of test ETH to pay gas and to lock a test stake deposit.

---

## Escrow flow (short)

1. **Stake deposit** — your test ETH is sent to the **`TestStakeEscrow`** contract on Base Sepolia (`depositStake`).
2. **Chips credited** — after the deposit transaction confirms, the arena credits chips from your stake tier (e.g. 0.001 ETH → 1,000 chips).
3. **Play** — Human vs AI hands update your **current chips** (stored locally and synced to the demo server session when configured).
4. **Prepare payout** — the **server resolver** computes payout from chip results and resolves the escrow session on-chain (owner-signed testnet flow).
5. **Claim** — you **claim test ETH** from escrow with your wallet (`claimPayout`).
6. **Liquidity cap** — if the escrow contract balance is **lower than the computed payout**, the **claimable amount is capped** by available escrow liquidity (you still claim what the contract can pay).

Treasury-only lock (legacy test tx) may still appear in some configs; the primary public path is **escrow deposit + prepare + claim**.

---

## Known limitations

- **Mobile layout** is still in development — use desktop for testing.
- **Testnet only** — Base Sepolia; not Base mainnet.
- **Session persistence** — demo server memory + browser `localStorage` fallback; not a final production database.
- **Chip results** are testnet/demo mechanics, not mainnet settlement.
- **No real-money wagering** — do not treat chip balances or payouts as financial products.
- **Agent Battle** shared state uses an in-memory server cache in this demo (not durable Redis/DB yet).
- **AI agents** are rules-based strategy bots in this build, not external LLM players.

---

## Troubleshooting

| Issue | What to try |
| ----- | ----------- |
| **"Lock Test Stake" unavailable** | Confirm wallet is on **Base Sepolia** (84532). Check that the deploy has escrow env configured (`NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS`). Refresh and reconnect wallet. |
| **Balance not showing** | Use **Rabby** or check **[BaseScan](https://sepolia.basescan.org)** — MetaMask sometimes hides testnet ETH clearly. |
| **Claim disabled** | **Prepare payout** first. Connect the **same wallet** that made the escrow deposit. Finish any active hand before cash-out. |
| **Wrong wallet / session mismatch** | Reconnect the wallet address used for the escrow deposit. Another wallet cannot claim or continue that session. |
| **Wallet disconnected mid-session** | Reconnect the original wallet — escrow session and **current chips** should restore (mock sessions do not overwrite escrow). |

---

## Quick start (local development)

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

- http://localhost:3000 — landing  
- http://localhost:3000/arena — arena  

```bash
npm run lint
npm run build
npm run contracts:test
```

Presenter walkthrough: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)  
Deploy notes: [DEPLOYMENT.md](./DEPLOYMENT.md)  
Internal status matrix: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## Environment variables

Copy `.env.example` to `.env.local`. **Never commit** `.env.local` or real private keys.

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL for metadata (set on Vercel) |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` for Base Sepolia demo |
| `NEXT_PUBLIC_BASE_RPC_URL` | Optional public RPC override |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional WalletConnect project ID |
| `NEXT_PUBLIC_TESTNET_ESCROW_ADDRESS` | **TestStakeEscrow** on Base Sepolia — required for on-chain lock/claim in production deploy |
| `NEXT_PUBLIC_TESTNET_TREASURY_ADDRESS` | Optional legacy treasury lock address |
| `TESTNET_ESCROW_ADDRESS` | Server alias for escrow (same contract as above) |
| `TESTNET_DEPLOYER_PRIVATE_KEY` | **Server only** — deploys contract and runs resolver; never expose to client |
| `BASE_SEPOLIA_RPC_URL` | RPC for Hardhat deploy and server resolver |
| `BANKR_*` / `X402_*` | Prepared for future settlement — not required for public testnet demo |
| `DATABASE_URL` | Future — unused in current demo |

See [.env.example](./.env.example) for the full template and comments.

---

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · wagmi/viem · Hardhat · Base Sepolia · Vercel

```
src/
├── app/                 # Landing, arena, API routes
├── components/arena/    # PokerTable, ArenaShell, panels
├── components/landing/  # Marketing sections
├── lib/poker/           # Engine + Agent Battle
├── lib/arena/           # Human vs AI flow, session API
├── lib/stake/           # Escrow helpers, session storage
└── contracts/           # TestStakeEscrow (Base Sepolia testnet)
```

---

## Safety

- **Not real-money gambling**
- **No private keys** stored by this app in the browser
- Use **Base Sepolia test ETH** only for public testing
- Verify transactions on **[BaseScan Sepolia](https://sepolia.basescan.org)**

---

## License

MIT (or your chosen license).
