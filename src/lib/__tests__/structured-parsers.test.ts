import { describe, expect, it } from "vitest";
import { parseOffersFromHtml } from "../sources/html-parser";
import { parseStructuredOffers } from "../sources/structured-parsers";

describe("structured retailer parsers", () => {
  it("extracts FairPrice products from __NEXT_DATA__ and prefers single-item offer prices", () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          data: {
            data: {
              page: {
                layouts: [
                  {
                    value: {
                      collection: {
                        product: [
                          {
                            id: 198282,
                            clientItemId: "10549750",
                            name: "Meiji Low Fat Fresh Milk - Regular",
                            final_price: 6.97,
                            has_stock: true,
                            slug: "meiji-low-fat-fresh-milk-2lt-10549750",
                            images: ["https://example.com/fairprice.jpg"],
                            metaData: { DisplayUnit: "2L" },
                            offers: [{ price: 6.45, description: "Buy 1 Meiji Low Fat Fresh Milk - Regular @ $6.45" }]
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    })}</script>`;

    const offers = parseStructuredOffers({
      html,
      query: "Meiji Low Fat Milk",
      retailer: "FairPrice",
      baseUrl: "https://www.fairprice.com.sg/",
      sourceId: "fairprice"
    });

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      retailer: "FairPrice",
      title: "Meiji Low Fat Fresh Milk - Regular 2L",
      packageSize: "2L",
      price: 6.45,
      promoText: "Buy 1 Meiji Low Fat Fresh Milk - Regular @ $6.45",
      availability: "in_stock",
      productUrl: "https://www.fairprice.com.sg/product/meiji-low-fat-fresh-milk-2lt-10549750",
      imageUrl: "https://example.com/fairprice.jpg"
    });
  });

  it("extracts Cold Storage products from the streamed initialProducts payload", () => {
    const products = JSON.stringify([
      {
        productId: 89413,
        name: "Meiji Low Fat Fresh Milk 2L",
        slug: "meiji-low-fat-fresh-milk-2l",
        price: 6.95,
        promoPrice: 6.45,
        image: "https://example.com/coldstorage.jpg",
        inventoryStatus: "In Stock",
        discountLabel: "7% off"
      }
    ]).replace(/"/g, '\\"');
    const html = `<script>self.__next_f.push([1,"{\\"initialProducts\\":${products},\\"filters\\":{}}"])</script>`;

    const offers = parseStructuredOffers({
      html,
      query: "Meiji Low Fat Milk",
      retailer: "Cold Storage",
      baseUrl: "https://coldstorage.com.sg/",
      sourceId: "cold-storage"
    });

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      retailer: "Cold Storage",
      title: "Meiji Low Fat Fresh Milk 2L",
      packageSize: "2L",
      price: 6.45,
      promoText: "7% off",
      availability: "in_stock",
      productUrl: "https://coldstorage.com.sg/product/meiji-low-fat-fresh-milk-2l",
      imageUrl: "https://example.com/coldstorage.jpg"
    });
  });

  it("uses structured retailer payloads before generic price fragments", () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
      props: {
        pageProps: {
          data: {
            data: {
              page: {
                layouts: [
                  {
                    value: {
                      collection: {
                        product: [
                          {
                            clientItemId: "10826746",
                            name: "Meiji Low Fat Milk - Regular",
                            final_price: 3.53,
                            has_stock: true,
                            slug: "meiji-low-fat-milk-regular-830ml-10826746",
                            images: ["https://example.com/structured.jpg"],
                            metaData: { DisplayUnit: "830ml" }
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    })}</script><main>Meiji filter navigation $99.99</main>`;

    const offers = parseOffersFromHtml({
      html,
      query: "Meiji Low Fat Milk",
      retailer: "FairPrice",
      baseUrl: "https://www.fairprice.com.sg/",
      sourceId: "fairprice"
    });

    expect(offers).toHaveLength(1);
    expect(offers[0].price).toBe(3.53);
    expect(offers[0].imageUrl).toBe("https://example.com/structured.jpg");
  });
});
