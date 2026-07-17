"use client";

import { useEffect, useState } from "react";
import { Ticker } from "../utils/types";
import { getTickers } from "../utils/httpClient";
import { useRouter } from "next/navigation";
import { CoinLogo, baseAsset } from "./CoinLogo";

export const Markets = () => {
  const [tickers, setTickers] = useState<Ticker[]>();

  useEffect(() => {
    // The first proxied request after a cold server start can time out,
    // so keep polling: it retries failures and keeps prices fresh.
    const load = () => getTickers().then((m) => setTickers(m)).catch(() => {});
    load();
    const timer = setInterval(load, 10 * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full table-auto">
        <MarketHeader />
        <tbody>
          {tickers?.map((m) => <MarketRow key={m.symbol} market={m} />)}
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

function MarketHeader() {
  const thClass = "px-4 py-3 text-xs font-medium text-muted-foreground";
  return (
    <thead>
      <tr>
        <th className={`${thClass} text-left`}>Name</th>
        <th className={`${thClass} text-right`}>Price</th>
        <th className={`${thClass} text-right`}>24h High</th>
        <th className={`${thClass} text-right`}>24h Volume</th>
        <th className={`${thClass} text-right`}>24h Change</th>
      </tr>
    </thead>
  );
}
