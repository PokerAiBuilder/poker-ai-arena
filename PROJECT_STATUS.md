# Project status

Last updated for **v0.3** — final QA before GitHub / Vercel push.

---

## v0.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Raise sizing (+10 / +25 / +50 / Pot) | v0.3.1 | Human vs AI Step Demo |
| All-in support | v0.3.2 | Human all-in, PokerMaster call/fold, runout board |
| PokerMaster thinking delay | v0.3.3 | 1.2–5 s delay + 5.5 s safety fallback |
| Human vs AI action-state hardening | v0.3.4 | Strict UI states via `deriveStepDemoUiState()` |
| Stack depleted handling | v0.3.4 | Reset Demo Stacks only; no New Hand when depleted |
| Show Result / New Hand flow | v0.3 | End-of-hand and next-hand controls |
| Runout Board | v0.3.2 | Remaining streets after all-in call |

---

## Module matrix

| Module | Status | Notes |
| ------ | ------ | ----- |
| Next.js app | **Done** | App Router, landing + `/arena` |
| Arena UI (AI poker) | **Done** | PokerTable, controls, panels, responsive layout |
| Human vs AI (Step Demo) | **Done** | Client flow: preflop → flop → turn → river; raise sizing; all-in |
| Rules-based agents | **Done** | PokerMaster, BluffBot, RiverMind, ChipHunter |
| Agent Battle | **Done (flop-only)** | Spectator sim, 4 agents, all cards visible; turn/river not dealt |
| Poker engine (server) | **Done (partial)** | Full-hand sim: preflop → flop → showdown; turn/river betting rounds TODO |
| Human vs AI (API one-shot) | **Done** | `?mode=human-vs-ai` server simulation (legacy quick sim) |
| x402 mock flow | **Mock** | Demo session unlock only; no real USDC transfer |
| Bankr layer | **Prepared** | Client, skills, status API; mock without credentials |
| Leaderboard analytics | **Done** | Session stats + `localStorage` persistence |
| Real x402 payments | **TODO** | Facilitator + on-chain settlement not implemented |
| Real Bankr API | **TODO** | Requires official credentials and endpoints |
| Full-board Agent Battle | **TODO (v0.4)** | Turn + river simulation for spectator mode |
| Stronger AI strategy | **TODO (v0.4/v0.5)** | Rules-based only today |
| LLM agents | **TODO** | Not started |
| Production database | **TODO** | Analytics client-only; `DATABASE_URL` unused |
| Mobile polish / replay / hand history | **TODO** | Future |

---

## Agent Battle status

| Aspect | Current state |
| ------ | ------------- |
| Mode | **Spectator only** — user does not act |
| Agents | 4 (PokerMaster, BluffBot, RiverMind, ChipHunter) |
| Card visibility | All agent hole cards visible after deal |
| Streets simulated | Preflop + **flop only** |
| Turn / River | **Not dealt yet** |
| Next milestone | **v0.4** — full-board simulation through river |

---

## Known limitations

- **Agent Battle does not deal turn or river** — flop-only simulation until v0.4
- **No real-money payments** — mock x402 demo unlock only; Bankr production not wired
- **Demo stacks / local session only** — analytics in `localStorage`; no authoritative backend
- **All-in is Human vs AI only** — implemented in the client step demo, not a full production-grade betting engine
- **Server poker engine** — turn/river betting rounds in the API engine remain future work
- **Rules-based agents** — no LLM decision-making in the current demo

---

## Next milestone

**v0.4 — Agent Battle full-board simulation**

- Deal turn and river in Agent Battle spectator mode
- Align spectator runout with Human vs AI runout patterns where applicable
- Stronger AI strategy improvements (v0.4 / v0.5)

---

## Status legend

| Label | Meaning |
| ----- | ------- |
| **Done** | Working in current demo |
| **Done (flop-only)** | Shipped with documented scope limit |
| **Mock** | Simulated / dev-only behavior |
| **Prepared** | Code structure ready; production wiring pending |
| **TODO** | Not implemented |

---

## Safe demo claims

| Claim | OK? |
| ----- | --- |
| Play Human vs AI against PokerMaster | Yes |
| Raise sizing (+10/+25/+50/Pot) and all-in | Yes |
| PokerMaster thinking delay before acting | Yes |
| Runout board after all-in call | Yes |
| Reset Demo Stacks when stack depleted | Yes |
| Agent Battle as spectator simulation | Yes |
| Agent Battle deals through river | **No** — flop-only today |
| Mock x402 unlocks arena | Yes |
| Bankr layer prepared | Yes |
| Live session leaderboard | Yes (localStorage) |
| Real x402 live on mainnet | **No** |
| Bankr/x402 production live | **No** (prepared layer only; mock in demo) |
| Real-money gambling | **No** |
