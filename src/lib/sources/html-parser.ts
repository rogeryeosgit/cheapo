import { extractPackageSize, parseUnitPrice, scoreOffer } from "../product-matching";
import type { ProductOffer } from "../types";
import { parseStructuredOffers } from "./structured-parsers";

type ParseInput = {
  html: string;
  query: string;
  retailer: string;
  baseUrl: string;
  sourceId: string;
};

export function parseOffersFromHtml(input: ParseInput): ProductOffer[] {
  const structuredOffers = parseStructuredOffers(input);
  if (structuredOffers.length > 0) return dedupeOffers(structuredOffers);

  const jsonLdOffers = parseJsonLdOffers(input);
  if (jsonLdOffers.length > 0) return dedupeOffers(jsonLdOffers);
  return dedupeOffers(parsePriceFragments(input));
}

function parseJsonLdOffers(input: ParseInput): ProductOffer[] {
  const blocks = [...input.html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const offers: ProductOffer[] = [];

  for (const block of blocks) {
    const raw = decodeHtml(stripTags(block[1])).trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of flattenJsonLd(nodes)) {
        const title = typeof node.name === "string" ? node.name : null;
        const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers;
        const price = Number(offer?.price ?? node.price);
        if (!title || !Number.isFinite(price) || price <= 0) continue;
        offers.push(buildOffer(input, title, price, typeof node.url === "string" ? node.url : input.baseUrl, typeof node.image === "string" ? node.image : null));
      }
    } catch {
      continue;
    }
  }

  return offers;
}

function parsePriceFragments(input: ParseInput): ProductOffer[] {
  const text = decodeHtml(stripTags(input.html)).replace(/\s+/g, " ");
  const queryTokens = input.query.toLowerCase().split(/\s+/).filter(Boolean);
  const requiredTokens = significantQueryTokens(input.query);
  const offers: ProductOffer[] = [];
  const priceMatches = [...text.matchAll(/\$\s?(\d+(?:\.\d{1,2})?)/g)].slice(0, 80);

  for (const match of priceMatches) {
    const index = match.index ?? 0;
    const context = text.slice(Math.max(0, index - 140), Math.min(text.length, index + 180));
    const lowerContext = context.toLowerCase();
    const hasQueryToken = queryTokens.some((token) => lowerContext.includes(token));
    if (!hasQueryToken) continue;
    if (isPromoAmountContext(context, index - Math.max(0, index - 140))) continue;

    const beforePrice = context.slice(0, Math.max(0, index - Math.max(0, index - 140)));
    const title = cleanTitle(beforePrice.split(/\$\s?\d+(?:\.\d{1,2})?/).at(-1) ?? "");
    const price = Number(match[1]);
    if (!title || !Number.isFinite(price) || price <= 0) continue;
    if (!isPlausibleProductTitle(title, requiredTokens)) continue;
    offers.push(buildOffer(input, title, price, input.baseUrl, null));
  }

  return offers;
}

function buildOffer(input: ParseInput, title: string, price: number, productUrl: string, imageUrl: string | null): ProductOffer {
  const packageSize = extractPackageSize(title);
  const unit = parseUnitPrice(price, packageSize);
  const now = new Date().toISOString();

  return {
    id: `${input.sourceId}-${slugify(title)}-${price}`,
    retailer: input.retailer,
    title,
    packageSize,
    price,
    currency: "SGD",
    unitPrice: unit?.unitPrice ?? null,
    unitLabel: unit?.unitLabel ?? null,
    promoText: null,
    availability: "unknown",
    productUrl: absolutizeUrl(productUrl, input.baseUrl),
    imageUrl,
    fetchedAt: now,
    confidence: scoreOffer(input.query, title)
  };
}

function flattenJsonLd(nodes: unknown[]): Record<string, unknown>[] {
  const output: Record<string, unknown>[] = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const record = node as Record<string, unknown>;
    output.push(record);
    if (Array.isArray(record["@graph"])) output.push(...flattenJsonLd(record["@graph"]));
    if (Array.isArray(record.itemListElement)) output.push(...flattenJsonLd(record.itemListElement));
    if (record.item && typeof record.item === "object") output.push(record.item as Record<string, unknown>);
  }
  return output;
}

function dedupeOffers(offers: ProductOffer[]): ProductOffer[] {
  const seen = new Set<string>();
  return offers.filter((offer) => {
    const key = `${offer.retailer}:${offer.title.toLowerCase()}:${offer.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return offer.confidence >= 0.6;
  });
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function cleanTitle(value: string): string {
  const words = value
    .replace(/\b(add to cart|save|any \d+ at|online exclusive|rating|stars?)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");

  return words.slice(Math.max(0, words.length - 14)).join(" ").slice(0, 140);
}

function significantQueryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["low", "fat", "fresh", "the", "and", "for", "with"].includes(token));
}

function isPlausibleProductTitle(title: string, requiredTokens: string[]): boolean {
  const lowerTitle = title.toLowerCase();
  if (title.length < 8) return false;
  if (/[{}[\]\\]/.test(title)) return false;
  if (/\b(__page__|undefined|filter|relevancy|weekly promotions|dietary attributes|country\/place|cart)\b/i.test(title)) return false;
  if (/\bprice$/i.test(title)) return false;
  if (requiredTokens.length === 0) return true;
  return requiredTokens.every((token) => lowerTitle.includes(token));
}

function isPromoAmountContext(context: string, localPriceIndex: number): boolean {
  const before = context.slice(Math.max(0, localPriceIndex - 32), localPriceIndex).toLowerCase();
  const after = context.slice(localPriceIndex, Math.min(context.length, localPriceIndex + 80)).toLowerCase();
  return /\b(save|saved|rebate)\s*$/.test(before) || /\b(saved|rebate)\b/.test(after);
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}

function absolutizeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}
