# Project status

Last updated for **v0.4.4** — Action Log replay polish.

---

## v0.4.4 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Action Log replay UI | v0.4.4 | Street filter chips, action-type badges, pot context |
| Showdown / result blocks | v0.4.4 | Winner, hand, pot won — visually separated from street actions |
| Log normalization | v0.4.4 | Pattern-based metadata from existing `GameAction` messages |

**Future:** full interactive hand replay remains TODO.

---

## v0.4.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Recent Hands / Hand History | v0.4.3 | Arena Menu **History** tab — last 10 hands, localStorage |
| Human vs AI recording | v0.4.3 | Recorded when Step Demo reaches showdown result (deduped) |
| Agent Battle recording | v0.4.3 | Recorded when spectator sim returns (per `gameId`) |
| Clear History | v0.4.3 | Clears hand history only — not stacks or session stats |

**Future:** full hand replay remains TODO.

---

## v0.4.2 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Agent Battle personalities | v0.4.2 | PokerMaster, BluffBot, RiverMind, ChipHunter preflop styles |
| Preflop action log story | v0.4.2 | Readable spectator messages with PREFLOP / FLOP / TURN / RIVER / SHOWDOWN labels |
| Board runout logs | v0.4.2 | Flop / turn / river dealt + optional personality reactions |
| AI Decision panel | v0.4.2 | Latest meaningful agent decision with reasoning |
| Human vs AI stack isolation | v0.4.2 | Agent Battle no longer mutates heads-up demo stacks |

---

## v0.4.1 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Full-board Agent Battle | v0.4.1 | 5 community cards (flop + turn + river) in spectator sim |
| Agent Battle showdown eval | v0.4.1 | Best 5-card hand from 2 hole + 5 board; fold wins excluded |
| Honest action log | v0.4.1 | Preflop agent actions + board runout logs (no fake street betting) |
| Agent Battle UI | v0.4.1 | Full 5-card board, updated result banner and labels |

---

## v0.3 completed (unchanged)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Raise sizing (+10 / +25 / +50 / Pot) | v0.3.1 | Human vs AI Step Demo |
| All-in support | v0.3.2 | Human all-in, PokerMaster call/fold, runout board |
| PokerMaster thinking delay | v0.3.3 | 1.2–5 s delay + 5.5 s safety fallback |
| Human vs AI action-state hardening | v0.3.4 | Strict UI states via `deriveStepDemoUiState()` |
| Stack depleted handling | v0.3.4 | Reset Demo Stacks only; no New Hand when depleted |

---

## Module matrix

| Module | Status | Notes |
| ------ | ------ | ----- |
| Next.js app | **Done** | App Router, landing + `/arena` |
| Arena UI (AI poker) | **Done** | PokerTable, controls, panels, responsive layout |
| Human vs AI (Step Demo) | **Done** | Client flow: preflop → flop → turn → river; raise sizing; all-in |
| Rules-based agents | **Done** | PokerMaster, BluffBot, RiverMind, ChipHunter |
| Agent Battle | **Done** | Spectator sim, 4 agents, full 5-card board, showdown / fold results |
| Poker engine (server) | **Done (partial)** | Agent Battle full board; Human vs AI API sim still preflop → flop → showdown |
| Human vs AI (API one-shot) | **Done** | `?mode=human-vs-ai` legacy quick sim (unchanged) |
| x402 mock flow | **Mock** | Demo session unlock only; no real USDC transfer |
| Bankr layer | **Prepared** | Client, skills, status API; mock without credentials |
| Leaderboard analytics | **Done** | Session stats + `localStorage` persistence |
| Real x402 payments | **TODO** | Facilitator + on-chain settlement not implemented |
| Real Bankr API | **TODO** | Requires official credentials and endpoints |
| Step-by-step Agent Battle | **TODO** | One-click spectator only today |
| Agent Battle street betting | **TODO** | Preflop decisions only; board runout after |
| Stronger AI strategy | **TODO (v0.4/v0.5)** | Rules-based only today |
| LLM agents | **TODO** | Not started |
| Production database | **TODO** | Analytics client-only; `DATABASE_URL` unused |
| Mobile polish / full hand replay | **TODO** | Hand history (v0.4.3) + Action Log polish (v0.4.4); interactive replay not started |

---

## Agent Battle status

| Aspect | Current state |
| ------ | ------------- |
| Mode | **Spectator only** — user does not act; one-click simulation |
| Agents | 4 (PokerMaster, BluffBot, RiverMind, ChipHunter) |
| Card visibility | All agent hole cards visible after deal |
| Board | **Full 5-card board** when hand reaches showdown (flop + turn + river) |
| Betting | Preflop agent decisions only; turn/river are board runout (no street betting) |
| Personalities | Distinct preflop styles per agent (v0.4.2) |
| Results | **Showdown** (best hand) or **Win by fold** |
| Next | Step-by-step AI vs AI spectator playback (future) |

---

## Known limitations

- **Agent Battle is one-click** — no step-by-step street playback yet
- **No turn/river betting in Agent Battle** — board runout after preflop; not a full betting engine
- **No real-money payments** — mock x402 demo unlock only; Bankr production not wired
- **Demo stacks / local session only** — analytics in `localStorage`; no authoritative backend
- **All-in is Human vs AI only** — client step demo; not wired into Agent Battle engine
- **Human vs AI API legacy sim** — still preflop → flop → showdown (unchanged)
- **Rules-based agents** — no LLM decision-making in the current demo

---

## Next milestone

**v0.4+ — step-by-step Agent Battle and stronger AI**

- Optional street-by-street spectator playback for AI vs AI
- Stronger AI strategy and betting logic (v0.4 / v0.5)
- Real x402 / Bankr production wiring (separate track)

---

## Status legend

| Label | Meaning |
| ----- | ------- |
| **Done** | Working in current demo |
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
| Agent Battle full 5-card board at showdown | Yes |
| Agent Battle step-by-step playback | **No** — one-click only |
| Mock x402 unlocks arena | Yes |
| Bankr layer prepared | Yes |
| Live session leaderboard | Yes (localStorage) |
| Real x402 live on mainnet | **No** |
| Bankr/x402 production live | **No** (prepared layer only; mock in demo) |
| Real-money gambling | **No** |
