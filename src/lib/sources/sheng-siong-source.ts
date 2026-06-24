import { extractPackageSize, parseUnitPrice, scoreOffer } from "../product-matching";
import type { GrocerySource, ProductOffer, SourceSearchInput, SourceSearchResult } from "../types";

const PRODUCT_IMAGE_BASE_URL = "https://ssecomm.s3.ap-southeast-1.amazonaws.com/products";
const DDP_BASE_URL = "wss://www.shengsiong.com.sg/sockjs";

type ShengSiongProduct = {
  _id?: { $value?: string };
  brand?: string;
  name?: string;
  packSize?: string;
  price?: number;
  prevPrice?: number;
  slug?: string;
  isSoldOut?: boolean;
  imgKey?: string;
  associatedPromoRules?: Record<string, { label?: string; description?: string }>;
};

export function createShengSiongSource(): GrocerySource {
  return {
    id: "sheng-siong",
    name: "Sheng Siong",
    async search(input: SourceSearchInput): Promise<SourceSearchResult> {
      if (typeof WebSocket === "undefined") {
        return {
          offers: [],
          status: "unsupported",
          message: "Sheng Siong requires a WebSocket-capable runtime for its public app data."
        };
      }

      const products = await fetchProducts(input.query, input.signal);
      const offers = products.map((product) => normalizeProduct(product, input.query)).filter((offer): offer is ProductOffer => Boolean(offer));

      return {
        offers,
        status: offers.length > 0 ? "ok" : "empty",
        message: offers.length > 0 ? `Found ${offers.length} public result(s).` : "No matching prices found in public app data."
      };
    }
  };
}

function normalizeProduct(product: ShengSiongProduct, query: string): ProductOffer | null {
  const brand = stringValue(product.brand);
  const name = stringValue(product.name);
  const price = numberValue(product.price);
  if (!name || !price) return null;

  const packageSize = stringValue(product.packSize) ?? extractPackageSize(name);
  const titleBase = brand && !name.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${name}` : name;
  const title = packageSize && !titleBase.toLowerCase().includes(packageSize.toLowerCase()) ? `${titleBase} ${packageSize}` : titleBase;
  const unit = parseUnitPrice(price, packageSize);
  const slug = stringValue(product.slug);
  const id = product._id?.$value ?? slug ?? title;
  const promoText = firstPromoText(product.associatedPromoRules);
  const imgKey = stringValue(product.imgKey);

  return {
    id: `sheng-siong-${slugify(id)}-${price}`,
    retailer: "Sheng Siong",
    title,
    packageSize,
    price,
    currency: "SGD",
    unitPrice: unit?.unitPrice ?? null,
    unitLabel: unit?.unitLabel ?? null,
    promoText,
    availability: product.isSoldOut === true ? "out_of_stock" : product.isSoldOut === false ? "in_stock" : "unknown",
    productUrl: slug ? `https://www.shengsiong.com.sg/product/${slug}` : "https://www.shengsiong.com.sg/",
    imageUrl: imgKey ? `${PRODUCT_IMAGE_BASE_URL}/md/${imgKey}.0.jpg` : null,
    fetchedAt: new Date().toISOString(),
    confidence: scoreOffer(query, title)
  };
}

function fetchProducts(query: string, signal: AbortSignal): Promise<ShengSiongProduct[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(buildDdpUrl());
    const methodId = "1";
    let settled = false;
    let methodSent = false;

    function settle(callback: () => void): void {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      ws.close();
      callback();
    }

    function abort(): void {
      settle(() => reject(abortError()));
    }

    signal.addEventListener("abort", abort, { once: true });

    ws.onerror = () => {
      settle(() => reject(new Error("Sheng Siong app data connection failed.")));
    };

    ws.onmessage = (event) => {
      const data = String(event.data);
      if (data === "o") {
        sendDdp(ws, { msg: "connect", version: "1", support: ["1", "pre2", "pre1"] });
        return;
      }

      for (const message of parseSockJsMessages(data)) {
        if (message.msg === "connected" && !methodSent) {
          methodSent = true;
          sendDdp(ws, {
            msg: "method",
            id: methodId,
            method: "Products.getByAllSlugs",
            params: buildProductParams(query)
          });
        }

        if (message.msg === "ping") {
          sendDdp(ws, { msg: "pong", id: message.id });
        }

        if (message.msg === "result" && message.id === methodId) {
          if (message.error) {
            settle(() => reject(new Error("Sheng Siong app data returned an error.")));
            return;
          }
          settle(() => resolve(Array.isArray(message.result) ? (message.result as ShengSiongProduct[]) : []));
        }
      }
    };
  });
}

function buildDdpUrl(): string {
  const serverId = Math.floor(Math.random() * 1000);
  const sessionId = Math.random().toString(36).slice(2, 12);
  return `${DDP_BASE_URL}/${serverId}/${sessionId}/websocket`;
}

function buildProductParams(query: string): unknown[] {
  const slug = slugify(query);
  return [
    {
      categoryFilter: { slugs: [] },
      campaignPageFilter: { slug: "", category: { slug: "" } },
      shoppingListFilter: { slug: "", category: { slug: "" }, search: { slug: "" }, showKeptForLater: false },
      searchFilter: { slug, category: { slug: "" } },
      preOrderCampaignFilter: { slug: "", category: { slug: "" } },
      ecommPromotionFilter: { active: false, category: { slug: "" } }
    },
    {
      brands: { slugs: [] },
      prices: { slugs: [] },
      countryOfOrigins: { slugs: [] },
      dietaryHabits: { slugs: [] },
      tags: { slugs: [] },
      promotionTypes: { slugs: [] },
      sortBy: { slug: "" }
    },
    1,
    20
  ];
}

function sendDdp(ws: WebSocket, payload: Record<string, unknown>): void {
  ws.send(JSON.stringify([JSON.stringify(payload)]));
}

function parseSockJsMessages(data: string): Record<string, unknown>[] {
  if (!data.startsWith("a")) return [];
  try {
    const frames = JSON.parse(data.slice(1));
    if (!Array.isArray(frames)) return [];
    return frames.map((frame) => JSON.parse(String(frame))).filter((frame) => frame && typeof frame === "object");
  } catch {
    return [];
  }
}

function firstPromoText(rules: ShengSiongProduct["associatedPromoRules"]): string | null {
  const rule = Object.values(rules ?? {})[0];
  return stringValue(rule?.label) ?? stringValue(rule?.description);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number > 0 ? number : null;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64);
}

function abortError(): Error {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}
