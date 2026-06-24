import { extractPackageSize, parseUnitPrice, scoreOffer } from "../product-matching";
import type { ProductOffer } from "../types";

type StructuredParseInput = {
  html: string;
  query: string;
  retailer: string;
  baseUrl: string;
  sourceId: string;
};

type OfferDraft = {
  sourceKey: string;
  title: string;
  packageSize: string | null;
  price: number;
  promoText: string | null;
  availability: ProductOffer["availability"];
  productUrl: string;
  imageUrl: string | null;
};

export function parseStructuredOffers(input: StructuredParseInput): ProductOffer[] {
  if (input.sourceId === "fairprice") return parseFairPriceOffers(input);
  if (input.sourceId === "cold-storage") return parseColdStorageOffers(input);
  if (input.sourceId === "redmart") return parseRedMartOffers(input);
  return [];
}

function parseFairPriceOffers(input: StructuredParseInput): ProductOffer[] {
  const data = extractNextData(input.html);
  if (!data) return [];

  const products = findArrays(data)
    .filter((items) => looksLikeFairPriceProducts(items))
    .sort((a, b) => b.length - a.length)[0];
  if (!products) return [];

  return products
    .map((product) => {
      const record = asRecord(product);
      const title = stringValue(record.name);
      const basePrice = numberValue(record.final_price);
      if (!title || !basePrice) return null;

      const offer = bestFairPriceOffer(record.offers);
      const price = offer.price ?? basePrice;
      const packageSize = stringValue(asRecord(record.metaData).DisplayUnit) ?? extractPackageSize(title);
      const slug = stringValue(record.slug);
      const images = Array.isArray(record.images) ? record.images : [];
      const imageUrl = stringValue(images[0]) ?? null;

      return buildOffer(input, {
        sourceKey: String(record.clientItemId ?? record.id ?? slug ?? title),
        title: packageSize && !title.toLowerCase().includes(packageSize.toLowerCase()) ? `${title} ${packageSize}` : title,
        packageSize,
        price,
        promoText: offer.text,
        availability: record.has_stock === true ? "in_stock" : record.has_stock === false ? "out_of_stock" : "unknown",
        productUrl: slug ? `https://www.fairprice.com.sg/product/${slug}` : input.baseUrl,
        imageUrl
      });
    })
    .filter((offer): offer is ProductOffer => Boolean(offer));
}

function parseColdStorageOffers(input: StructuredParseInput): ProductOffer[] {
  const products = extractColdStorageInitialProducts(input.html);
  return products
    .map((product) => {
      const record = asRecord(product);
      const title = stringValue(record.name);
      const regularPrice = numberValue(record.price);
      const promoPrice = numberValue(record.promoPrice);
      const price = promoPrice ?? regularPrice;
      if (!title || !price) return null;

      const slug = stringValue(record.slug);
      const packageSize = extractPackageSize(title);
      const discountLabel = stringValue(record.discountLabel);

      return buildOffer(input, {
        sourceKey: String(record.productId ?? slug ?? title),
        title,
        packageSize,
        price,
        promoText: discountLabel,
        availability: stringValue(record.inventoryStatus)?.toLowerCase() === "in stock" ? "in_stock" : "unknown",
        productUrl: slug ? `https://coldstorage.com.sg/product/${slug}` : input.baseUrl,
        imageUrl: stringValue(record.image) ?? null
      });
    })
    .filter((offer): offer is ProductOffer => Boolean(offer));
}

function parseRedMartOffers(input: StructuredParseInput): ProductOffer[] {
  const products = extractRedMartListItems(input.html);
  return products
    .map((product) => {
      const record = asRecord(product);
      if (stringValue(record.sellerName)?.toLowerCase() !== "redmart") return null;

      const title = stringValue(record.name);
      const price = numberValue(record.price) ?? priceFromDisplay(stringValue(record.priceShow));
      if (!title || !price) return null;

      const itemUrl = stringValue(record.itemUrl);
      const packageSize = extractPackageSize(title);
      const discount = stringValue(record.discount);

      return buildOffer(input, {
        sourceKey: String(record.itemId ?? record.nid ?? record.skuId ?? title),
        title,
        packageSize,
        price,
        promoText: discount,
        availability: record.inStock === true ? "in_stock" : record.inStock === false ? "out_of_stock" : "unknown",
        productUrl: itemUrl ? absolutizeUrl(itemUrl, input.baseUrl) : input.baseUrl,
        imageUrl: stringValue(record.image) ?? null
      });
    })
    .filter((offer): offer is ProductOffer => Boolean(offer));
}

function buildOffer(input: StructuredParseInput, draft: OfferDraft): ProductOffer {
  const unit = parseUnitPrice(draft.price, draft.packageSize);
  return {
    id: `${input.sourceId}-${slugify(draft.sourceKey)}-${draft.price}`,
    retailer: input.retailer,
    title: draft.title,
    packageSize: draft.packageSize,
    price: draft.price,
    currency: "SGD",
    unitPrice: unit?.unitPrice ?? null,
    unitLabel: unit?.unitLabel ?? null,
    promoText: draft.promoText,
    availability: draft.availability,
    productUrl: absolutizeUrl(draft.productUrl, input.baseUrl),
    imageUrl: draft.imageUrl,
    fetchedAt: new Date().toISOString(),
    confidence: scoreOffer(input.query, draft.title)
  };
}

function extractRedMartListItems(html: string): unknown[] {
  try {
    const parsed = JSON.parse(html);
    const listItems = asRecord(asRecord(parsed).mods).listItems;
    return Array.isArray(listItems) ? listItems : [];
  } catch {
    return [];
  }
}

function extractNextData(html: string): unknown | null {
  const match = html.match(/<script id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(decodeHtml(match[1]));
  } catch {
    return null;
  }
}

function extractColdStorageInitialProducts(html: string): unknown[] {
  const marker = '\\"initialProducts\\":[';
  const start = html.indexOf(marker);
  if (start < 0) return [];

  const arrayStart = start + marker.length - 1;
  const arrayEnd = findMatchingArrayEnd(html, arrayStart);
  if (arrayEnd < 0) return [];

  const raw = html
    .slice(arrayStart, arrayEnd)
    .replace(/\\"/g, '"')
    .replace(/\\u0026/g, "&");

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findMatchingArrayEnd(value: string, start: number): number {
  let depth = 0;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function findArrays(value: unknown): unknown[][] {
  const arrays: unknown[][] = [];
  visit(value);
  return arrays;

  function visit(node: unknown): void {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      arrays.push(node);
      node.forEach(visit);
      return;
    }
    Object.values(node).forEach(visit);
  }
}

function looksLikeFairPriceProducts(items: unknown[]): boolean {
  return (
    items.length > 0 &&
    items.some((item) => {
      const record = asRecord(item);
      return typeof record.name === "string" && typeof record.final_price === "number" && (typeof record.slug === "string" || typeof record.clientItemId === "string");
    })
  );
}

function bestFairPriceOffer(value: unknown): { price: number | null; text: string | null } {
  if (!Array.isArray(value)) return { price: null, text: null };
  for (const item of value) {
    const record = asRecord(item);
    const price = numberValue(record.price);
    if (price) return { price, text: stringValue(record.description) ?? stringValue(record.shortDescriptionA) };
  }
  return { price: null, text: stringValue(asRecord(value[0]).description) ?? stringValue(asRecord(value[0]).shortDescriptionA) };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number > 0 ? number : null;
}

function priceFromDisplay(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\d+(?:\.\d{1,2})?/);
  return match ? numberValue(match[0]) : null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
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
