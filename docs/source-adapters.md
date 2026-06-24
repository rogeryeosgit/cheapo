# Source Adapter Notes

The first adapter layer is intentionally conservative. It can fetch public search pages, parse JSON-LD product data when present, and fall back to visible text fragments with nearby prices.

## Adding a Retailer

1. Add a new entry in `src/lib/sources/index.ts`.
2. Provide a stable search URL builder.
3. Prefer structured data or public feed parsing over brittle HTML fragments.
4. Return `unsupported` when reliable public access requires login, CAPTCHA, or blocked automation.

## Result Expectations

Each offer should include:

- Retailer name
- Product title
- Item price in SGD
- Product URL
- Package size when parseable
- Unit price when parseable
- Confidence score against the user query

## Operational Notes

Live retailer pages can change without notice. Keep adapter tests fixture-based and treat source failures as normal runtime states, not application failures.
