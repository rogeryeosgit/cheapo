import { getCached, setCached } from "./cache";
import { sortOffers } from "./product-matching";
import { normalizeQuery } from "./validation";
import { sources } from "./sources";
import type { SearchResponse, SourceReport, SourceSearchResult } from "./types";

const CACHE_TTL_MS = 10 * 60 * 1000;
const SOURCE_TIMEOUT_MS = 8_000;

export async function searchGroceries(rawQuery: string): Promise<SearchResponse> {
  const query = normalizeQuery(rawQuery);
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached<SearchResponse>(cacheKey);
  if (cached) return cached;

  const searchedAt = new Date().toISOString();
  const results = await Promise.all(sources.map((source) => searchOneSource(source, query)));
  const offers = sortOffers(results.flatMap((result) => result.result.offers));
  const response: SearchResponse = {
    query,
    searchedAt,
    offers,
    sources: results.map((result) => result.report)
  };

  setCached(cacheKey, response, CACHE_TTL_MS);
  return response;
}

async function searchOneSource(source: (typeof sources)[number], query: string): Promise<{ result: SourceSearchResult; report: SourceReport }> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);

  try {
    const result = await source.search({ query, signal: controller.signal });
    const durationMs = Date.now() - started;
    return {
      result,
      report: {
        id: source.id,
        name: source.name,
        status: result.status,
        message: result.message,
        checkedAt,
        durationMs,
        resultCount: result.offers.length
      }
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const durationMs = Date.now() - started;
    const status = isTimeout ? "timeout" : "error";
    return {
      result: {
        offers: [],
        status,
        message: isTimeout ? `${source.name} timed out.` : `${source.name} search failed.`
      },
      report: {
        id: source.id,
        name: source.name,
        status,
        message: isTimeout ? `${source.name} timed out.` : `${source.name} search failed.`,
        checkedAt,
        durationMs,
        resultCount: 0
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}
