"use client";

import { useEffect, useMemo, useState } from "react";
import { Trade } from "../utils/types";
import { getTrades } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";
import { decimalsOf, formatPrice, formatQty, formatTime } from "../utils/format";
import { baseAsset } from "./CoinLogo";
import { Skeleton } from "./core/Skeleton";
import { useOrderForm } from "./trade/orderForm";

const MAX_TRADES = 60;

export function Trades({ market }: { market: string }) {
    const [trades, setTrades] = useState<Trade[]>();
    const { fillFromBook } = useOrderForm();

    useEffect(() => {
        setTrades(undefined);
        getTrades(market)
            .then((t) => setTrades(t.slice(0, MAX_TRADES)))
            .catch(() => setTrades([]));

        const id = `TRADE-${market}`;
        SignalingManager.getInstance().registerCallback("trade", (trade: Trade) => {
            setTrades((prev) => [trade, ...(prev ?? [])].slice(0, MAX_TRADES));
        }, id);
        SignalingManager.getInstance().subscribe(`trade.${market}`);

        return () => {
            SignalingManager.getInstance().unsubscribe(`trade.${market}`);
            SignalingManager.getInstance().deRegisterCallback("trade", id);
        };
    }, [market]);

    // One decimal count for the whole column, so sizes line up on the point.
    const sizeScale = useMemo(() => {
        let decimals = 0;
        for (const t of trades?.slice(0, 20) ?? []) decimals = Math.max(decimals, decimalsOf(t.quantity));
        return Math.min(decimals, 4);
    }, [trades]);

    return <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-none items-center px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <span className="flex-1 text-left">Price</span>
            <span className="flex-1 text-right">Size ({baseAsset(market)})</span>
            <span className="flex-1 text-right">Time</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
            {!trades && Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1">
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 flex-1" />
                </div>
            ))}
            {trades?.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">No trades yet.</p>
            )}
            {trades?.map((t, index) => (
                <TradeRow key={`${t.id}-${t.timestamp}`} trade={t} fresh={index === 0} sizeDecimals={sizeScale} onSelect={fillFromBook} />
            ))}
        </div>
    </div>;
}

function TradeRow({ trade, fresh, sizeDecimals, onSelect }: { trade: Trade; fresh: boolean; sizeDecimals: number; onSelect: (price: string) => void }) {
    // isBuyerMaker means the aggressor sold into a resting bid, so paint it red.
    const sold = trade.isBuyerMaker;
    return (
        <button
            type="button"
            onClick={() => onSelect(trade.price)}
            title="Fill this price into the order form"
            className={`flex w-full items-center px-3 py-[3px] transition-colors duration-150 hover:bg-foreground/[0.06] ${fresh ? (sold ? "flash-down" : "flash-up") : ""}`}
        >
            <span className={`flex-1 text-left font-mono text-xs tabular-nums ${sold ? "text-down" : "text-up"}`}>
                {formatPrice(trade.price)}
            </span>
            <span className="flex-1 text-right font-mono text-xs tabular-nums text-foreground/80">
                {formatQty(trade.quantity, sizeDecimals)}
            </span>
            <span className="flex-1 text-right font-mono text-xs tabular-nums text-muted-foreground">
                {formatTime(trade.timestamp)}
            </span>
        </button>
    );
}
