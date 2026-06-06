# Demo script (60–90 seconds)

Use this script for **Poker AI Arena v1.1** — Bankr community, Base Batches, or hackathon audiences.

The arena is responsive on desktop and mobile (~390px). On mobile, use **Menu** for Decision, Log, and History.

---

## Pitch (15 seconds)

> Poker AI Arena is a premium Base-style AI poker product: play heads-up against PokerMaster or watch a **shared live Agent Battle** with explainable decisions. **v1.1** introduces a testnet stake flow scaffold on Base Sepolia — **test tokens only, no mainnet funds**. Bankr/x402 layers are prepared for production settlement later, not live today.

---

## Live demo steps

### 1. Landing page (`/`) — v1 redesign

- Open the app.
- **Say:** "This is the v1 landing — navy and electric blue, built for Base. Enter Arena takes you to the poker room."
- Point to trust line: **test tokens only**, **Base Sepolia**, **no mainnet funds**.

### 2. Wallet (~10 seconds)

- **Say:** "Connect wallet for the primary testnet stake path on Base Sepolia."
- **Also say:** "Wallet is optional for local preview — you can still **Start Test Session** without connecting."
- Mock stake lock does **not** move real funds.

### 3. Launch arena (`/arena`)

- Click **Enter Arena** or go to `/arena`.
- **Say:** "Arena locked until you choose a test stake and lock a mock session."

### 4. Testnet stake session

- **Connect Wallet** (optional but preferred), choose a test stake tier, click **Lock Test Stake** or **Start Test Session** (sidebar or table overlay).
- **Say:** "Mock testnet stake lock — **no contracts, no real transfer**. Stake amount is stored as session metadata for the escrow phase later."

### 5. Human vs AI (recommended)

- Tap **Play vs PokerMaster** (compact **Human vs AI** pill while a hand is active).
- **Say:** "Live poker-room flow — Fold, Call, Check, Raise, All-in. **15 seconds** per action. Streets and result auto-advance."
- Mention: **Testnet payout receipt coming soon** after results (copy only today).

### 6. Shared live Agent Battle

- Tap **Join Agent Battle** (then **Watching Shared** when synced).
- **Say:** "Four strategy agents on the v1 navy table. Everyone watching gets the **same shared hand** from the server. **Skip animations** is local only."
- **Do not claim** durable Redis/DB yet — memory cache in this demo.

### 7. Explainable AI

- **Menu → AI Decision** — latest reasoning, hand/board context, style tags.
- **Menu → Action Log** (current hand) and **History** (last 10 hands).

### 8. Stats & integration

- **Menu → Leaderboard / Table Stats** — stake session + session stats in localStorage.
- **Menu → Integration** — Bankr/x402 **prepared**, not live for staking.

### 9. Close (~10 seconds)

> v1.1 ships the testnet stake scaffold today. Next: test token config, escrow API, smart contract escrow (v1.2), LLM agents, persistent shared store.

---

## What NOT to claim

- Real x402 or on-chain USDC settlement is **not** live.
- Smart contract escrow is **not** implemented yet.
- Bankr production API is **not** connected without credentials.
- In-table chips are **not** real money.
- Agents are **rules-based bots**, not external LLM players yet.
- Shared state is **not** durable across deploys/instances yet (memory cache).

---

## Backup if API fails

- Refresh; retry **Lock Test Stake** / **Start Test Session**.
- Run `npm run dev` locally.
- Fall back to README + screenshots.
