"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ticker } from "../utils/types";
import { getTickers } from "../utils/httpClient";
import { formatCompact, formatPercent, formatPrice } from "../utils/format";
import { useFavorites } from "../utils/useFavorites";
import { CoinLogo, baseAsset, isPerp, quoteAsset } from "./CoinLogo";
import { PerpBadge } from "./core/Badge";
import { Skeleton } from "./core/Skeleton";
import { Star } from "./core/Star";
import { Tabs } from "./core/Tabs";
import { RangeMeter } from "./market/RangeMeter";

type SortKey = "symbol" | "lastPrice" | "high" | "quoteVolume" | "priceChangePercent";
type Sort = { key: SortKey; dir: "asc" | "desc" };
type Filter = "all" | "gainers" | "losers" | "favorites";

/* Market and price are the columns a phone has room for; the rest appear as
   the viewport widens. `visibility` is shared by header and row so the two
   can never drift apart. */
const columns: { label: string; key: SortKey; align: "left" | "right"; visibility: string }[] = [
  { label: "Market", key: "symbol", align: "left", visibility: "" },
  { label: "Price", key: "lastPrice", align: "right", visibility: "" },
  { label: "24h Change", key: "priceChangePercent", align: "right", visibility: "hidden sm:table-cell" },
  { label: "24h Volume", key: "quoteVolume", align: "right", visibility: "hidden md:table-cell" },
  { label: "24h Range", key: "high", align: "right", visibility: "hidden lg:table-cell" },
];

const cellClass = "px-3 py-3 sm:px-4";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "gainers", label: "Gainers" },
  { value: "losers", label: "Losers" },
  { value: "favorites", label: "Starred" },
];

export const Markets = () => {
  const [tickers, setTickers] = useState<Ticker[]>();
  const [sort, setSort] = useState<Sort>({ key: "quoteVolume", dir: "desc" });
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const { favorites, toggle, isFavorite } = useFavorites();

  useEffect(() => {
    // The first proxied request after a cold server start can time out,
    // so keep polling: it retries failures and keeps prices fresh.
    const load = () => getTickers().then((m) => setTickers(m)).catch(() => { });
    load();
    const timer = setInterval(load, 10 * 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "symbol" ? "asc" : "desc" });

  const rows = useMemo(() => {
    if (!tickers) return undefined;
    const needle = query.trim().toLowerCase().replace(/[/_\s]/g, "");
    const matches = tickers.filter((t) => {
      if (needle && !t.symbol.toLowerCase().replace("_", "").includes(needle)) return false;
      if (filter === "gainers") return Number(t.priceChangePercent) > 0;
      if (filter === "losers") return Number(t.priceChangePercent) < 0;
      if (filter === "favorites") return favorites.includes(t.symbol);
      return true;
    });
    return matches.sort((a, b) => {
      const flip = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "symbol") return flip * a.symbol.localeCompare(b.symbol);
      return flip * (Number(a[sort.key]) - Number(b[sort.key]));
    });
  }, [tickers, query, filter, favorites, sort]);

  return (
    <div className="flex flex-col gap-4">
      <Summary tickers={tickers} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          className="w-full sm:w-auto sm:min-w-[20rem]"
          size="md"
          options={filters}
          value={filter}
          onChange={setFilter}
        />
        <SearchField value={query} onChange={setQuery} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full table-auto">
            <MarketHeader sort={sort} onSort={toggleSort} />
            <tbody>
              {!rows && Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}
              {rows?.map((m) => (
                <MarketRow key={m.symbol} market={m} starred={isFavorite(m.symbol)} onStar={() => toggle(m.symbol)} />
              ))}
            </tbody>
          </table>
        </div>
        {rows?.length === 0 && (
          <p className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {filter === "favorites" && !query
              ? "No starred markets yet. Tap a star to pin one here."
              : "No market matches that search."}
          </p>
        )}
      </div>
    </div>
  );
};

function Summary({ tickers }: { tickers?: Ticker[] }) {
  const stats = useMemo(() => {
    if (!tickers?.length) return undefined;
    const volume = tickers.reduce((sum, t) => sum + Number(t.quoteVolume || 0), 0);
    const best = [...tickers].sort((a, b) => Number(b.priceChangePercent) - Number(a.priceChangePercent))[0];
    return { count: tickers.length, volume, best };
  }, [tickers]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard label="Markets" value={stats ? String(stats.count) : undefined} />
      <StatCard label="24h volume" value={stats ? `$${formatCompact(stats.volume)}` : undefined} />
      <StatCard
        label="Top gainer"
        value={stats ? baseAsset(stats.best.symbol) : undefined}
        detail={stats ? formatPercent(stats.best.priceChangePercent) : undefined}
        tone={stats && Number(stats.best.priceChangePercent) >= 0 ? "text-up" : "text-down"}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
}

function StatCard({ label, value, detail, tone, className = "" }: {
  label: string; value?: string; detail?: string; tone?: string; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      {value === undefined
        ? <Skeleton className="h-6 w-24" />
        : <p className="flex items-baseline gap-2 font-mono text-lg tabular-nums">
          {value}
          {detail && <span className={`text-sm ${tone ?? ""}`}>{detail}</span>}
        </p>}
    </div>
  );
}

function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative w-full sm:w-64">
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search markets"
        aria-label="Search markets"
        className="h-11 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:border-foreground/30"
      />
    </div>
  );
}

function MarketRow({ market, starred, onStar }: { market: Ticker; starred: boolean; onStar: () => void }) {
  const up = Number(market.priceChangePercent) >= 0;
  const [, , change, volume, range] = columns;
  const tone = up ? "text-up" : "text-down";

  return (
    <tr className="group border-t border-border transition-colors duration-200 hover:bg-foreground/5">
      <td className={cellClass}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Star active={starred} onToggle={onStar} label={market.symbol} className="-ml-1" />
          <Link href={`/trade/${market.symbol}`} className="flex min-w-0 items-center gap-3">
            <CoinLogo asset={baseAsset(market.symbol)} className="h-8 w-8 flex-none sm:h-9 sm:w-9" />
            <div className="flex min-w-0 flex-col">
              <p className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                {baseAsset(market.symbol)}
                {isPerp(market.symbol) && <PerpBadge />}
              </p>
              <p className="whitespace-nowrap text-xs text-muted-foreground">{quoteAsset(market.symbol)}</p>
            </div>
          </Link>
        </div>
      </td>
      <td className={`${cellClass} text-right`}>
        <Link href={`/trade/${market.symbol}`} className="block">
          <p className="whitespace-nowrap font-mono text-sm tabular-nums">{formatPrice(market.lastPrice)}</p>
          {/* On phones the change rides under the price instead of taking a column. */}
          <p className={`font-mono text-xs tabular-nums sm:hidden ${tone}`}>{formatPercent(market.priceChangePercent)}</p>
        </Link>
      </td>
      <td className={`${cellClass} ${change.visibility} text-right`}>
        <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-xs tabular-nums ${up ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
          {formatPercent(market.priceChangePercent)}
        </span>
      </td>
      <td className={`${cellClass} ${volume.visibility} whitespace-nowrap text-right font-mono text-sm tabular-nums text-muted-foreground`}>
        ${formatCompact(market.quoteVolume)}
      </td>
      <td className={`${cellClass} ${range.visibility}`}>
        <RangeMeter low={market.low} high={market.high} last={market.lastPrice} />
      </td>
    </tr>
  );
}

function SkeletonRow() {
  const [, , change, volume, range] = columns;
  return (
    <tr className="border-t border-border">
      <td className={cellClass}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 flex-none rounded-full sm:h-9 sm:w-9" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </td>
      <td className={cellClass}><Skeleton className="ml-auto h-3.5 w-20" /></td>
      <td className={`${cellClass} ${change.visibility}`}><Skeleton className="ml-auto h-5 w-16 rounded-full" /></td>
      <td className={`${cellClass} ${volume.visibility}`}><Skeleton className="ml-auto h-3.5 w-16" /></td>
      <td className={`${cellClass} ${range.visibility}`}><Skeleton className="h-3.5 w-28" /></td>
    </tr>
  );
}

function MarketHeader({ sort, onSort }: { sort: Sort; onSort: (key: SortKey) => void }) {
  return (
    <thead className="bg-foreground/[0.02]">
      <tr>
        {columns.map(({ label, key, align, visibility }) => {
          const active = sort.key === key;
          return (
            <th key={key} className={`${cellClass} ${visibility} text-[11px] font-medium ${align === "left" ? "text-left" : "text-right"}`}>
              <button
                type="button"
                onClick={() => onSort(key)}
                className={`inline-flex items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em] transition-colors duration-200 ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
                <span className={`font-mono text-[10px] ${active ? "" : "invisible"}`}>
                  {active && sort.dir === "asc" ? "↑" : "↓"}
                </span>
              </button>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
