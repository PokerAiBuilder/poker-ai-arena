# Demo script (60-90 seconds)

Use this script when presenting **Poker AI Arena** to the Bankr community, Base Batches judges, or hackathon audiences.

The arena is **responsive** — the same demo flow works on **desktop/laptop** and **mobile** (e.g. iPhone 12 Pro / 390px). Use Menu on mobile for Decision, Log, and History.

---

## Pitch (15 seconds)

> Poker AI Arena is an autonomous AI poker demo on Base where agents compete, explain decisions, and generate live arena stats. The MVP uses Bankr-ready integration layers and a demo session unlock (x402-style flow mocked in this MVP).

---

## Live demo steps

### 1. Landing page (`/`)

- Open the app.
- **Say:** "This is Poker AI Arena — AI agents playing poker on Base, built for demo and hackathon showcases."
- Point to footer: **demo chips only**, **demo session unlock**, **no real-money gambling**.

### 2. Wallet (optional, ~10 seconds)

- Click **Connect Wallet** if you want to show Base testnet wallet scaffold.
- **Say:** "Wallet connect is wired for Base testnet first; demo session unlock does not require real USDC in this MVP."

### 3. Launch arena (`/arena`)

- Navigate to **Arena**.
- **Say:** "The arena starts locked — start a demo session to play."

### 4. Demo session unlock

- Click **Start Demo Session**.
- **Say:** "This is a **demo** session unlock — no real funds move. The x402-style access flow is mocked in this MVP."
- Show receipt (demo tx / demo receipt) and **Demo Mode** badge.

### 5. Play vs PokerMaster (recommended)

- Click **Play vs PokerMaster**.
- **Say:** "Live poker-room flow — you only make poker decisions. Fold, Call, Check, Raise with sizing (+10/+25/+50/Pot), or go all-in. You have **15 seconds** per action; timeout auto-checks or auto-folds. Flop, turn, and river **auto-deal**; the result **auto-shows**. All-in triggers an **auto-runout**. Start **New Hand** when you're ready for the next deal."
- Highlight the action timer, cards, pot, thinking state, and winner banner.
- If stack hits zero: **Reset Demo Stacks** (no auto-refill).

### 6. Run Agent Battle

- Click **Run Agent Battle** (or **Run Agent Battle Again** after a completed hand).
- **Say:** "Spectator mode — four agents with different strategies. Agents act **one by one** street by street with an **active bot highlight**. The board and Action Log reveal progressively through a **timeline replay**. **Skip animations** is **local only** — it jumps to the final result on your device without changing the simulated hand. No pause or speed controls — that's intentional for future shared spectator mode."
- Point out progressive board, Action Log, and final result.

### 7. History and Action Log

- Open **Menu** → **Action Log** and **History**.
- **Say:** "Action Log is the **current hand** replay. History is the **recent archive** of completed hands. Every AI action includes reasoning — tight, bluff, aggressive, balanced."
- Optional: **Menu** → **AI Decision** for the latest agent reasoning panel.

### 8. Live leaderboard and analytics

- Open **Menu** → **Leaderboard** and **Table Stats**.
- **Say:** "Stats update live per session and persist in localStorage — no backend DB in MVP."
- Optional: click **Reset Stats** to show clean slate.

### 9. Bankr integration panel

- Open **Menu** → **Integration** (Bankr status).
- **Say:** "Bankr integration layer is **prepared** — mock without credentials. Production skill wiring is on the roadmap."

### 10. Close (~10 seconds)

- **Say:** "Next steps: smarter AI (v0.6), shared spectator is live on memory cache (Redis/DB for production), mobile layout is polished (v0.8), real x402 payments, Bankr Skill wiring, and a production database."
- Share repo / Vercel URL.

---

## What NOT to claim

- Do **not** say real x402 or USDC settlement is live.
- Do **not** say Bankr production API is connected without env credentials.
- Do **not** describe in-game chips as real money.
- Do **not** claim shared synchronized spectator mode is live (timeline replay is local today).

---

## Backup if API fails

- Refresh page and retry mock unlock.
- Check browser console; run `npm run dev` locally.
- Fall back to README architecture slide plus recorded screenshot.
