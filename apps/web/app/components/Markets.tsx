"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Ticker } from "../utils/types";
import { getTickers } from "../utils/httpClient";
import {
  formatCompact,
  formatPercent,
  formatPrice,
  rangePosition,
} from "../utils/format";
import { useFavorites } from "../utils/useFavorites";
import { CoinLogo, baseAsset, isPerp, quoteAsset } from "./CoinLogo";
import { PerpBadge } from "./core/Badge";
import { Skeleton } from "./core/Skeleton";
import { Star } from "./core/Star";
import { ArrowUpRight, Chevron, SearchIcon } from "./core/Icons";
import { RangeMeter } from "./market/RangeMeter";

type SortKey =
  "symbol" | "lastPrice" | "high" | "quoteVolume" | "priceChangePercent";
type Sort = { key: SortKey; dir: "asc" | "desc" };
type Filter = "all" | "gainers" | "losers" | "favorites";
type MarketType = "all" | "spot" | "perpetual";
const PAGE_SIZE = 12;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All markets" },
  { value: "favorites", label: "Watchlist" },
  { value: "gainers", label: "Gainers" },
  { value: "losers", label: "Losers" },
];
const columns: { label: string; key: SortKey; visibility: string }[] = [
  { label: "Asset", key: "symbol", visibility: "" },
  { label: "Price", key: "lastPrice", visibility: "" },
  {
    label: "24h change",
    key: "priceChangePercent",
    visibility: "hidden sm:table-cell",
  },
  {
    label: "24h volume",
    key: "quoteVolume",
    visibility: "hidden md:table-cell",
  },
  { label: "24h range", key: "high", visibility: "hidden xl:table-cell" },
];
const assetNames: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  USDC: "USD Coin",
  USDT: "Tether",
  SUI: "Sui",
  XRP: "XRP",
  DOGE: "Dogecoin",
  AAVE: "Aave",
  LINK: "Chainlink",
  AVAX: "Avalanche",
  BNB: "BNB",
  HYPE: "Hyperliquid",
  ADA: "Cardano",
};

export function Markets() {
  const [tickers, setTickers] = useState<Ticker[]>();
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<Sort>({ key: "quoteVolume", dir: "desc" });
  const [filter, setFilter] = useState<Filter>("all");
  const [marketType, setMarketType] = useState<MarketType>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const { favorites, toggle, isFavorite } = useFavorites();

  const retry = useCallback(async () => {
    setRefreshing(true);
    try {
      setTickers(await getTickers());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const data = await getTickers();
        if (!disposed) {
          setTickers(data);
          setError(false);
        }
      } catch {
        if (!disposed) setError(true);
      }
    };
    void load();
    const timer = window.setInterval(load, 10_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, []);

  const rows = useMemo(() => {
    if (!tickers) return undefined;
    const needle = query
      .trim()
      .toLowerCase()
      .replace(/[/_\s]/g, "");
    return tickers
      .filter((t) => {
        const name = assetNames[baseAsset(t.symbol)]?.toLowerCase() ?? "";
        if (
          needle &&
          !t.symbol.toLowerCase().replace(/_/g, "").includes(needle) &&
          !name.includes(needle)
        )
          return false;
        if (marketType === "spot" && isPerp(t.symbol)) return false;
        if (marketType === "perpetual" && !isPerp(t.symbol)) return false;
        if (filter === "gainers") return Number(t.priceChangePercent) > 0;
        if (filter === "losers") return Number(t.priceChangePercent) < 0;
        if (filter === "favorites") return favorites.includes(t.symbol);
        return true;
      })
      .sort((a, b) => {
        const flip = sort.dir === "asc" ? 1 : -1;
        return (
          flip *
          (sort.key === "symbol"
            ? a.symbol.localeCompare(b.symbol)
            : Number(a[sort.key]) - Number(b[sort.key]))
        );
      });
  }, [tickers, query, marketType, filter, favorites, sort]);

  const totalPages = Math.max(1, Math.ceil((rows?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleRows = rows?.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const selectFilter = (value: Filter) => {
    setFilter(value);
    setPage(0);
  };
  const toggleSort = (key: SortKey) => {
    setPage(0);
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "symbol" ? "asc" : "desc" },
    );
  };

  return (
    <div className="flex flex-col gap-7">
      <Overview tickers={tickers} error={error} />
      {error && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm"
        >
          <p className="text-muted-foreground">
            {tickers
              ? "Prices may be out of date. The next update will retry automatically."
              : "Market data is temporarily unavailable. Try loading it again."}
          </p>
          <button
            type="button"
            onClick={retry}
            disabled={refreshing}
            className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {refreshing ? "Retrying…" : "Retry connection"}
          </button>
        </div>
      )}
      <FeaturedMarkets tickers={tickers} unavailable={error && !tickers} />
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_268px] xl:gap-7">
        <section
          aria-label="Market directory"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="flex flex-col gap-4 px-4 pt-5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Explore markets{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {tickers?.length ?? "—"} pairs
                </span>
              </h2>
              <select
                aria-label="Market type"
                value={marketType}
                onChange={(e) => {
                  setMarketType(e.target.value as MarketType);
                  setPage(0);
                }}
                className="h-9 rounded-lg border border-border bg-card px-3 text-xs text-muted-foreground"
              >
                <option value="all">Spot & perpetuals</option>
                <option value="spot">Spot only</option>
                <option value="perpetual">Perpetuals only</option>
              </select>
            </div>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div
                className="flex gap-1"
                role="group"
                aria-label="Filter markets"
              >
                {filters.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={filter === value}
                    onClick={() => selectFilter(value)}
                    className={`market-filter min-h-10 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors sm:text-sm ${filter === value ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                  >
                    {label}
                    {value === "favorites" && favorites.length > 0 && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="relative w-full xl:w-48">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="market-search"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Search markets"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Search assets…"
                  className="h-10 w-full rounded-lg border border-border bg-background/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:border-ring"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto thin-scrollbar">
            <table className="market-table w-full table-auto">
              <caption className="sr-only">
                Live markets. Select an asset to trade or a column heading to
                sort.
              </caption>
              <thead>
                <tr>
                  {columns.map(({ label, key, visibility }, i) => (
                    <th
                      scope="col"
                      key={key}
                      aria-sort={
                        sort.key === key
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                      className={`market-cell ${visibility} ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={`inline-flex min-h-8 items-center gap-1 whitespace-nowrap text-[11px] font-medium transition-colors hover:text-foreground ${sort.key === key ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {label}
                        <svg
                          viewBox="0 0 12 12"
                          className={`h-3 w-3 ${sort.key === key ? "" : "opacity-30"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          aria-hidden="true"
                        >
                          <path
                            d={
                              sort.key === key && sort.dir === "asc"
                                ? "m3 7 3-3 3 3"
                                : "m3 5 3 3 3-3"
                            }
                          />
                        </svg>
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="hidden w-10 pr-4 xl:table-cell">
                    <span className="sr-only">Trade</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!rows &&
                  !error &&
                  Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}
                {visibleRows?.map((market) => (
                  <MarketRow
                    key={market.symbol}
                    market={market}
                    starred={isFavorite(market.symbol)}
                    onStar={() => toggle(market.symbol)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {rows?.length === 0 && (
            <div className="border-t border-border px-5 py-16 text-center">
              <p className="font-medium">
                {filter === "favorites" && !query
                  ? "Your watchlist starts here"
                  : "No markets found"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === "favorites" && !query
                  ? "Select the star beside any market to keep it close."
                  : "Try another asset name or adjust your filters."}
              </p>
              {(query || marketType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setMarketType("all");
                    setFilter("all");
                    setPage(0);
                  }}
                  className="mt-4 min-h-10 rounded-lg border border-border px-4 text-sm transition-colors hover:bg-muted"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
          {!rows && error && (
            <p className="border-t border-border px-5 py-16 text-center text-sm text-muted-foreground">
              Connect to market data to explore the latest prices.
            </p>
          )}
          <div className="flex min-h-16 items-center justify-between gap-3 border-t border-border px-4 text-xs text-muted-foreground sm:px-5">
            <span aria-live="polite">
              {rows
                ? rows.length
                  ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, rows.length)} of ${rows.length} markets`
                  : "0 markets"
                : "Waiting for market data"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-30"
              >
                <Chevron direction="left" className="h-4 w-4" />
              </button>
              <span className="px-1 tabular-nums">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-30"
              >
                <Chevron className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
        <MarketPulse
          tickers={tickers}
          unavailable={error && !tickers}
          favorites={favorites}
          onWatchlist={() => {
            selectFilter("favorites");
            document
              .querySelector('[aria-label="Market directory"]')
              ?.scrollIntoView({ block: "start", behavior: "instant" });
          }}
        />
      </div>
    </div>
  );
}

function Overview({ tickers, error }: { tickers?: Ticker[]; error: boolean }) {
  const stats = useMemo(() => {
    if (!tickers?.length) return undefined;
    // Aggregate only USDC pairs; other quote currencies have different units.
    const usdc = tickers.filter((t) => quoteAsset(t.symbol) === "USDC");
    return {
      volume: usdc.reduce((sum, t) => sum + Number(t.quoteVolume || 0), 0),
      gainers: tickers.filter((t) => Number(t.priceChangePercent) > 0).length,
      losers: tickers.filter((t) => Number(t.priceChangePercent) < 0).length,
    };
  }, [tickers]);
  return (
    <div className="overview-strip flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-y border-border py-5">
      <div className="grid w-full grid-cols-[1fr_0.8fr_1fr] gap-3 sm:flex sm:w-auto sm:gap-x-10">
        <div>
          <p className="text-xs text-muted-foreground">
            24h volume{" "}
            <span className="hidden text-[10px] sm:inline">· USDC pairs</span>
          </p>
          <p className="mt-1.5 text-lg font-semibold tabular-nums sm:text-xl">
            {stats ? `$${formatCompact(stats.volume)}` : "—"}
          </p>
          <span className="text-[10px] text-muted-foreground sm:hidden">
            USDC pairs
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Listed markets</p>
          <p className="mt-1.5 text-xl font-semibold tabular-nums">
            {tickers ? tickers.length : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            <span className="sm:hidden">Up / down</span>
            <span className="hidden sm:inline">Advancing / declining</span>
          </p>
          <p className="mt-1.5 text-lg font-semibold tabular-nums sm:text-xl">
            <span className="text-up">{stats?.gainers ?? "—"}</span>
            <span className="mx-2 font-normal text-foreground/20">/</span>
            <span className="text-down">{stats?.losers ?? "—"}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`h-1.5 w-1.5 rounded-full ${error ? "bg-down" : tickers ? "bg-up" : "bg-muted-foreground"}`}
        />
        <span>
          {error
            ? "Updates interrupted"
            : tickers
              ? "Live market data"
              : "Connecting to markets"}
        </span>
      </div>
    </div>
  );
}

function FeaturedMarkets({
  tickers,
  unavailable,
}: {
  tickers?: Ticker[];
  unavailable: boolean;
}) {
  const featured = ["BTC_USDC", "ETH_USDC", "SOL_USDC"].map((symbol) =>
    tickers?.find((t) => t.symbol === symbol),
  );
  if (unavailable) return null;
  if (tickers && !featured.some(Boolean)) return null;
  return (
    <section
      aria-label="Major markets"
      className="grid auto-cols-[minmax(260px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-1 thin-scrollbar sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:pb-0"
    >
      {featured.map((market, i) => {
        if (!market)
          return (
            <div
              key={i}
              className="min-h-[216px] rounded-xl border border-border bg-card p-5"
            >
              {unavailable || tickers ? (
                <p className="text-sm text-muted-foreground">
                  Market unavailable
                </p>
              ) : (
                <>
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="mt-6 h-8 w-40" />
                  <Skeleton className="mt-8 h-5 w-full" />
                </>
              )}
            </div>
          );
        const base = baseAsset(market.symbol);
        const up = Number(market.priceChangePercent) >= 0;
        return (
          <Link
            key={market.symbol}
            href={`/trade/${market.symbol}`}
            className="featured-market group block rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CoinLogo asset={base} className="h-9 w-9" />
                <div>
                  <h2 className="text-sm font-semibold">
                    {assetNames[base] ?? base}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {base} <span className="mx-1 text-foreground/20">/</span>{" "}
                    USDC
                  </p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <div className="mb-7 mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                ${formatPrice(market.lastPrice)}
              </p>
              <span
                className={`text-xs font-medium tabular-nums ${up ? "text-up" : "text-down"}`}
              >
                {formatPercent(market.priceChangePercent)}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-[10px] text-muted-foreground">
              <span>
                24h low{" "}
                <span className="ml-1 text-foreground/80">
                  {formatPrice(market.low)}
                </span>
              </span>
              <span>
                24h high{" "}
                <span className="ml-1 text-foreground/80">
                  {formatPrice(market.high)}
                </span>
              </span>
            </div>
            <div
              className="relative mt-2 h-1 rounded-full bg-foreground/10"
              role="img"
              aria-label={`Current price within 24 hour range: ${formatPrice(market.low)} to ${formatPrice(market.high)}`}
            >
              <span
                className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-card bg-foreground"
                style={{
                  left: `calc(${rangePosition(market.low, market.high, market.lastPrice) * 100}% - 5px)`,
                }}
              />
            </div>
          </Link>
        );
      })}
    </section>
  );
}

function MarketPulse({
  tickers,
  unavailable,
  favorites,
  onWatchlist,
}: {
  tickers?: Ticker[];
  unavailable: boolean;
  favorites: string[];
  onWatchlist: () => void;
}) {
  const [mode, setMode] = useState<"gainers" | "volume">("gainers");
  const movers = useMemo(
    () =>
      tickers
        ?.filter(
          (t) =>
            !isPerp(t.symbol) &&
            quoteAsset(t.symbol) === "USDC" &&
            (mode === "volume" || Number(t.priceChangePercent) > 0),
        )
        .sort((a, b) =>
          mode === "gainers"
            ? Number(b.priceChangePercent) - Number(a.priceChangePercent)
            : Number(b.quoteVolume) - Number(a.quoteVolume),
        )
        .slice(0, 5),
    [tickers, mode],
  );
  return (
    <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight">Market movers</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A closer look at USDC spot markets.
        </p>
        <div
          className="mb-2 mt-5 flex gap-5 border-b border-border"
          role="group"
          aria-label="Market movers ranking"
        >
          {(["gainers", "volume"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={`relative min-h-10 pb-3 text-xs font-medium transition-colors hover:text-foreground ${mode === value ? "text-foreground" : "text-muted-foreground"}`}
            >
              {value === "gainers" ? "Top gainers" : "Most traded"}
              {mode === value && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-foreground" />
              )}
            </button>
          ))}
        </div>
        {!movers &&
          !unavailable &&
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        {unavailable && (
          <p className="py-8 text-xs text-muted-foreground">
            Waiting for market data. Retry the connection to see movers.
          </p>
        )}
        {movers?.map((t, i) => (
          <Link
            key={t.symbol}
            href={`/trade/${t.symbol}`}
            className="group -mx-2 flex items-center gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-foreground/5"
          >
            <span className="w-3 text-[10px] text-muted-foreground">
              {i + 1}
            </span>
            <CoinLogo asset={baseAsset(t.symbol)} className="h-7 w-7" />
            <span className="min-w-0 flex-1 text-xs font-semibold">
              {baseAsset(t.symbol)}
              <span className="mt-1 block font-normal text-muted-foreground">
                {quoteAsset(t.symbol)}
              </span>
            </span>
            <span className="text-right">
              <span
                className={`block text-xs font-medium tabular-nums ${mode === "gainers" ? "text-up" : "text-foreground"}`}
              >
                {mode === "gainers"
                  ? formatPercent(t.priceChangePercent)
                  : `$${formatCompact(t.quoteVolume)}`}
              </span>
              <span className="mt-1 block text-[10px] tabular-nums text-muted-foreground">
                {formatPrice(t.lastPrice)}
              </span>
            </span>
          </Link>
        ))}
        {movers?.length === 0 && (
          <p className="py-8 text-xs text-muted-foreground">
            No matching spot markets right now.
          </p>
        )}
      </section>
      <section className="px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Your watchlist</h2>
          <span className="text-xs text-muted-foreground">
            {favorites.length} saved
          </span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {favorites.length
            ? "Your saved markets, ready when you are."
            : "Keep the markets you follow within reach. Select a star to save your first pair."}
        </p>
        <button
          type="button"
          onClick={onWatchlist}
          className="mt-4 inline-flex min-h-10 items-center gap-2 text-xs font-medium transition-colors hover:text-muted-foreground"
        >
          View watchlist <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </section>
    </aside>
  );
}

function MarketRow({
  market,
  starred,
  onStar,
}: {
  market: Ticker;
  starred: boolean;
  onStar: () => void;
}) {
  const base = baseAsset(market.symbol);
  const tone = Number(market.priceChangePercent) >= 0 ? "text-up" : "text-down";
  return (
    <tr className="group border-t border-border/70 transition-colors hover:bg-foreground/[0.025]">
      <td className="market-cell">
        <div className="flex items-center gap-1 sm:gap-2">
          <Star
            active={starred}
            onToggle={onStar}
            label={market.symbol}
            className="-ml-2 flex-none"
          />
          <Link
            href={`/trade/${market.symbol}`}
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <CoinLogo asset={base} className="h-8 w-8 flex-none" />
            <span className="flex min-w-0 flex-col">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold">
                {base}
                {isPerp(market.symbol) && <PerpBadge />}
              </span>
              <span className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
                {assetNames[base] ?? base}
                <span className="mx-1 text-foreground/25">/</span>
                {quoteAsset(market.symbol)}
              </span>
            </span>
          </Link>
        </div>
      </td>
      <td className="market-cell text-right">
        <Link href={`/trade/${market.symbol}`} className="block">
          <span className="whitespace-nowrap font-mono text-xs tabular-nums">
            {formatPrice(market.lastPrice)}
          </span>
          <span
            className={`mt-1 block text-[11px] tabular-nums sm:hidden ${tone}`}
          >
            {formatPercent(market.priceChangePercent)}
          </span>
        </Link>
      </td>
      <td className="market-cell hidden whitespace-nowrap text-right text-xs font-medium tabular-nums sm:table-cell">
        <span className={tone}>{formatPercent(market.priceChangePercent)}</span>
      </td>
      <td className="market-cell hidden whitespace-nowrap text-right font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
        {formatCompact(market.quoteVolume)}
        <span className="ml-1 font-sans text-[10px]">
          {quoteAsset(market.symbol)}
        </span>
      </td>
      <td className="market-cell hidden xl:table-cell">
        <RangeMeter
          low={market.low}
          high={market.high}
          last={market.lastPrice}
        />
      </td>
      <td className="hidden pr-4 xl:table-cell">
        <Link
          href={`/trade/${market.symbol}`}
          aria-label={`Trade ${market.symbol.replace(/_/g, "/")}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-border/70">
      <td className="market-cell">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </td>
      <td className="market-cell">
        <Skeleton className="ml-auto h-4 w-20" />
      </td>
      <td className="market-cell hidden sm:table-cell">
        <Skeleton className="ml-auto h-4 w-12" />
      </td>
      <td className="market-cell hidden md:table-cell">
        <Skeleton className="ml-auto h-4 w-16" />
      </td>
      <td className="market-cell hidden xl:table-cell">
        <Skeleton className="h-3 w-full" />
      </td>
      <td className="hidden xl:table-cell" />
    </tr>
  );
}
