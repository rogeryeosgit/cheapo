import { describe, expect, it } from "vitest";
import { extractPackageSize, parseUnitPrice, scoreOffer, sortOffers } from "../product-matching";
import type { ProductOffer } from "../types";

describe("product matching", () => {
  it("extracts common package sizes", () => {
    expect(extractPackageSize("Meiji Low Fat Milk 2L")).toBe("2L");
    expect(extractPackageSize("Rice 5 kg")).toBe("5 kg");
    expect(extractPackageSize("Tissue 4 x 200 per pack")).toBe("4 x 200");
  });

  it("parses unit prices for liquids and weight", () => {
    expect(parseUnitPrice(6.4, "2L")).toEqual({ unitPrice: 3.2, unitLabel: "per L" });
    expect(parseUnitPrice(2.5, "500g")).toEqual({ unitPrice: 5, unitLabel: "per kg" });
  });

  it("scores direct matches higher than loose matches", () => {
    expect(scoreOffer("Meiji Low Fat Milk", "Meiji Low Fat Milk 2L")).toBeGreaterThan(scoreOffer("Meiji Low Fat Milk", "Farmhouse Fresh Milk 946ml"));
  });

  it("sorts by item price first, then confidence", () => {
    const offers = [
      offer("Cold Storage", 4.5, 0.9),
      offer("FairPrice", 3.9, 0.4),
      offer("RedMart", 3.9, 0.8)
    ];

    expect(sortOffers(offers).map((item) => item.retailer)).toEqual(["RedMart", "FairPrice", "Cold Storage"]);
  });
});

function offer(retailer: string, price: number, confidence: number): ProductOffer {
  return {
    id: retailer,
    retailer,
    title: `${retailer} Milk`,
    packageSize: "1L",
    price,
    currency: "SGD",
    unitPrice: price,
    unitLabel: "per L",
    promoText: null,
    availability: "unknown",
    productUrl: "https://example.com",
    imageUrl: null,
    fetchedAt: "2026-06-24T00:00:00.000Z",
    confidence
  };
}
