"use client";

import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Search, SlidersHorizontal } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import type { ProductOffer, SearchResponse, SourceReport } from "@/src/lib/types";
import { MAX_QUERY_LENGTH } from "@/src/lib/validation";

type FilterMode = "all" | "in_stock" | "exact";

const PRODUCT_SUGGESTIONS = [
  "Meiji Low Fat Milk",
  "Marigold HL Milk",
  "Farmhouse Fresh Milk",
  "Gardenia White Bread",
  "Sunshine Wholemeal Bread",
  "Fresh Eggs 10s",
  "FairPrice Jasmine Rice 5kg",
  "Royal Umbrella Thai Hom Mali Rice 5kg",
  "Maggi Curry Instant Noodles",
  "Indomie Mi Goreng",
  "Ayam Brand Tuna Chunks",
  "Milo Powder",
  "Nescafe Gold Coffee",
  "Coca-Cola Original Taste",
  "Pokka Green Tea",
  "Banana",
  "Chicken Breast",
  "Salmon Fillet"
];

export default function Home() {
  const [query, setQuery] = useState("Meiji Low Fat Milk");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [keyboardSelectionActive, setKeyboardSelectionActive] = useState(false);

  const productSuggestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
      ? PRODUCT_SUGGESTIONS.filter((suggestion) => suggestion.toLowerCase().includes(normalizedQuery))
      : PRODUCT_SUGGESTIONS;

    return matches.slice(0, 6);
  }, [query]);

  const shouldShowSuggestions = suggestionsOpen && productSuggestions.length > 0;

  const filteredOffers = useMemo(() => {
    const offers = result?.offers ?? [];
    if (filter === "in_stock") return offers.filter((offer) => offer.availability === "in_stock");
    if (filter === "exact") return offers.filter((offer) => offer.confidence >= 0.75);
    return offers;
  }, [filter, result]);

  function updateQuery(value: string) {
    setQuery(value);
    setSuggestionsOpen(true);
    setActiveSuggestionIndex(0);
    setKeyboardSelectionActive(false);
  }

  function chooseSuggestion(suggestion: string) {
    setQuery(suggestion);
    setSuggestionsOpen(false);
    setActiveSuggestionIndex(0);
    setKeyboardSelectionActive(false);
  }

  function handleQueryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!shouldShowSuggestions) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setKeyboardSelectionActive(true);
      setActiveSuggestionIndex((current) => (current + 1) % productSuggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setKeyboardSelectionActive(true);
      setActiveSuggestionIndex((current) => (current - 1 + productSuggestions.length) % productSuggestions.length);
    }

    if (event.key === "Enter" && keyboardSelectionActive) {
      event.preventDefault();
      chooseSuggestion(productSuggestions[activeSuggestionIndex]);
    }

    if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setKeyboardSelectionActive(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuggestionsOpen(false);

    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (normalizedQuery.length < 2 || normalizedQuery.length > MAX_QUERY_LENGTH) {
      setError(`Enter a product search between 2 and ${MAX_QUERY_LENGTH} characters.`);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ q: normalizedQuery });
      const response = await fetch(`/api/search?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Search failed.");
      setResult(body);
    } catch (searchError) {
      setResult(null);
      setError(searchError instanceof Error ? searchError.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-market">
      <section className="border-b border-ink/10 bg-limewash">
        <div className="mx-auto grid min-h-[42vh] max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.15fr_0.85fr] md:items-end md:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-leaf">Singapore grocery finder</p>
            <h1 className="text-4xl font-semibold leading-tight text-ink md:text-6xl">
              Find the cheapest visible price before you shop.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink/70 md:text-lg">
              Search major online grocers serving Singapore, compare item prices first, and see which sources were checked, blocked, or empty.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
            <label className="block text-sm font-medium text-ink" htmlFor="query">
              Product
            </label>
            <div className="relative mt-2">
              <div className="flex items-center gap-2 rounded-md border border-ink/15 bg-white px-3">
                <Search aria-hidden="true" className="h-5 w-5 text-leaf" />
                <input
                  id="query"
                  className="min-h-12 w-full border-0 bg-transparent text-base outline-none"
                  value={query}
                  onBlur={() => {
                    window.setTimeout(() => setSuggestionsOpen(false), 120);
                  }}
                  onChange={(event) => updateQuery(event.target.value)}
                  onFocus={() => setSuggestionsOpen(true)}
                  onKeyDown={handleQueryKeyDown}
                  maxLength={MAX_QUERY_LENGTH}
                  placeholder="Meiji Low Fat Milk"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="product-suggestions"
                  aria-expanded={shouldShowSuggestions}
                  aria-activedescendant={shouldShowSuggestions ? `product-suggestion-${activeSuggestionIndex}` : undefined}
                />
              </div>
              {shouldShowSuggestions ? (
                <div
                  id="product-suggestions"
                  role="listbox"
                  className="mt-2 overflow-hidden rounded-md border border-ink/10 bg-white shadow-panel"
                >
                  {productSuggestions.map((suggestion, index) => (
                    <button
                      id={`product-suggestion-${index}`}
                      key={suggestion}
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                      className={`block min-h-11 w-full px-3 text-left text-sm transition ${
                        index === activeSuggestionIndex ? "bg-limewash text-ink" : "text-ink/75 hover:bg-limewash hover:text-ink"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/40"
            >
              {loading ? <Clock aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Search aria-hidden="true" className="h-5 w-5" />}
              {loading ? "Checking stores" : "Find cheapest"}
            </button>
            {error ? <p className="mt-3 text-sm font-medium text-tomato">{error}</p> : null}
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 md:px-8 lg:px-10">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Results</h2>
            <p className="mt-1 text-sm text-ink/65">
              {result ? `${filteredOffers.length} offer(s) shown for "${result.query}".` : "Run a search to compare live retailer pages."}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-ink/10 bg-white p-1">
            <SlidersHorizontal aria-hidden="true" className="ml-2 h-4 w-4 text-ink/55" />
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              All
            </FilterButton>
            <FilterButton active={filter === "exact"} onClick={() => setFilter("exact")}>
              Exact
            </FilterButton>
            <FilterButton active={filter === "in_stock"} onClick={() => setFilter("in_stock")}>
              In stock
            </FilterButton>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-panel">
            {filteredOffers.length > 0 ? (
              <div className="divide-y divide-ink/10">
                {filteredOffers.map((offer, index) => (
                  <OfferRow key={`${offer.id}-${index}`} offer={offer} best={index === 0} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-ink/60">
                {result ? "No matching visible prices were found. Try a shorter product name or remove size words." : "Results will appear here."}
              </div>
            )}
          </div>

          <aside className="rounded-lg border border-ink/10 bg-white p-4 shadow-panel">
            <h3 className="text-lg font-semibold text-ink">Source status</h3>
            <p className="mt-1 text-sm text-ink/60">Transparent coverage for this search.</p>
            <div className="mt-4 space-y-3">
              {(result?.sources ?? []).map((source) => (
                <SourceStatus key={source.id} source={source} />
              ))}
              {!result ? <p className="text-sm text-ink/55">No sources checked yet.</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 rounded px-3 text-sm font-medium transition ${
        active ? "bg-ink text-white" : "text-ink/70 hover:bg-limewash hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function OfferRow({ offer, best }: { offer: ProductOffer; best: boolean }) {
  return (
    <article className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          {best ? <span className="rounded bg-mango px-2 py-1 text-xs font-bold text-ink">Cheapest item price</span> : null}
          <span className="rounded bg-limewash px-2 py-1 text-xs font-semibold text-leaf">{offer.retailer}</span>
          <span className="text-xs text-ink/50">{Math.round(offer.confidence * 100)}% match</span>
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{offer.title}</h3>
        <p className="mt-1 text-sm text-ink/60">
          {offer.packageSize ?? "Package size unknown"}
          {offer.unitPrice ? ` • S$${offer.unitPrice.toFixed(2)} ${offer.unitLabel}` : ""}
          {offer.promoText ? ` • ${offer.promoText}` : ""}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 md:min-w-44 md:flex-col md:items-end">
        <div className="text-3xl font-bold text-ink">S${offer.price.toFixed(2)}</div>
        <a
          href={offer.productUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-ink/15 px-3 text-sm font-semibold text-ink hover:bg-limewash"
        >
          Open <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

function SourceStatus({ source }: { source: SourceReport }) {
  const ok = source.status === "ok";
  return (
    <div className="rounded-md border border-ink/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {ok ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-leaf" /> : <AlertTriangle aria-hidden="true" className="h-4 w-4 text-tomato" />}
          <span className="font-medium text-ink">{source.name}</span>
        </div>
        <span className="rounded bg-ink/5 px-2 py-1 text-xs font-semibold uppercase text-ink/60">{source.status}</span>
      </div>
      <p className="mt-2 text-sm leading-5 text-ink/60">{source.message}</p>
      <p className="mt-2 text-xs text-ink/45">{source.durationMs}ms • {source.resultCount} result(s)</p>
    </div>
  );
}
