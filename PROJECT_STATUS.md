# Project status

Last updated for **v0.5.4** — docs/status for live poker-room flow and timeline Agent Battle replay.

---

## v0.5.4 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| README v0.5 update | v0.5.4 | Live HvAI flow, timeline Agent Battle, History vs Action Log |
| PROJECT_STATUS v0.5 | v0.5.4 | v0.5.1–v0.5.3 completed; v0.6–v1.0 milestones |
| DEMO_SCRIPT v0.5 | v0.5.4 | Play vs PokerMaster, Agent Battle timeline, Skip animations |

---

## v0.5.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Timeline-based Agent Battle replay | v0.5.3 | Steps with `atMs` / `durationMs`; UI derives state from elapsed time |
| Progressive Action Log | v0.5.3 | Log entries reveal as timeline advances |
| Progressive board reveal | v0.5.3 | Flop / turn / river appear on timeline schedule |
| Skip animations | v0.5.3 | Local-only skip during replay; jumps to final result; history applied once |
| Chained replay timers removed | v0.5.3 | Replaced by `useAgentBattleTimelineReplay` (200 ms tick) |

**Future:** shared spectator mode with one synchronized timeline for all viewers.

---

## v0.5.2 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Live Agent Battle autoplay | v0.5.2 | Four agents act street by street with real postflop betting |
| Active bot highlight | v0.5.2 | Acting agent highlighted during replay steps |
| Preflop / flop / turn / river decisions | v0.5.2 | Full street betting in spectator sim (not flop-only runout) |
| Full-board result | v0.5.2 | 5-card board + showdown or fold win at end |

---

## v0.5.1 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Live Human vs AI poker-room flow | v0.5.1 | Player makes poker decisions only; streets and result advance automatically |
| Auto-deal streets | v0.5.1 | Flop / turn / river deal after each betting round |
| Auto-show result | v0.5.1 | Showdown / fold result without manual reveal step |
| All-in auto-runout | v0.5.1 | Remaining streets deal automatically after all-in call |
| 15-second action timer | v0.5.1 | Avatar ring + action bar countdown |
| Timeout auto-check / auto-fold | v0.5.1 | Expired timer applies legal default action |
| Explicit New Hand | v0.5.1 | New hand remains player-initiated |

---

## v0.4.4 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Action Log replay UI | v0.4.4 | Street filter chips, action-type badges, pot context |
| Showdown / result blocks | v0.4.4 | Winner, hand, pot won — visually separated from street actions |
| Log normalization | v0.4.4 | Pattern-based metadata from existing `GameAction` messages |

---

## v0.4.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Recent Hands / Hand History | v0.4.3 | Arena Menu **History** tab — last 10 hands, localStorage |
| Human vs AI recording | v0.4.3 | Recorded when live hand reaches final result (deduped) |
| Agent Battle recording | v0.4.3 | Recorded when spectator sim completes or skip finishes (per hand fingerprint) |
| Clear History | v0.4.3 | Clears hand history only — not stacks or session stats |

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
| Honest action log | v0.4.1 | Preflop agent actions + board runout logs |
| Agent Battle UI | v0.4.1 | Full 5-card board, updated result banner and labels |

---

## v0.3 completed (unchanged)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Raise sizing (+10 / +25 / +50 / Pot) | v0.3.1 | Human vs AI |
| All-in support | v0.3.2 | Human all-in, PokerMaster call/fold, auto-runout |
| PokerMaster thinking delay | v0.3.3 | 1.2–5 s delay + 5.5 s safety fallback |
| Human vs AI action-state hardening | v0.3.4 | Strict UI states via `deriveStepDemoUiState()` |
| Stack depleted handling | v0.3.4 | Reset Demo Stacks only; no New Hand when depleted |

---

## Module matrix

| Module | Status | Notes |
| ------ | ------ | ----- |
| Next.js app | **Done** | App Router, landing + `/arena` |
| Arena UI (AI poker) | **Done** | PokerTable, controls, panels, responsive layout |
| Human vs AI (live flow) | **Done** | v0.5.1 poker-room flow; 15 s timer; auto streets/result |
| Rules-based agents | **Done** | PokerMaster, BluffBot, RiverMind, ChipHunter |
| Agent Battle (live autoplay) | **Done** | v0.5.2 street-by-street spectator sim with postflop betting |
| Agent Battle (timeline replay) | **Done** | v0.5.3 elapsed-time replay, progressive log/board, Skip animations |
| Poker engine (server) | **Done (partial)** | Agent Battle full street betting; Human vs AI API sim still legacy one-shot |
| Human vs AI (API one-shot) | **Done** | `?mode=human-vs-ai` legacy quick sim (unchanged) |
| Hand history | **Done** | History tab — recent archive; Action Log = current hand |
| x402 mock flow | **Mock** | Demo session unlock only; no real USDC transfer |
| Bankr layer | **Prepared** | Client, skills, status API; mock without credentials |
| Leaderboard analytics | **Done** | Session stats + `localStorage` persistence |
| Shared spectator timeline | **TODO** | v0.7+ — one timeline for all viewers |
| Real x402 payments | **TODO** | Facilitator + on-chain settlement not implemented |
| Real Bankr API | **TODO** | Requires official credentials and endpoints |
| Stronger AI strategy | **TODO (v0.6)** | Rules-based only today |
| LLM agents | **TODO** | Not started |
| Production database | **TODO** | Analytics client-only; `DATABASE_URL` unused |
| Mobile polish | **TODO (v0.8)** | Responsive improvements ongoing |

---

## Agent Battle status

| Aspect | Current state |
| ------ | ------------- |
| Mode | **Spectator only** — user does not act |
| Simulation | Server computes full hand; client plays timeline replay |
| Agents | 4 (PokerMaster, BluffBot, RiverMind, ChipHunter) |
| Card visibility | All agent hole cards visible after deal |
| Betting | Preflop, flop, turn, river — real agent decisions each street |
| Replay | Timeline with `atMs` / `durationMs`; 200 ms tick; progressive UI |
| Skip | **Skip animations** — local only; no Pause/Speed (shared timeline prep) |
| Results | Showdown (best hand) or Win by fold; applied once to history |
| Next | Shared spectator mode with synchronized timeline (v0.7+) |

---

## History / logs

| Panel | Role |
| ----- | ---- |
| **Action Log** | Current hand — progressive during live HvAI or Agent Battle replay |
| **History** | Archive of recent completed hands (localStorage, last 10) |

---

## Known limitations

- **No shared spectator yet** — replay timeline is local per browser; synchronized viewing is future work
- **No Pause / Speed in Agent Battle** — intentional; shared mode needs one authoritative timeline
- **Skip animations is local only** — does not change the simulated hand outcome
- **No real-money payments** — mock x402 demo unlock only; Bankr production not wired
- **Demo stacks / local session only** — analytics in `localStorage`; no authoritative backend
- **All-in is Human vs AI only** — not wired into Agent Battle engine
- **Human vs AI API legacy sim** — still preflop → flop → showdown one-shot (unchanged)
- **Rules-based agents** — no LLM decision-making in the current demo

---

## Next milestones

| Version | Focus |
| ------- | ----- |
| **v0.6** | Smarter AI / decision quality |
| **v0.7** | Shared engine cleanup — prep synchronized spectator timeline |
| **v0.8** | Mobile / responsive polish |
| **v0.9** | Web3 / demo access cleanup |
| **v1.0** | Public demo release |

Parallel track: real x402 / Bankr production wiring when credentials and endpoints are ready.

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
| Play Human vs AI against PokerMaster (live flow) | Yes |
| 15 s action timer with auto-check / auto-fold | Yes |
| Streets auto-deal and result auto-shows | Yes |
| All-in auto-runout | Yes |
| Raise sizing (+10/+25/+50/Pot) | Yes |
| PokerMaster thinking delay before acting | Yes |
| Reset Demo Stacks when stack depleted | Yes |
| Agent Battle live spectator autoplay | Yes |
| Agent Battle timeline replay + progressive Action Log | Yes |
| Skip animations (local only during replay) | Yes |
| Agent Battle shared synchronized spectator | **No** — local timeline only |
| Mock x402 unlocks arena | Yes |
| Bankr layer prepared | Yes |
| Live session leaderboard | Yes (localStorage) |
| Real x402 live on mainnet | **No** |
| Bankr/x402 production live | **No** (prepared layer only; mock in demo) |
| Real-money gambling | **No** |
