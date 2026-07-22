"use client";

import { useEffect, useState } from "react";
import { Ticker } from "../utils/types";
import { getTickers } from "../utils/httpClient";
import { useRouter } from "next/navigation";
import { CoinLogo, baseAsset } from "./CoinLogo";

type SortKey = "symbol" | "lastPrice" | "high" | "volume" | "priceChangePercent";
type Sort = { key: SortKey; dir: "asc" | "desc" };

export const Markets = () => {
  const [tickers, setTickers] = useState<Ticker[]>();
  const [sort, setSort] = useState<Sort>({ key: "volume", dir: "desc" });

  useEffect(() => {
    // The first proxied request after a cold server start can time out,
    // so keep polling: it retries failures and keeps prices fresh.
    const load = () => getTickers().then((m) => setTickers(m)).catch(() => {});
    load();
    const timer = setInterval(load, 10 * 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => prev.key === key
      ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { key, dir: key === "symbol" ? "asc" : "desc" });

  const sorted = tickers && [...tickers].sort((a, b) => {
    const flip = sort.dir === "asc" ? 1 : -1;
    if (sort.key === "symbol") return flip * a.symbol.localeCompare(b.symbol);
    return flip * (Number(a[sort.key]) - Number(b[sort.key]));
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full table-auto">
        <MarketHeader sort={sort} onSort={toggleSort} />
        <tbody>
          {sorted?.map((m) => <MarketRow key={m.symbol} market={m} />)}
        </tbody>
      </table>
    </div>
  );
};

function MarketRow({ market }: { market: Ticker }) {
  const router = useRouter();
  const up = Number(market.priceChangePercent) >= 0;
  return (
    <tr className="cursor-pointer border-t border-border transition-colors duration-300 hover:bg-foreground/5" onClick={() => router.push(`/trade/${market.symbol}`)}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <CoinLogo asset={baseAsset(market.symbol)} className="h-9 w-9 flex-none" />
          <div className="flex flex-col">
            <p className="whitespace-nowrap font-semibold">{baseAsset(market.symbol)}</p>
            <p className="whitespace-nowrap text-xs text-muted-foreground">{market.symbol.replace("_", " / ")}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-sm">{market.lastPrice}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{market.high}</td>
      <td className="px-4 py-3 text-right font-mono text-sm">{market.volume}</td>
      <td className="px-4 py-3 text-right">
        <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-xs ${up ? "bg-up/10 text-up" : "bg-down/10 text-down"}`}>
          {up ? "+" : ""}{(Number(market.priceChangePercent) * 100).toFixed(2)}%
        </span>
      </td>
    </tr>
  );
}

function MarketHeader({ sort, onSort }: { sort: Sort; onSort: (key: SortKey) => void }) {
  const columns: { label: string; key: SortKey; align: "left" | "right" }[] = [
    { label: "Name", key: "symbol", align: "left" },
    { label: "Price", key: "lastPrice", align: "right" },
    { label: "24h High", key: "high", align: "right" },
    { label: "24h Volume", key: "volume", align: "right" },
    { label: "24h Change", key: "priceChangePercent", align: "right" },
  ];
  return (
    <thead>
      <tr>
        {columns.map(({ label, key, align }) => {
          const active = sort.key === key;
          return (
            <th key={key} className={`px-4 py-3 text-xs font-medium ${align === "left" ? "text-left" : "text-right"}`}>
              <button
                type="button"
                onClick={() => onSort(key)}
                className={`inline-flex items-center gap-1 transition-colors duration-300 ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
