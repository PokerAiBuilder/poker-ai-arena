# Poker AI Arena

**Interactive AI poker demo on Base** — play heads-up against PokerMaster or watch four AI agents battle in live spectator mode.

---

## One-liner

Poker AI Arena is a demo-ready Web3 app with a **live poker-room Human vs AI flow** and **timeline-based Agent Battle replay**. Demo session unlock only — no real-money gambling. Bankr/x402 integration layers are prepared for future production wiring but are not live today.

---

## What it is

- **Poker AI Arena** — polished AI poker demo for hackathons and showcases
- **Human vs AI (playable)** — live heads-up poker-room flow against PokerMaster
- **Agent Battle (spectator)** — four AI agents act street by street with timeline replay
- **Demo session only** — unlock the arena without moving real funds; in-game chips are simulated points

**This is not real-money gambling.** The entry flow is a **demo access mechanism**, not casino wagering.

---

## Human vs AI (live poker-room flow)

Recommended playable mode — 1v1 against **PokerMaster**:

| Feature | Details |
| ------- | ------- |
| Flow | **Live poker-room** — you only make poker decisions; streets and results advance automatically |
| Streets | Flop / Turn / River **auto-deal** after each betting round |
| Result | **Auto-shows** at showdown or when a player folds |
| All-in | **Auto-runout** — remaining streets deal automatically after an all-in call |
| Action timer | **15-second** countdown on your turn; timeout **auto-check** or **auto-fold** |
| Actions | Fold, Call, Check, Raise with **+10 / +25 / +50 / Pot** sizing, or all-in |
| Thinking delay | PokerMaster waits 1.2–5 s before acting (with safety fallback) |
| New hand | **New Hand** remains an explicit player action (not automatic) |
| Stack depleted | **Reset Demo Stacks** when your demo stack hits zero (no auto-refill) |

Human vs AI runs as a client-side state machine (`src/lib/arena/stepDemo.ts`). It is a polished demo flow, not a full production betting engine — server-side settlement and production wallet integration are future work.

---

## Agent Battle (live spectator + timeline replay)

- **Spectator mode only** — you do not play; four AI agents act automatically
- **Live autoplay** — agents act **street by street** (preflop, flop, turn, river) with real betting decisions
- **Active bot highlight** — the acting agent is highlighted during replay
- **Four agents** — PokerMaster, BluffBot, RiverMind, ChipHunter; all hole cards visible after deal
- **Full 5-card board** — progressive board reveal through the timeline
- **Timeline-based replay** — each step has `atMs` / `durationMs`; UI derives state from elapsed time
- **Progressive Action Log** — log entries appear as the timeline advances
- **Result at end** — final board and winner appear when the timeline completes
- **Skip animations** — local-only control during replay; jumps to final result without changing the simulated hand
- **No Pause / Speed** — by design; future **shared spectator mode** should use one shared timeline for all viewers

Server-side simulation via `GET /api/poker/simulate?mode=agent-vs-agent`; replay is client-side timeline playback.
### Shared spectator mode (v0.7+)

- **Join once** — `GET /api/arena/agent-battle/current` returns the same shared hand, timeline, and result for all viewers
- **Lifecycle** — server phases `playing` → `result_pause` → next hand at `nextHandAt`
- **Health/status** — `GET /api/arena/agent-battle/status` exposes hand id, lifecycle, and cache metadata (no cards/timeline)
- **Demo limitation** — shared state lives in **server memory** (`globalThis` cache). Fine for local/demo; **production should use persistent storage** (Redis/DB) so all instances and restarts stay in sync

---

## History / logs

| Panel | Purpose |
| ----- | ------- |
| **Action Log** | Current hand — progressive replay of actions and board reveals during live play |
| **History** | Recent hands archive (Arena Menu **History** tab, last 10 hands in `localStorage`) |

Payout and history for Agent Battle are applied **once** when the hand finishes or when you skip animations locally.

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
5. **Play vs PokerMaster** — act within 15 s; streets auto-deal; result auto-shows; start **New Hand** when ready
6. **Run Agent Battle** — watch live autoplay, timeline replay, and optional **Skip animations** (local only)
7. Review **Action Log** (current hand) and **History** (recent archive) in the Arena Menu
8. Check **Leaderboard** and **Table Stats**
9. Open **Integration** panel — Bankr layer **prepared**, production wiring **TODO**

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a ~60–90 second presenter script.

---

## v0.5 feature status

| Feature | Status |
| ------- | ------ |
| Next.js 15 app + arena UI | Done |
| Human vs AI — live poker-room flow | Done (v0.5.1) |
| Human vs AI — 15 s action timer + auto-check/fold | Done (v0.5.1) |
| Human vs AI — auto-deal streets + auto-result + all-in runout | Done (v0.5.1) |
| Raise sizing (+10/+25/+50/Pot) and all-in | Done (v0.3.x) |
| Agent Battle — live spectator autoplay | Done (v0.5.2) |
| Agent Battle — timeline-based replay + Skip animations | Done (v0.5.3) |
| Hand history + Action Log polish | Done (v0.4.3–v0.4.4) |
| Demo session unlock (mock x402) | Mock — dev unlock only |
| Bankr integration layer | Prepared — mock without credentials |
| Leaderboard analytics | Done — `localStorage` |
| Mobile / responsive arena polish | Done (v0.8.1–v0.8.4) |
| Agent Battle — shared spectator (memory cache) | Done (v0.7.1–v0.7.4) |
| Shared arena persistent store (Redis/DB) | TODO (production) |
| Real x402 / Bankr production payments | TODO |
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
│   ├── arena/                   # Live HvAI flow, timeline replay, seats
│   ├── analytics/               # Leaderboard + session stats + storage
│   └── bankr/                   # x402, Bankr client, skills
└── providers/                   # Web3Provider (wagmi)
```

**Separation of concerns**

- **Poker engine** — pure game logic for server simulations; Human vs AI live flow is a separate client state machine
- **Agent Battle replay** — timeline model (`agentBattleReplay.ts`) drives progressive UI from elapsed time
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

- **v0.6** — smarter AI / decision quality
- **v0.7** — shared spectator API, lifecycle, status UI (memory cache; Redis/DB for production)
- **v0.8** — mobile / responsive polish (**done** — see [PROJECT_STATUS.md](./PROJECT_STATUS.md))
- **v0.9** — web3 / demo access cleanup
- **v1.0** — public demo release
- Real x402 facilitator integration and Bankr Skills API wiring (parallel track)
- LLM-powered agents via Bankr
- Persistent leaderboard (Postgres / Supabase)

---

## Pitch for Bankr / Base Batches

**Problem:** AI agent demos on Base often lack a cohesive interactive poker experience with readable decisions and session stats in one place.

**Solution:** Poker AI Arena lets you **play** a live heads-up hand against PokerMaster or **watch** four agents battle with timeline replay. The demo ships with Bankr-ready integration layers and x402-style session access (mock today), with a clear path to shared spectator mode and production Bankr skills.

**Why Base:** Low-cost L2, strong agent/Bankr ecosystem, ideal for hackathon demos and Base Batches submissions.

**Demo today:** Mock unlock → Human vs AI (15 s timer, auto streets) → Agent Battle (live autoplay + timeline replay) → Action Log / History → live stats — **no fake claims** about live x402 or Bankr production.

---

## License

MIT (or your chosen license).
