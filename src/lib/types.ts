export type SourceStatus = "ok" | "empty" | "timeout" | "degraded" | "unsupported" | "error";

export type ProductOffer = {
  id: string;
  retailer: string;
  title: string;
  packageSize: string | null;
  price: number;
  currency: "SGD";
  unitPrice: number | null;
  unitLabel: string | null;
  promoText: string | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  productUrl: string;
  imageUrl: string | null;
  fetchedAt: string;
  confidence: number;
};

export type SourceReport = {
  id: string;
  name: string;
  status: SourceStatus;
  message: string;
  checkedAt: string;
  durationMs: number;
  resultCount: number;
};

export type SearchResponse = {
  query: string;
  searchedAt: string;
  offers: ProductOffer[];
  sources: SourceReport[];
};

export type SourceSearchInput = {
  query: string;
  signal: AbortSignal;
};

export type SourceSearchResult = {
  offers: ProductOffer[];
  status: SourceStatus;
  message: string;
};

export type GrocerySource = {
  id: string;
  name: string;
  search(input: SourceSearchInput): Promise<SourceSearchResult>;
};
