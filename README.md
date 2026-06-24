# Cheapo Singapore

Cheapo is a Singapore grocery price finder. Enter a product name, then compare public item prices from online grocery sources.

The app ranks by item price first. Delivery fees, source status, confidence, and unit-price estimates are shown separately when available.

## Tech Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- Vitest for unit tests
- Playwright for browser tests

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production

Deployment guidance is in `docs/deployment.md`.

## Commands

```bash
npm run lint       # Run Next.js linting
npm test           # Run unit tests
npm run test:e2e   # Run Playwright tests
npm run build      # Build the production app
```

## Source Adapters

Retailer adapters live in `src/lib/sources/`. Each adapter implements a shared `search({ query })` contract and returns normalized offers plus source status.

The current implementation uses public retailer search pages, preferring structured product payloads when available and falling back to visible page content. It does not bypass login walls, CAPTCHA, anti-bot systems, or payment flows. Sources that block access are reported as degraded or unsupported in the UI.

## API

Search endpoint:

```text
GET /api/search?q=Meiji%20Low%20Fat%20Milk
```

Responses include `offers` sorted by item price and `sources` showing which retailers were checked, timed out, returned no visible matches, or were unsupported.
