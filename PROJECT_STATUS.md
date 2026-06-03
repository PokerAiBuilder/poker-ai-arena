# Project status

Last updated for **v1.0.0-a** — premium Base-style visual foundation.

---

## v1.0.0-a completed (visual foundation)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Arena v1 CSS tokens | v1.0.0-a | `--arena-*` variables: black/navy surfaces, electric blue, cyan glow, muted text |
| Reusable v1 utilities | v1.0.0-a | `v1-panel`, `v1-card`, `v1-button-*`, `v1-badge`, `v1-glow-border`, `v1-gradient-bg`, etc. |
| Global atmosphere | v1.0.0-a | Body background shifted toward deep navy + Base blue (legacy shadcn/casino tokens retained) |
| Brand mark component | v1.0.0-a | `BrandMark` SVG/CSS chip + spade + neural accent — no embedded text; no `public/` logo asset yet |
| Landing header mark | v1.0.0-a | Site header uses `BrandMark` + text label (minimal safe adoption) |

**Unchanged:** Gameplay logic, Human vs AI timers/auto-flow, Agent Battle simulation/timeline/shared lifecycle/API, payment/demo behavior.

**Next:** v1.0.0-b landing redesign, v1.0.0-c arena redesign (apply v1 utilities broadly).

---

## v0.9.4 completed (production QA/readiness)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Production QA checklist | v0.9.4 | Added final pre-v1.0 checklist for landing, arena, HvAI, Agent Battle, mobile, APIs, metadata |
| Demo script alignment | v0.9.4 | Script wording aligned with current shared Agent Battle and demo-safe access claims |
| Deployment/readme notes | v0.9.4 | Metadata URL env note aligned with v0.9.3 SEO metadata |

**Unchanged:** Gameplay logic, Human vs AI timer/auto-flow, Agent Battle simulation/lifecycle/API, payment/demo behavior.

### Production demo QA checklist

- [x] Landing page (`/`) loads and reflects current live Human vs AI + shared Agent Battle positioning.
- [x] Arena route (`/arena`) loads and remains demo-safe in copy.
- [x] **Start Demo Session** works without wallet connection.
- [x] **Connect Wallet** is optional and framed as Base testnet/Web3 preview.
- [x] Demo-safe wording is visible: demo chips only, no real funds moved, not real-money gambling/casino wagering.

#### Human vs AI

- [x] **Play vs PokerMaster** launches playable heads-up flow.
- [x] 15s player action timer is active.
- [x] Timeout applies legal fallback (**auto-check / auto-fold**).
- [x] Streets and result auto-advance (**flop / turn / river / result**).
- [x] All-in triggers auto-runout.
- [x] PokerMaster private hand metadata stays hidden before showdown.
- [x] Result, New Hand, and Reset Demo Stacks flows behave as expected.

#### Agent Battle (shared spectator)

- [x] Join shared Agent Battle from arena.
- [x] Two windows observe the same shared hand/timeline.
- [x] Auto next-hand transition runs after result pause.
- [x] Skip animations is local-only during playing/replay.
- [x] Result pause state hides Skip control.
- [x] Win-by-fold still renders full 5-card board.
- [x] Action Log and History write once per completed hand.

#### Mobile

- [x] iPhone 12 Pro / 390px class layout remains usable.
- [x] Human vs AI controls are accessible and readable.
- [x] Agent Battle controls and shared status remain usable.
- [x] Arena Menu tabs (**Decision / Agents / Log / History**) remain readable and scroll-safe.

#### API / metadata

- [x] `GET /api/arena/agent-battle/current` returns shared hand payload for spectators.
- [x] `GET /api/arena/agent-battle/status` exposes lifecycle/cache metadata only.
- [x] Status endpoint does **not** expose cards, timeline steps, or finalResult payload.
- [x] Browser title/description metadata is updated to current product positioning.
- [x] No broken `og:image` path is declared (no image path configured).

---

## v0.9.2 completed (wording cleanup)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Demo access panel copy | v0.9.2 | Mock x402-style unlock; USDC shown as mock label (not charged) |
| Wallet UX copy | v0.9.2 | Connect Wallet optional · Base testnet preview hint |
| Arena stats / overlays | v0.9.2 | TableStats mock unlock label; PokerTable locked overlay demo-safe |
| Bankr / integration panel | v0.9.2 | Future production wiring wording — no live payments implied |
| Docs alignment | v0.9.2 | README, DEPLOYMENT, DEMO_SCRIPT — mock vs production clarified |

**Unchanged:** Human vs AI gameplay/timers, Agent Battle shared lifecycle/API, poker engine, payment implementation behavior (mock only).

---

## v0.9.1 completed (landing rewrite)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Landing page rewrite | v0.9.1 | Live Human vs AI + shared Agent Battle; demo-safe hero/features/roadmap |

---

## v0.8.4 completed (QA freeze)

| Item | Version | Notes |
| ---- | ------- | ----- |
| Responsive QA pass | v0.8.4 | Docs/status freeze before v0.9 — no further layout blockers from local QA |
| Desktop / laptop arena | v0.8.4 | QA passed — table, sidebar, action bar, shared status badges |
| Mobile layout (390px) | v0.8.4 | QA passed — iPhone 12 Pro class viewport; no known blocker overflow |
| Human vs AI mobile controls | v0.8.4 | QA passed — poker actions, timer, Menu in action row |
| Agent Battle shared mobile | v0.8.4 | QA passed — Join/watch, Skip during playing, hidden during result pause |
| Arena Menu mobile | v0.8.4 | QA passed — Decision / Agents / Log / History readable in drawer |
| Shared auto-next-hand | v0.8.4 | QA passed — result pause countdown → next shared hand without stuck at 0s |
| Spectator board after fold | v0.8.4 | QA passed — full 5-card board on win-by-fold (display only) |

**Unchanged:** Human vs AI gameplay, Agent Battle simulation/decisions, payment/demo, shared API contract.

---

## v0.8.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Mobile Arena Menu drawer | v0.8.3 | Full-width mobile drawer, scrollable tabs, internal panel scroll |
| Decision tab | v0.8.3 | Mobile access to AI Decision panel (HvAI privacy guard preserved) |
| Panel mobile readability | v0.8.3 | Agents, Log, History, Stats, Board, Integration — wrap, no horizontal clip |
| Side seat layout | v0.8.3 | Mobile Agent Battle left/right seats lower — no board overlap |
| Shared lifecycle fix | v0.8.3 | Robust refetch at `nextHandAt`; retry when same hand at rollover; Skip visible during playing only |

---

## v0.8.2 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Mobile action bar | v0.8.2 | Single mobile control row; Menu in action bar; no duplicate desktop blocks |
| Human turn timer ring | v0.8.2 | Hidden on narrow viewports to save space |
| Tap targets | v0.8.2 | Larger mobile action buttons (`.arena-action-btn-tap`) |

---

## v0.8.1 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Responsive arena shell | v0.8.1 | `arena-shell` grid, badge strip, table stage, sidebar breakpoints |
| Desktop / laptop fit | v0.8.1 | Arena fits viewport without page scroll on common laptop heights |
| Mobile table stage | v0.8.1 | Sidebar hidden `<lg`; Menu becomes primary panel access |

**Also shipped (pre–v0.8.3 menu):** spectator full-board display after Agent Battle fold win (`finalResult` 5 cards; honest action log).

---

## v0.7.4 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Shared arena status API | v0.7.4 | `GET /api/arena/agent-battle/status` — lifecycle/cache metadata only (no cards/timeline) |
| Storage abstraction | v0.7.4 | `SharedAgentBattleStore` interface; default in-memory `globalThis` store |
| Memory-cache limitation | v0.7.4 | Documented in API `note`, PROJECT_STATUS, README — production should use Redis/DB |

**Unchanged:** Human vs AI, Agent Battle gameplay/decisions, shared lifecycle timing, payment/demo.

---

## v0.7.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Shared arena status UI | v0.7.3 | Compact top badges, bottom status pill, no debug in user UI |
| Result-pause layout | v0.7.3 | Compact action bar; no page overflow at 1080p |

---

## v0.7.2 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Shared hand lifecycle | v0.7.2 | `playing` / `result_pause`, auto next hand at `nextHandAt` |
| Watch mode | v0.7.2 | One Join — stay synced; countdown + auto-refresh |

---

## v0.7.1 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Shared Agent Battle API | v0.7.1 | `GET /api/arena/agent-battle/current` — shared timeline + `finalResult` |
| Multi-window sync | v0.7.1 | Same `handId` / cards via server cache; local fallback on API failure |

---

## v0.6.4 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Decision display metadata | v0.6.4 | Optional `handLabel`, `boardLabel`, `pressureLabel`, `styleLabel`, `reasonTags` on decisions |
| Human vs AI panel context | v0.6.4 | PokerMaster hand/board/pressure from step-demo analysis |
| Agent Battle panel context | v0.6.4 | Agent style + hand/board/pressure on spectator decisions |
| AI Decision Panel layout | v0.6.4 | Compact context grid, tags row, style badge; thinking clears stale context |

**Unchanged:** Human vs AI logic, Agent Battle decision logic, gameplay flow/timers, payment/demo.

---

## v0.6.3 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Agent Profiles tab | v0.6.3 | Arena Menu **Agents** tab — four profile cards with trait bars |
| Profile content | v0.6.3 | Title, style, aggression / bluff / range, signature, watch-for |
| Table style badges | v0.6.3 | Agent Battle seats show Balanced / Bluffy / Tight / Aggressive on hover |
| AI Decision style tag | v0.6.3 | Spectator panel shows e.g. `BluffBot · Pressure Bluffer` |

**Unchanged:** Human vs AI logic, Agent Battle decision logic, payment/demo sessions, table layout.

---

## v0.6.2 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| Agent Battle postflop quality | v0.6.2 | Street-aware betting, sizing tiers, honest reasoning in logs |

---

## v0.6.1 completed

| Item | Version | Notes |
| ---- | ------- | ----- |
| PokerMaster HvAI quality | v0.6.1 | Stronger guided-hand decisions and raise sizing |

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
| Shared spectator timeline | **Done** | v0.7.1+ — server shared hand via `/api/arena/agent-battle/current` |
| Shared arena durable storage | **TODO** | v0.7.4+ — Redis/DB for production; memory cache today |
| Real x402 payments | **TODO** | Facilitator + on-chain settlement not implemented |
| Real Bankr API | **TODO** | Requires official credentials and endpoints |
| Stronger AI strategy | **TODO (v0.6)** | Rules-based only today |
| LLM agents | **TODO** | Not started |
| Production database | **TODO** | Analytics client-only; `DATABASE_URL` unused |
| Mobile / responsive arena | **Done** | v0.8.1–v0.8.4 — desktop + mobile layout, Menu, controls, shared lifecycle QA |

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
| Next | Persistent shared state (Redis/DB) for multi-instance production |

---

## History / logs

| Panel | Role |
| ----- | ---- |
| **Action Log** | Current hand — progressive during live HvAI or Agent Battle replay |
| **History** | Archive of recent completed hands (localStorage, last 10) |

---

## Known limitations

- **Shared hand cache is in-memory only** — fine for demo/dev; production needs Redis/DB (see `GET /api/arena/agent-battle/status`)
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
| **v0.7** | Shared spectator API + lifecycle + status UI (done through v0.7.4) |
| **v0.7.5+** | Persistent shared store (Redis/DB) for production |
| **v0.8** | Mobile / responsive polish (**done** through v0.8.4 QA freeze) |
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
| Skip animations (local only during replay; visible during shared playing) | Yes |
| Agent Battle shared synchronized spectator | **Yes** — server memory cache (demo); durable store TODO |
| Mock x402 unlocks arena | Yes |
| Bankr layer prepared | Yes |
| Live session leaderboard | Yes (localStorage) |
| Real x402 live on mainnet | **No** |
| Bankr/x402 production live | **No** (prepared layer only; mock in demo) |
| Real-money gambling | **No** |
