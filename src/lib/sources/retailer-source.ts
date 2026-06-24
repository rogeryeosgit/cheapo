import { parseOffersFromHtml } from "./html-parser";
import type { GrocerySource, SourceSearchInput, SourceSearchResult } from "../types";

type RetailerSourceConfig = {
  id: string;
  name: string;
  baseUrl: string;
  searchUrl: (query: string) => string;
  unsupported?: string;
};

const USER_AGENT = "Cheapo Singapore grocery comparison prototype (+https://example.local)";
const MAX_SOURCE_RESPONSE_BYTES = 2_000_000;

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

      const url = config.searchUrl(input.query);
      const response = await fetch(url, {
        signal: input.signal,
        headers: {
          "accept": "application/json,text/html,application/xhtml+xml",
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

      const htmlResult = await readResponseTextWithinLimit(response, MAX_SOURCE_RESPONSE_BYTES);
      if (!htmlResult.ok) {
        return {
          offers: [],
          status: "degraded",
          message: `${config.name} response was too large to process safely.`
        };
      }

      const html = htmlResult.text;
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

async function readResponseTextWithinLimit(response: Response, maxBytes: number): Promise<{ ok: true; text: string } | { ok: false }> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return { ok: false };

  if (!response.body) {
    const text = await response.text();
    return new TextEncoder().encode(text).byteLength <= maxBytes ? { ok: true, text } : { ok: false };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { ok: false };
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return { ok: true, text };
}
