import { parseOffersFromHtml } from "./html-parser";
import type { GrocerySource, SourceSearchInput, SourceSearchResult } from "../types";

type RetailerSourceConfig = {
  id: string;
  name: string;
  baseUrl: string;
  searchUrl: (query: string, postalCode: string) => string;
  unsupported?: string;
};

const USER_AGENT = "Cheapo Singapore grocery comparison prototype (+https://example.local)";

export function createRetailerSource(config: RetailerSourceConfig): GrocerySource {
  return {
    id: config.id,
    name: config.name,
    async search(input: SourceSearchInput): Promise<SourceSearchResult> {
      if (config.unsupported) {
        return {
          offers: [],
          status: "unsupported",
          message: config.unsupported
        };
      }

      const url = config.searchUrl(input.query, input.postalCode);
      const response = await fetch(url, {
        signal: input.signal,
        headers: {
          "accept": "text/html,application/xhtml+xml",
          "accept-language": "en-SG,en;q=0.9",
          "user-agent": USER_AGENT
        },
        cache: "no-store"
      });

      if (!response.ok) {
        return {
          offers: [],
          status: response.status === 403 || response.status === 429 ? "degraded" : "error",
          message: `${config.name} returned HTTP ${response.status}.`
        };
      }

      const html = await response.text();
      const offers = parseOffersFromHtml({
        html,
        query: input.query,
        retailer: config.name,
        baseUrl: config.baseUrl,
        sourceId: config.id
      });

      return {
        offers,
        status: offers.length > 0 ? "ok" : "empty",
        message: offers.length > 0 ? `Found ${offers.length} public result(s).` : "No matching prices found in public page content."
      };
    }
  };
}
