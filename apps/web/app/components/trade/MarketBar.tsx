"use client";

import { useEffect } from "react";
import { decimalsOf, formatCompact, formatPercent, formatPrice, formatSigned } from "../../utils/format";
import { usePriceDirection, useTicker } from "../../utils/useTicker";
import { quoteAsset } from "../CoinLogo";
import { Skeleton } from "../core/Skeleton";
import { MarketSelector } from "../market/MarketSelector";

export const MarketBar = ({ market }: { market: string }) => {
    const ticker = useTicker(market);
    const direction = usePriceDirection(ticker?.lastPrice);
    const up = Number(ticker?.priceChange) >= 0;
    // The change is recomputed from the stream, so it needs the price's own
    // precision rather than the float noise it arrives with.
    const priceDecimals = decimalsOf(ticker?.lastPrice);
    const quote = quoteAsset(market);

    // Exchanges put the live price in the tab title so a background tab still
    // shows where the market is.
    useEffect(() => {
        document.title = ticker?.lastPrice
            ? `${formatPrice(ticker.lastPrice)} ${market.replace(/_/g, "/")} · OpenExchange`
            : `${market.replace(/_/g, "/")} · OpenExchange`;
    }, [market, ticker?.lastPrice]);

    /* One scrolling row from lg up. Below that the wrappers lay the same
       content out as a header row plus a stat grid; `lg:contents` dissolves
       them again so the desktop row keeps its single flex context. */
    return <div className="flex flex-none flex-col gap-3 rounded-xl border border-border bg-card p-3 no-scrollbar lg:h-14 lg:flex-row lg:items-center lg:gap-7 lg:overflow-x-auto lg:p-0 lg:pl-2 lg:pr-4">
        <div className="flex items-center justify-between gap-3 lg:contents">
            <MarketSelector market={market} />
            <div className="flex flex-none flex-col items-end lg:items-start">
                <p className={`rounded px-1 font-mono text-lg font-medium leading-tight tabular-nums ${up ? "text-up" : "text-down"} ${direction === "up" ? "flash-up" : direction === "down" ? "flash-down" : ""}`}>
                    {ticker ? formatPrice(ticker.lastPrice) : "—"}
                </p>
                {/* The phone header carries the change inline; wider screens
                    get it as its own labelled stat instead. */}
                <p className={`px-1 font-mono text-xs tabular-nums lg:hidden ${up ? "text-up" : "text-down"}`}>
                    {ticker ? formatPercent(ticker.priceChangePercent) : ""}
                </p>
            </div>
        </div>
        <div className="grid grid-cols-3 gap-x-5 gap-y-2 lg:contents">
            {/* The phone header already carries the change beside the price. */}
            <Stat
                className="hidden lg:flex"
                label="24h Change"
                value={ticker ? `${formatSigned(ticker.priceChange, priceDecimals)} ${formatPercent(ticker.priceChangePercent)}` : undefined}
                tone={up ? "text-up" : "text-down"}
            />
            <Stat label="24h High" value={ticker ? formatPrice(ticker.high) : undefined} />
            <Stat label="24h Low" value={ticker ? formatPrice(ticker.low) : undefined} />
            <Stat label="24h Volume" value={ticker ? `${formatCompact(ticker.quoteVolume)} ${quote}` : undefined} />
        </div>
    </div>
}

function Stat({ label, value, tone, className = "" }: { label: string, value?: string, tone?: string, className?: string }) {
    return <div className={`flex min-w-0 flex-none flex-col justify-center gap-0.5 ${className}`}>
        <p className="truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {value === undefined
            ? <Skeleton className="h-4 w-20" />
            : <p className={`truncate font-mono text-sm tabular-nums ${tone ?? ""}`}>{value}</p>}
    </div>
}
