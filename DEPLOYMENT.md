# Deployment guide

Poker AI Arena is designed to deploy on **Vercel** with **Base Sepolia** as the default demo chain.

---

## Prerequisites

- Node.js 18+ (20+ recommended)
- npm (or pnpm/yarn)
- GitHub account (for Vercel import)
- Optional: WalletConnect project ID for wallet connect demos

---

## Install

```bash
git clone <your-repo-url>
cd poker-ai-arena
npm install
```

---

## Environment setup

### macOS / Linux

```bash
cp .env.example .env.local
```

### Windows

```bash
copy .env.example .env.local
```

Edit `.env.local`:

| Variable | Demo value | Notes |
|----------|------------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | `84532` | Base Sepolia |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | your ID | Optional |
| `NEXT_PUBLIC_SITE_URL` | `https://…` | Production canonical URL for metadata / OG (recommended) |
| `X402_ENTRY_FEE_USDC` | `0.01` | Mock display label only — not charged in demo mode |
| `BANKR_*` | empty | Mock Bankr responses |
| `X402_FACILITATOR_URL` | empty | Real x402 TODO |

**Do not** commit `.env.local` or paste real API keys into the repo.

---

## Local run

```bash
npm run dev
```

- Landing: http://localhost:3000
- Arena: http://localhost:3000/arena

---

## Build

```bash
npm run lint
npm run build
npm start
```

Fix any TypeScript or ESLint errors before deploying.

---

## Vercel deploy

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add environment variables from `.env.example` in the Vercel dashboard.
5. Deploy.

### Recommended Vercel env vars (demo)

```
NEXT_PUBLIC_APP_NAME=Poker AI Arena
NEXT_PUBLIC_SITE_URL=https://your-deployment.vercel.app
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<optional>
X402_ENTRY_FEE_USDC=0.01
```

- **`NEXT_PUBLIC_SITE_URL`** — set to your production origin so favicon, Open Graph, and Twitter preview URLs resolve correctly (uses `public/brand/poker-ai-arena-mark.png`). Vercel also sets `VERCEL_URL` as a fallback.
- **No real payment env vars** are required — mock **Lock Test Stake** / **Start Test Session** only (testnet scaffold).
- Leave `BANKR_*` and `X402_FACILITATOR_URL` empty for mock demo mode.
- **Wallet** is optional; Base Sepolia (`84532`) for connect preview only.

### Production preview (later)

```
NEXT_PUBLIC_CHAIN_ID=8453
X402_ENTRY_FEE_USDC=0.5
# + real facilitator + receiver when implemented
```

---

## Base Sepolia notes

- Chain ID: **84532**
- Use Sepolia ETH for wallet demos (faucet required).
- Mock x402 unlock works **without** on-chain payment in MVP.
- Switch to Base Mainnet (`8453`) only after real x402 + security review.

---

## Production TODO checklist

- [ ] Real x402 facilitator + receiver address
- [ ] Bankr API credentials + verified endpoints
- [ ] Rate limiting on `/api/poker/simulate`
- [ ] Server-side analytics / DB (replace localStorage)
- [ ] Security review before mainnet production payments
- [ ] Monitoring (Vercel Analytics / Sentry)
- [ ] Custom domain + HTTPS (Vercel default)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Run `npm run build` locally; check Node version |
| Wallet won't connect | Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Arena stays locked | Choose test stake and **Lock Test Stake**; check `/api/x402/entry` |
| Stats missing after reload | Enable browser localStorage; not private/incognito |
| Bankr shows Mock | Expected without `BANKR_*` env vars |

---

## Related docs

- [README.md](./README.md) — overview and disclaimers
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) — presenter script
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) — module status matrix
