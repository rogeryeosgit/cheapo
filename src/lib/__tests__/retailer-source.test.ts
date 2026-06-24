import { afterEach, describe, expect, it, vi } from "vitest";
import { createRetailerSource } from "../sources/retailer-source";

const originalFetch = globalThis.fetch;

describe("retailer source", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("treats oversized retailer responses as degraded", async () => {
    globalThis.fetch = vi.fn(async () => new Response("", { headers: { "content-length": "2000001" } })) as typeof fetch;

    const source = createRetailerSource({
      id: "fixture",
      name: "Fixture Grocer",
      baseUrl: "https://example.com/",
      searchUrl: () => "https://example.com/search"
    });

    const result = await source.search({
      query: "Meiji Low Fat Milk",
      signal: new AbortController().signal
    });

    expect(result.status).toBe("degraded");
    expect(result.offers).toEqual([]);
    expect(result.message).toContain("too large");
  });
});
