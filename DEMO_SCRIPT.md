# Demo script (60–90 seconds)

Use this script for **Poker AI Arena v1.0** — Bankr community, Base Batches, or hackathon audiences.

The arena is responsive on desktop and mobile (~390px). On mobile, use **Menu** for Decision, Log, and History.

---

## Pitch (15 seconds)

> Poker AI Arena v1 is a premium Base-style AI poker demo: play heads-up against PokerMaster or watch a **shared live Agent Battle** with explainable decisions. Demo session unlock only — **no real funds move**. Bankr/x402 layers are prepared for production later, not live today.

---

## Live demo steps

### 1. Landing page (`/`) — v1 redesign

- Open the app.
- **Say:** "This is the v1 landing — navy and electric blue, built for Base. Enter Arena takes you to the poker room."
- Point to trust line: **demo chips**, **no real funds moved**, **not real-money gambling**.

### 2. Wallet (optional, ~10 seconds)

- **Say:** "Wallet is optional — the full demo works with **Start Demo Session** only."
- If you connect: **Base testnet preview** — mock unlock does not move real USDC.

### 3. Launch arena (`/arena`)

- Click **Enter Arena** or go to `/arena`.
- **Say:** "Premium v1 arena — locked until demo session starts."

### 4. Demo session unlock

- Click **Start Demo Session** (sidebar or locked overlay).
- **Say:** "Mock x402-style demo access — **no real funds moved**. USDC label is display-only."

### 5. Human vs AI (recommended)

- Tap **Play vs PokerMaster** (compact **Human vs AI** pill while a hand is active).
- **Say:** "Live poker-room flow — Fold, Call, Check, Raise, All-in. **15 seconds** per action. Streets and result auto-advance. Your cards sit **above your avatar** as one bottom seat. Result banner appears **between the board and your cards** — not on top of the felt clutter."
- Show timer, pot, AI Decision in Menu if helpful.

### 6. Shared live Agent Battle

- Tap **Join Agent Battle** (then **Watching Shared** when synced).
- **Say:** "Four demo strategy agents on the v1 navy table. Everyone watching gets the **same shared hand** from the server. **Skip animations** is local only. Open a second tab to prove sync."
- **Do not claim** durable Redis/DB yet — memory cache in this demo.

### 7. Explainable AI

- **Menu → AI Decision** — latest reasoning, hand/board context, style tags.
- **Menu → Action Log** (current hand) and **History** (last 10 hands).

### 8. Stats & integration

- **Menu → Leaderboard / Table Stats** — session stats in localStorage.
- **Menu → Integration** — Bankr layer **prepared**, production wiring **TODO**.

### 9. Close (~10 seconds)

> v1.0 ships the premium demo today. Next: LLM agents via Bankr, persistent shared store, real x402, and stronger mobile Agent Battle layout.

---

## What NOT to claim

- Real x402 or USDC settlement is **not** live.
- Bankr production API is **not** connected without credentials.
- In-game chips are **not** real money.
- Agents are **rules-based demo bots**, not external LLM players yet.
- Shared state is **not** durable across deploys/instances yet (memory cache).

---

## Backup if API fails

- Refresh; retry **Start Demo Session**.
- Run `npm run dev` locally.
- Fall back to README + screenshots.
