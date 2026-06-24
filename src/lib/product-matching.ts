import type { ProductOffer } from "./types";

const STOP_WORDS = new Set(["the", "and", "for", "with", "low", "fat", "fresh"]);

export function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 1 && !STOP_WORDS.has(part));
}

export function extractPackageSize(title: string): string | null {
  const match = title.match(/\b(\d+(?:\.\d+)?)\s?(ml|l|g|kg|pcs|pc|pack|x\s?\d+)\b/i);
  return match ? match[0].replace(/\s+/g, " ") : null;
}

export function parseUnitPrice(price: number, packageSize: string | null): { unitPrice: number; unitLabel: string } | null {
  if (!packageSize) return null;
  const match = packageSize.match(/(\d+(?:\.\d+)?)\s?(ml|l|g|kg)\b/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (unit === "ml") return { unitPrice: roundMoney((price / amount) * 1000), unitLabel: "per L" };
  if (unit === "l") return { unitPrice: roundMoney(price / amount), unitLabel: "per L" };
  if (unit === "g") return { unitPrice: roundMoney((price / amount) * 1000), unitLabel: "per kg" };
  if (unit === "kg") return { unitPrice: roundMoney(price / amount), unitLabel: "per kg" };
  return null;
}

export function scoreOffer(query: string, title: string): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0.2;

  const titleTokens = new Set(tokenize(title));
  const matches = queryTokens.filter((token) => titleTokens.has(token)).length;
  const coverage = matches / queryTokens.length;
  const exactPhraseBoost = title.toLowerCase().includes(query.toLowerCase()) ? 0.2 : 0;
  return Math.min(1, roundScore(coverage + exactPhraseBoost));
}

export function sortOffers(offers: ProductOffer[]): ProductOffer[] {
  return [...offers].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.retailer.localeCompare(b.retailer);
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
