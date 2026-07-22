"use client";
import { useEffect, useState } from "react";
import { Ticker } from "../../utils/types";
import { getTicker } from "../../utils/httpClient";
import { SignalingManager } from "../../utils/SignalingManager";
import { CoinLogo, baseAsset, quoteAsset } from "../CoinLogo";

export const MarketBar = ({ market }: { market: string }) => {
    const [ticker, setTicker] = useState<Ticker | null>(null);

    useEffect(() => {
        getTicker(market).then(setTicker);
        SignalingManager.getInstance().registerCallback("ticker", (data: Partial<Ticker>) => setTicker(prevTicker => ({
            firstPrice: data?.firstPrice ?? prevTicker?.firstPrice ?? '',
            high: data?.high ?? prevTicker?.high ?? '',
            lastPrice: data?.lastPrice ?? prevTicker?.lastPrice ?? '',
            low: data?.low ?? prevTicker?.low ?? '',
            priceChange: data?.priceChange ?? prevTicker?.priceChange ?? '',
            priceChangePercent: data?.priceChangePercent ?? prevTicker?.priceChangePercent ?? '',
            quoteVolume: data?.quoteVolume ?? prevTicker?.quoteVolume ?? '',
            symbol: data?.symbol ?? prevTicker?.symbol ?? '',
            trades: data?.trades ?? prevTicker?.trades ?? '',
            volume: data?.volume ?? prevTicker?.volume ?? '',
        })), `TICKER-${market}`);
        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`ticker.${market}`] });

        return () => {
            SignalingManager.getInstance().deRegisterCallback("ticker", `TICKER-${market}`);
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`ticker.${market}`] });
        }
    }, [market])

    const up = Number(ticker?.priceChange) >= 0;

    return <div className="flex h-14 flex-none flex-row items-center gap-8 overflow-x-auto rounded-xl border border-border bg-card px-4 no-scrollbar">
        <div className="flex flex-none items-center gap-3">
            <div className="flex flex-row">
                <CoinLogo asset={baseAsset(market)} className="z-10 h-6 w-6" />
                <CoinLogo asset={quoteAsset(market)} className="-ml-2 h-6 w-6" />
            </div>
            <p className="text-sm font-semibold tracking-tight">{market.replace("_", " / ")}</p>
        </div>
        <p className={`flex-none font-mono text-lg font-medium tabular-nums ${up ? "text-up" : "text-down"}`}>
            {ticker ? `$${ticker.lastPrice}` : "—"}
        </p>
        <Stat
            label="24h Change"
            value={ticker ? `${up ? "+" : ""}${ticker.priceChange} (${(Number(ticker.priceChangePercent) * 100).toFixed(2)}%)` : "—"}
            tone={up ? "text-up" : "text-down"}
        />
        <Stat label="24h High" value={ticker?.high ?? "—"} />
        <Stat label="24h Low" value={ticker?.low ?? "—"} />
        <Stat label="24h Volume" value={ticker?.volume ?? "—"} />
    </div>
}

function Stat({ label, value, tone }: { label: string, value: string, tone?: string }) {
    return <div className="flex flex-none flex-col justify-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-mono text-sm tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
}
