import { createRetailerSource } from "./retailer-source";
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
    baseUrl: "https://redmart.lazada.sg/",
    searchUrl: (query) => `https://redmart.lazada.sg/catalog/?q=${encodeURIComponent(query)}`
  }),
  createRetailerSource({
    id: "sheng-siong",
    name: "Sheng Siong",
    baseUrl: "https://www.shengsiong.com.sg/",
    searchUrl: (query) => `https://www.shengsiong.com.sg/search?q=${encodeURIComponent(query)}`
  }),
  createRetailerSource({
    id: "amazon-fresh",
    name: "Amazon Fresh Singapore",
    baseUrl: "https://www.amazon.sg/",
    searchUrl: (query) => `https://www.amazon.sg/s?k=${encodeURIComponent(query)}&i=nowstore`,
    unsupported: "Amazon pages commonly require anti-bot validation; add an approved feed or partner integration for reliable coverage."
  })
];
