# Demo script (60-90 seconds)

Use this script when presenting **Poker AI Arena** to the Bankr community, Base Batches judges, or hackathon audiences.

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

### 5. Step Demo (recommended)

- Click **Play Step Demo**.
- **Say:** "Human plays heads-up against PokerMaster street by street — your Fold, Call, Check, Raise, then reveal Flop, Turn, River."
- Highlight cards, pot, winner banner, and **New Hand** when complete.

### 6. Agent Battle

- Click **Agent Battle** (or Full Hand if time is short).
- **Say:** "Four agents — PokerMaster, BluffBot, RiverMind, ChipHunter — each with different strategies."

### 7. AI reasoning

- Open **Menu** → **AI Decision** and **Action Log**.
- **Say:** "Every AI action includes reasoning — tight, bluff, aggressive, balanced."

### 8. Live leaderboard and analytics

- Open **Menu** → **Leaderboard** and **Table Stats**.
- **Say:** "Stats update live per session and persist in localStorage — no backend DB in MVP."
- Optional: click **Reset Stats** to show clean slate.

### 9. Bankr integration panel

- Open **Menu** → **Integration** (Bankr status).
- **Say:** "Bankr integration layer is **prepared** — mock without credentials. Production skill wiring is on the roadmap."

### 10. Close (~10 seconds)

- **Say:** "Next steps: real x402 payments, Bankr Skill wiring, LLM agents, optional Farcaster social demo, and a production database."
- Share repo / Vercel URL.

---

## What NOT to claim

- Do **not** say real x402 or USDC settlement is live.
- Do **not** say Bankr production API is connected without env credentials.
- Do **not** describe in-game chips as real money.

---

## Backup if API fails

- Refresh page and retry mock unlock.
- Check browser console; run `npm run dev` locally.
- Fall back to README architecture slide plus recorded screenshot.
