# Poker AI Arena

**Interactive AI poker demo on Base** — play heads-up against PokerMaster or watch four AI agents battle in spectator mode.

---

## One-liner

Poker AI Arena is a demo-ready Web3 app where you play simplified Texas Hold'em against a rules-based AI opponent, or watch an Agent Battle simulation. Demo session unlock only — no real-money gambling. Bankr/x402 integration layers are prepared for future production wiring but are not live today.

---

## What it is

- **Poker AI Arena** — polished AI poker demo for hackathons and showcases
- **Human vs AI (playable)** — street-by-street heads-up against PokerMaster
- **Agent Battle (spectator)** — four AI agents, all cards visible; full-board spectator simulation
- **Demo session only** — unlock the arena without moving real funds; in-game chips are simulated points

**This is not real-money gambling.** The entry flow is a **demo access mechanism**, not casino wagering.

---

## Human vs AI (Step Demo)

Recommended playable mode — 1v1 against **PokerMaster**:

| Feature | Details |
| ------- | ------- |
| Streets | Preflop → Flop → Turn → River on the board |
| Actions | Fold, Call, Check, Raise |
| Raise sizing | **+10**, **+25**, **+50**, **Pot** |
| All-in | Supported — PokerMaster responds with call or fold |
| Thinking delay | PokerMaster waits 1.2–5 s before acting (with safety fallback) |
| All-in runout | **Runout Board** deals remaining streets after an all-in call |
| Hand flow | **Show Result** → **New Hand** |
| Stack depleted | **Reset Demo Stacks** when your demo stack hits zero (no auto-refill) |

Human vs AI runs as a client-side step demo (`src/lib/arena/stepDemo.ts`). It is not a full production betting engine — turn/river betting rounds and server-side settlement are future work.

---

## Agent Battle (spectator)

- **Spectator mode only** — you do not play; four AI agents act automatically (one-click)
- **Four agents** — PokerMaster, BluffBot, RiverMind, ChipHunter
- **All agent cards visible** after the hand is dealt
- **Full 5-card board** — flop (3) + turn (1) + river (1) when the hand reaches showdown
- **Preflop agent decisions** then **board runout** — no turn/river betting in this spectator sim
- **Results** — Showdown (best hand) or Win by fold
- **Step-by-step AI vs AI playback** — planned for a future release

Server-side simulation via `GET /api/poker/simulate?mode=agent-vs-agent`.

---

## Demo access / payments

| Item | Status |
| ---- | ------ |
| Demo session unlock | **Start Demo Session** — no real USDC moved |
| Chain | **Base testnet** (`84532`, Base Sepolia) for wallet scaffold |
| x402-style flow | Mock in dev — `POST /api/x402/entry` with `{ "mode": "mock" }` |
| Real payments | **Not live** — `{ "mode": "real" }` returns not implemented |
| Bankr layer | Prepared (`src/lib/bankr/`) — mock without credentials |

The entry fee is a **demo session access fee**, not wagering or settlement.

---

## Demo flow

1. Open `/` — landing page
2. (Optional) Connect wallet — Base testnet scaffold
3. Go to `/arena` — arena starts **locked**
4. Click **Start Demo Session** — demo unlock (no real funds)
5. **Play Step Demo: Human vs AI** — act on each street, use raise sizing or all-in, then **Show Result** / **New Hand**
6. (Optional) **Agent Battle** — watch four agents (full 5-card board at showdown)
7. Review **AI Decision** and **Action Log** (Menu drawer)
8. Check **Leaderboard** and **Table Stats**
9. Open **Integration** panel — Bankr layer **prepared**, production wiring **TODO**

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a ~60–90 second presenter script.

---

## v0.3 feature status

| Feature | Status |
| ------- | ------ |
| Next.js 15 app + arena UI | Done |
| Human vs AI — raise sizing (+10/+25/+50/Pot) | Done (v0.3.1) |
| Human vs AI — all-in + runout board | Done (v0.3.2) |
| PokerMaster thinking delay | Done (v0.3.3) |
| Human vs AI action-state hardening | Done (v0.3.4) |
| Stack depleted / Reset Demo Stacks | Done |
| Agent Battle (spectator, full-board) | Done (v0.4.1) |
| Demo session unlock (mock x402) | Mock — dev unlock only |
| Bankr integration layer | Prepared — mock without credentials |
| Leaderboard analytics | Done — `localStorage` |
| Real x402 / Bankr production payments | TODO |
| Step-by-step Agent Battle playback | TODO |
| LLM-powered agents | TODO |
| Production database | TODO |

Full matrix: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Lucide icons |
| Wallet | wagmi, viem |
| Chain | **Base testnet (`84532`, Base Sepolia)** first; Base Mainnet (`8453`) later |
| Payments | x402 abstraction (`src/lib/bankr/x402Client.ts`) — mock in demo |
| Agents | Rules-based strategies + Bankr-ready registry |
| Analytics | Client `localStorage` (`poker-ai-arena-analytics-v1`) |
| Deploy | **Vercel** (recommended) |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── arena/page.tsx           # AI poker arena
│   └── api/
│       ├── poker/simulate/      # Human vs AI | Agent Battle
│       ├── x402/entry/          # Demo session unlock (mock)
│       └── bankr/status/        # Integration status (no secrets)
├── components/
│   ├── arena/                   # PokerTable, GameControls, Leaderboard, ...
│   └── landing/                 # Hero, FeatureCards, TablePreview, ...
├── lib/
│   ├── poker/                   # Engine, deck, evaluator, betting
│   ├── agents/                  # Agent registry + strategies
│   ├── arena/                   # Step demo, seats, simulation display
│   ├── analytics/               # Leaderboard + session stats + storage
│   └── bankr/                   # x402, Bankr client, skills
└── providers/                   # Web3Provider (wagmi)
```

**Separation of concerns**

- **Poker engine** — pure game logic for server simulations; step demo is separate client state machine
- **Agents** — decision strategies via `getAgentDecision()`
- **Bankr / x402** — integration layers; UI never stores private keys
- **Analytics** — client-only persistence for demo sessions

---

## Local development

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Open:

- http://localhost:3000 — landing
- http://localhost:3000/arena — arena

**Quality checks**

```bash
npm run lint
npm run build
```

**Useful API checks**

```bash
curl "http://localhost:3000/api/poker/simulate?mode=human-vs-ai"
curl "http://localhost:3000/api/poker/simulate?mode=agent-vs-agent"
curl -X POST http://localhost:3000/api/x402/entry -H "Content-Type: application/json" -d "{\"mode\":\"mock\"}"
curl http://localhost:3000/api/bankr/status
```

More detail: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Environment variables

Copy `.env.example` → `.env.local`. Key variables:

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_APP_NAME` | App display name |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` Sepolia (demo) → `8453` mainnet later |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect (optional for demo) |
| `BANKR_*` | Bankr credentials — **server only**, mock if empty |
| `X402_*` | x402 facilitator config — **real flow TODO** |
| `DATABASE_URL` | Future persistence — **not used in demo** |

Never commit real API keys. `BANKR_API_KEY` is never exposed in API responses or the client bundle.

---

## Bankr integration status

**Prepared, not production-wired.**

- `src/lib/bankr/` — client, skills, types
- `GET /api/bankr/status` — configuration status (no secrets)

When `BANKR_API_KEY`, `BANKR_AGENT_ID`, or `BANKR_SKILLS_URL` are missing, skill calls return **mock success** for demos. Real HTTP calls to Bankr require official credentials and documented endpoints — **TODO**.

---

## x402 demo session status

**Mock / dev flow only.**

- Config from `X402_ENTRY_FEE_USDC` (default `0.01` USDC) and chain from `NEXT_PUBLIC_CHAIN_ID`
- `POST /api/x402/entry` with `{ "mode": "mock" }` unlocks the arena
- `{ "mode": "real" }` returns **not implemented**
- **No USDC is moved** in mock mode

---

## Safety / disclaimers

- **No real-money gambling** — demo arena only
- **Mock x402** does not transfer USDC in development
- **No private keys** stored or requested by this app
- **Entry fee = demo access**, not wagering
- **Bankr production** not connected unless you configure env (still mock skill HTTP until implemented)
- **Analytics in localStorage** — not authoritative on-chain data
- Use **Base testnet** for wallet demos first

---

## Roadmap

- **v0.4+** — step-by-step Agent Battle spectator playback
- **v0.4 / v0.5** — stronger AI strategy and betting logic
- Real x402 facilitator integration and Bankr Skills API wiring
- Mobile polish, replay, and hand history
- LLM-powered agents via Bankr
- Persistent leaderboard (Postgres / Supabase)
- Monitoring + rate limits for production

---

## Pitch for Bankr / Base Batches

**Problem:** AI agent demos on Base often lack a cohesive interactive poker experience with readable decisions and session stats in one place.

**Solution:** Poker AI Arena lets you **play** heads-up against PokerMaster or **watch** four agents battle. The demo ships with Bankr-ready integration layers and x402-style session access (mock today), with a clear path to real payments and production Bankr skills.

**Why Base:** Low-cost L2, strong agent/Bankr ecosystem, ideal for hackathon demos and Base Batches submissions.

**Demo today:** Mock unlock → Human vs AI (raise, all-in, thinking) → Agent Battle (full-board spectator) → AI reasoning → live stats — **no fake claims** about live x402 or Bankr production.

---

## License

MIT (or your chosen license).