# Poker AI Arena

**Autonomous AI poker cockpit on Base** — watch agents compete, explain decisions, and track live arena stats.

---

## One-liner

Poker AI Arena is a demo-ready Web3 MVP where rules-based AI agents play simplified Texas Hold'em on Base, users unlock the arena via an x402-style entry fee (mock in dev), and the cockpit surfaces AI reasoning, session analytics, and Bankr-ready integration layers for future production wiring.

---

## What it does

- **Landing + arena UI** — premium casino cockpit for demos and hackathons
- **Step Demo (recommended)** — street-by-street Human vs PokerMaster with your own Fold / Call / Check / Raise; Flop → Turn → River on the board
- **Poker engine (full-hand sim)** — server-side preflop → flop → showdown MVP (turn/river not in engine yet)
- **Rules-based agents** — PokerMaster, BluffBot, RiverMind, ChipHunter
- **Human vs AI (full hand)** — one-click heads-up simulation against PokerMaster
- **Agent Battle** — spectator simulation: four agents, all cards visible after the hand
- **x402 entry fee (mock)** — unlock arena session without moving real USDC in dev
- **Bankr integration layer** — prepared skills client and status API; mock when unconfigured
- **Live leaderboard** — session stats in React state + `localStorage` (no DB yet)

**This is not real-money gambling.** In-game chips are simulated points. The entry fee is a **demo access mechanism**, not casino wagering.

---

## Demo flow

1. Open `/` — landing page and pitch
2. (Optional) Connect wallet — scaffold on Base Sepolia
3. Go to `/arena` — cockpit starts **locked**
4. Click **Mock Pay Entry Fee** — mock x402 unlock (no real funds)
5. **Play Step Demo: Human vs AI** — act on each street, reveal Flop / Turn / River, then **Show Result**
6. (Optional) **Full Hand: Human vs AI** or **Agent Battle**
7. Review **AI Decision** and **Action Log** (Menu drawer)
8. Check **Leaderboard** and **Table Stats**
9. Open **Integration** panel — Bankr layer **prepared**, production wiring **TODO**

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a ~60–90 second presenter script.

---

## Current MVP features

| Feature | Status |
| ------- | ------ |
| Next.js 15 app + casino UI | Done |
| Step Demo (Human vs AI, Flop/Turn/River) | Done — client-side demo flow |
| Poker engine (full-hand preflop/flop/showdown) | Done |
| Rules-based agents | Done |
| Human vs AI (full hand) | Done |
| Agent Battle (spectator sim) | Done |
| x402 mock flow | Mock — dev unlock only |
| Bankr layer | Prepared — mock without credentials |
| Leaderboard analytics | Done — `localStorage` |
| Real x402 payments | TODO |
| Real Bankr API | TODO |
| LLM-powered agents | TODO |
| Farcaster / social demo | TODO |
| Production database | TODO |
| Improved poker engine (turn/river betting) | TODO |

Full matrix: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui, Lucide icons |
| Wallet | wagmi, viem |
| Chain | **Base Sepolia (`84532`)** first; Base Mainnet (`8453`) later |
| Payments | x402 abstraction (`src/lib/bankr/x402Client.ts`) — mock in MVP |
| Agents | Rules-based strategies + Bankr-ready registry |
| Analytics | Client `localStorage` (`poker-ai-arena-analytics-v1`) |
| Deploy | **Vercel** (recommended) |

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                 # Landing
│   ├── arena/page.tsx           # Casino cockpit
│   └── api/
│       ├── poker/simulate/      # Human vs AI | Agent Battle
│       ├── x402/entry/          # Mock entry fee
│       └── bankr/status/        # Integration status (no secrets)
├── components/
│   ├── arena/                   # PokerTable, GameControls, Leaderboard, …
│   └── landing/                 # Hero, FeatureCards, TablePreview, …
├── lib/
│   ├── poker/                   # Engine, deck, evaluator, betting
│   ├── agents/                  # Agent registry + strategies
│   ├── arena/                   # Step demo, seats, simulation display
│   ├── analytics/               # Leaderboard + session stats + storage
│   └── bankr/                   # x402, Bankr client, skills
└── providers/                   # Web3Provider (wagmi)
```

**Separation of concerns**

- **Poker engine** — pure game logic, no UI
- **Agents** — decision strategies via `getAgentDecision()`
- **Bankr / x402** — integration layers; UI never stores private keys
- **Analytics** — client-only persistence for demo MVP

---

## Local development

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

Open:

- http://localhost:3000 — landing
- http://localhost:3000/arena — cockpit

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
| `NEXT_PUBLIC_CHAIN_ID` | `84532` Sepolia (demo) · `8453` mainnet later |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect (optional for demo) |
| `BANKR_*` | Bankr credentials — **server only**, mock if empty |
| `X402_*` | x402 facilitator config — **real flow TODO** |
| `DATABASE_URL` | Future persistence — **not used in MVP** |

Never commit real API keys. `BANKR_API_KEY` is never exposed in API responses or the client bundle.

---

## Bankr integration status

**Prepared, not production-wired.**

- `src/lib/bankr/` — client, skills, types
- `GET /api/bankr/status` — configuration status (no secrets)

When `BANKR_API_KEY`, `BANKR_AGENT_ID`, or `BANKR_SKILLS_URL` are missing, skill calls return **mock success** for demos. Real HTTP calls to Bankr require official credentials and documented endpoints — **TODO**.

---

## x402 entry fee status

**Mock / dev flow only.**

- Config from `X402_ENTRY_FEE_USDC` (default `0.01` USDC) and chain from `NEXT_PUBLIC_CHAIN_ID`
- `POST /api/x402/entry` with `{ "mode": "mock" }` unlocks the arena
- `{ "mode": "real" }` returns **not implemented**
- **No USDC is moved** in mock mode

The entry fee is a **demo session access fee**, not casino wagering or settlement.

---

## Safety / disclaimers

- **No real-money gambling** — demo arena only
- **Mock x402** does not transfer USDC in development
- **No private keys** stored or requested by this app
- **Entry fee = demo access**, not wagering
- **Bankr production** not connected unless you configure env (still mock skill HTTP until implemented)
- **Analytics in localStorage** — not authoritative on-chain data
- Use **Base Sepolia (`84532`)** for wallet demos first

---

## Roadmap

- [ ] Real x402 facilitator integration
- [ ] Real Bankr Skills API wiring
- [ ] Turn / river betting rounds in server engine
- [ ] LLM-powered agents via Bankr
- [ ] Persistent leaderboard (Postgres / Supabase)
- [ ] Farcaster / social demo (optional)
- [ ] Monitoring + rate limits for production

---

## Pitch for Bankr / Base Batches

**Problem:** AI agent demos on Base often lack a cohesive “watch agents compete” experience with readable decisions and session stats in one cockpit.

**Solution:** Poker AI Arena is an autonomous AI poker cockpit on Base where agents battle in readable hands, log reasoning, and feed a live leaderboard. The MVP ships with **Bankr-ready** integration layers and **x402-style** session access (mock today), with a clear path to real payments and production Bankr skills.

**Why Base:** Low-cost L2, strong agent/Bankr ecosystem, ideal for hackathon demos and Base Batches submissions.

**Demo today:** Mock unlock → Step Demo / Human vs AI → Agent Battle → AI reasoning → live stats — **no fake claims** about live x402 or Bankr production.

---

## License

MIT (or your chosen license).
