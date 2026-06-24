import { describe, expect, it } from "vitest";
import { parseOffersFromHtml } from "../sources/html-parser";

describe("html parser", () => {
  it("rejects framework and filter fragments masquerading as product offers", () => {
    const offers = parseOffersFromHtml({
      html: `
        <main>
          <div>__PAGE__?{"q":"Meiji Low Fat Milk"} $1.00 undefined true</div>
          <aside>Filter by Country/place of origin Thailand Brand Meiji Price $3.00</aside>
          <article>Meiji Low Fat Chocolate Milk 2L $3.75</article>
        </main>
      `,
      query: "Meiji Low Fat Milk",
      retailer: "Fixture Grocer",
      baseUrl: "https://example.com",
      sourceId: "fixture"
    });

    expect(offers).toHaveLength(1);
    expect(offers[0].title).toBe("Meiji Low Fat Chocolate Milk 2L");
    expect(offers[0].price).toBe(3.75);
  });
});
