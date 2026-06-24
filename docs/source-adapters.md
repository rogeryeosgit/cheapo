# Source Adapter Notes

The adapter layer is intentionally conservative. It fetches public search pages, prefers structured product payloads embedded in server-rendered pages, parses JSON-LD product data when present, and only then falls back to visible text fragments with nearby prices.

## Current Strategy

- FairPrice: parse the server-rendered `__NEXT_DATA__` product collection and normalize stock, image, package size, product URL, and single-item promo price when exposed.
- Cold Storage: parse the server-rendered `initialProducts` payload and normalize promo price, discount label, stock, image, and product URL.
- RedMart: use Lazada's public `ajax=true` search response and keep results scoped to `sellerName: "RedMart"`.
- Sheng Siong: use the public Meteor DDP app method that returns product search data, with the same source timeout and error isolation as other adapters.
- Amazon Fresh: report unsupported until an approved feed or integration is available.

The structured parsers are preferred because they avoid false matches from navigation text, filters, ratings, and promotional copy.

## Adding a Retailer

1. Add a new entry in `src/lib/sources/index.ts`.
2. Provide a stable search URL builder.
3. Add a retailer-specific structured parser when the page exposes server-rendered product data.
4. Return `unsupported` when reliable public access requires login, CAPTCHA, or blocked automation.

## Better Data Options

More reliable search results will come from better data sources, not heavier scraping. Prefer these in order:

1. Retailer partner/API feeds with permission to use prices and availability.
2. Merchant-provided CSV/JSON exports imported on a schedule.
3. Public server-rendered product payloads with short caching and transparent source status.
4. Open Food Facts product metadata and Open Prices observations for barcode matching, user sightings, and validation workflows.
5. User-submitted price sightings with timestamp, source URL, and moderation.
6. Browser-assisted personal shopping mode for a logged-in user, kept local to the user session.

Open Food Facts offers public product APIs, but its own documentation warns that contributed product data is not guaranteed to be accurate, complete, or reliable. Open Prices exposes public price and location endpoints, including SGD support, but it is still best treated as crowdsourced evidence rather than an authoritative live supermarket feed.

Do not commit API credentials, private endpoint details, or access tokens. If an integration needs credentials, read them from environment variables.

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

When a source changes shape, prefer adding or repairing a structured parser fixture before relaxing the generic text parser. Loose parsing can make results look complete while returning the wrong price.

RedMart and Sheng Siong currently depend on public app data paths rather than formal partner APIs. Keep those adapters conservative: avoid authenticated flows, do not reuse private session data, and treat breakage as a source-level degraded state.
