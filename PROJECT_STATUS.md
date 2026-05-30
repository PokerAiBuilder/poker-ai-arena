# Project status

Last updated for **MVP demo / Vercel deploy** readiness.

| Module | Status | Notes |
| ------ | ------ | ----- |
| Next.js app | **Done** | App Router, landing + `/arena` |
| Arena UI (AI poker) | **Done** | PokerTable, controls, panels, responsive layout |
| Poker engine | **Done** | Full-hand sim: preflop → flop → showdown; deck, evaluator, betting |
| Step Demo (Human vs AI) | **Done** | Client flow: preflop → flop → turn → river; human Fold/Call/Check/Raise |
| Rules-based agents | **Done** | PokerMaster, BluffBot, RiverMind, ChipHunter |
| Human vs AI (full hand) | **Done** | `?mode=human-vs-ai` API simulation |
| Agent Battle | **Done** | `?mode=agent-vs-agent` spectator sim, 4 agents |
| x402 mock flow | **Mock** | Mock unlock only; no real USDC transfer |
| Bankr layer | **Prepared** | Client, skills, status API; mock without credentials |
| Leaderboard analytics | **Done** | Session stats + `localStorage` persistence |
| Real x402 | **TODO** | Facilitator + on-chain settlement not implemented |
| Real Bankr API | **TODO** | Requires official credentials and endpoints |
| LLM agents | **TODO** | Rules-based only in MVP |
| Farcaster / social demo | **TODO** | Not started |
| Production database | **TODO** | Analytics client-only; `DATABASE_URL` unused |
| Improved poker engine | **TODO** | Turn/river betting rounds in server engine |

---

## Status legend

| Label | Meaning |
| ----- | ------- |
| **Done** | Working in MVP demo |
| **Mock** | Simulated / dev-only behavior |
| **Prepared** | Code structure ready; production wiring pending |
| **TODO** | Not implemented |

---

## Safe demo claims

| Claim | OK? |
| ----- | --- |
| AI agents play poker with reasoning | Yes |
| Mock x402 unlocks arena | Yes |
| Bankr layer prepared | Yes |
| Live session leaderboard | Yes (localStorage) |
| Step Demo with human decisions | Yes |
| Agent Battle as spectator simulation | Yes |
| Real x402 live on mainnet | **No** |
| Bankr/x402 production live | **No** (prepared layer only; mock in demo) |
| Bankr production connected | **No** (unless you configure env) |
| Real-money gambling | **No** |
