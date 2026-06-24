import { createRetailerSource } from "./retailer-source";
import { createShengSiongSource } from "./sheng-siong-source";
import type { GrocerySource } from "../types";

export const sources: GrocerySource[] = [
  createRetailerSource({
    id: "fairprice",
    name: "FairPrice",
    baseUrl: "https://www.fairprice.com.sg/",
    searchUrl: (query) => `https://www.fairprice.com.sg/search?query=${encodeURIComponent(query)}`
  }),
  createRetailerSource({
    id: "cold-storage",
    name: "Cold Storage",
    baseUrl: "https://coldstorage.com.sg/",
    searchUrl: (query) => `https://coldstorage.com.sg/search?q=${encodeURIComponent(query)}`
  }),
  createRetailerSource({
    id: "redmart",
    name: "RedMart",
    baseUrl: "https://www.lazada.sg/",
    searchUrl: (query) => `https://redmart.lazada.sg/catalog/?ajax=true&q=${encodeURIComponent(query)}`
  }),
  createShengSiongSource(),
  createRetailerSource({
    id: "amazon-fresh",
    name: "Amazon Fresh Singapore",
    baseUrl: "https://www.amazon.sg/",
    searchUrl: (query) => `https://www.amazon.sg/s?k=${encodeURIComponent(query)}&i=nowstore`,
    unsupported: "Amazon pages commonly require anti-bot validation; add an approved feed or partner integration for reliable coverage."
  })
];
