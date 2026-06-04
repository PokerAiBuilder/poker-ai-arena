# Poker AI Arena

**Premium v1 AI poker demo on Base** — play heads-up against PokerMaster or watch a **shared live Agent Battle** with explainable decisions.

---

## One-liner

Poker AI Arena is a **v1.0 public demo**: navy/electric-blue landing and arena, live Human vs AI poker-room flow, and synchronized Agent Battle spectator mode. **Demo session unlock only** — no real funds moved. Bankr/x402 layers are prepared for future production access, not live payments today.

---

## What you get (v1.0)

| Experience | Description |
| ---------- | ----------- |
| **Premium v1 UI** | Base-style landing + arena — navy/black surfaces, cyan/blue accents, BrandMark |
| **Human vs AI** | Playable heads-up vs PokerMaster — 15s timer, auto streets/result, explainable decisions |
| **Shared live Agent Battle** | Join once; all viewers see the same hand lifecycle from the server (memory cache in demo) |
| **Explainable AI** | AI Decision panel, Action Log, Agent profiles |
| **Demo-safe Web3** | Wallet optional on Base testnet; mock demo session unlock |
| **No real money** | Demo chips only — not real-money gambling |

---

## Human vs AI (live poker-room flow)

| Feature | Details |
| ------- | ------- |
| Flow | You make poker decisions only; streets and results advance automatically |
| Streets | Flop / turn / river auto-deal after each betting round |
| Result | Auto-shows at showdown or fold; banner sits between board and your cards |
| Timer | **15 seconds** per action; timeout **auto-check** or **auto-fold** |
| Actions | Fold, Call, Check, Raise (+10 / +25 / +50 / Pot), All-in |
| UI | Compact **Human vs AI** mode pill during an active hand (no oversized Play button) |
| New hand | Explicit **New Hand** when you are ready |

Client-side state machine (`src/lib/arena/stepDemo.ts`) — polished demo, not production settlement.

---

## Shared live Agent Battle

- **Spectator only** — four strategy agents (PokerMaster, BluffBot, RiverMind, ChipHunter)
- **Shared hand** — `GET /api/arena/agent-battle/current` syncs timeline + result across tabs
- **Lifecycle** — `playing` → `result_pause` → next hand at `nextHandAt`
- **Timeline replay** — progressive board + Action Log; **Skip animations** is local-only
- **Desktop layout** — ellipse table (v1.0.0-c); mobile Agent Battle polish deferred

**Demo limitation:** shared state is **in-memory** on the server. Production should use Redis/DB.

---

## Demo access / payments

| Item | Status |
| ---- | ------ |
| Unlock | **Start Demo Session** — mock x402-style flow |
| Funds | **No real funds moved** in public demo |
| Chain | Base Sepolia (`84532`) for optional wallet preview |
| x402 real mode | **Not implemented** |
| Bankr | **Prepared** (`src/lib/bankr/`) — mock without credentials |

USDC labels in the UI are **demo display only**, not wagering or settlement.

---

## Current limitations (honest)

- **Demo strategy agents** — rules-based bots, not external LLM agents yet
- **Mock x402** — no on-chain payment in public demo
- **Shared store** — memory cache; Redis/DB later
- **Bankr / x402 production** — wiring TODO when credentials and facilitator are ready
- **Agent Battle mobile** — baseline layout; dedicated mobile UX later
- **Analytics** — `localStorage` session stats, not a production database
- **Social preview** — brand mark PNG for OG/Twitter; dedicated 1200×630 card TODO

---

## Quick start

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
npm run dev
```

- http://localhost:3000 — landing  
- http://localhost:3000/arena — arena (Start Demo Session → Play vs PokerMaster or Join Agent Battle)

```bash
npm run lint
npm run build
```

Presenter walkthrough: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)  
Deploy notes: [DEPLOYMENT.md](./DEPLOYMENT.md)  
Status matrix: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for production metadata / Open Graph (recommended on Vercel) |
| `NEXT_PUBLIC_CHAIN_ID` | `84532` Sepolia demo |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Optional |
| `BANKR_*` | Server-only — mock if empty |
| `X402_*` | Real facilitator TODO |
| `DATABASE_URL` | Future — unused in demo |

---

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · wagmi/viem · Base testnet · Vercel deploy

```
src/
├── app/                 # Landing, arena, API routes
├── components/arena/    # PokerTable, ArenaShell, panels, action bar
├── components/landing/  # v1 marketing sections
├── lib/poker/           # Engine + Agent Battle sim
├── lib/arena/           # HvAI flow, replay, button styles
└── lib/bankr/           # x402 + Bankr (mock in demo)
```

---

## v1 release tracks (committed)

| Tag | Focus |
| --- | ----- |
| v1.0.0-a | Visual foundation (tokens, BrandMark, utilities) |
| v1.0.0-b | Landing redesign |
| v1.0.0-c | Arena redesign + HvAI geometry + Agent Battle desktop restore |
| v1.0.0-d | Docs, metadata, final QA checklist |

---

## Safety

- **Not real-money gambling**
- **No private keys** stored by this app
- **No live x402/Bankr settlement** in the public demo
- Use **Base testnet** for wallet demos

---

## License

MIT (or your chosen license).
