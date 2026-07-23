"use client";

import { useEffect, useState } from "react";
import { Trade } from "../utils/types";
import { getTrades } from "../utils/httpClient";
import { SignalingManager } from "../utils/SignalingManager";

const MAX_TRADES = 40;

export function Trades({ market }: { market: string }) {
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        getTrades(market)
            .then((t) => setTrades(t.slice(0, MAX_TRADES)))
            .catch(() => {});

        SignalingManager.getInstance().registerCallback("trade", (trade: Trade) => {
            setTrades((prev) => [trade, ...prev].slice(0, MAX_TRADES));
        }, `TRADE-${market}`);
        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`trade.${market}`] });

        return () => {
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`trade.${market}`] });
            SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-${market}`);
        };
    }, [market]);

    return <div className="flex flex-col grow overflow-y-hidden">
        <div className="grid flex-none grid-cols-3 px-3 py-1 text-xs text-muted-foreground">
            <div>Price</div>
            <div className="text-right">Qty</div>
            <div className="text-right">Time</div>
        </div>
        <div className="flex flex-col overflow-y-auto no-scrollbar">
            {trades.map((t) => <TradeRow key={t.id} trade={t} />)}
        </div>
    </div>;
}

function TradeRow({ trade }: { trade: Trade }) {
    // isBuyerMaker means the aggressor sold into a resting bid, so paint it red.
    const color = trade.isBuyerMaker ? "text-down" : "text-up";
    return <div className="grid grid-cols-3 px-3 py-[2px] font-mono text-xs">
        <div className={`truncate ${color}`}>{trade.price}</div>
        <div className="truncate text-right text-foreground/80">{trade.quantity}</div>
        <div className="truncate text-right text-muted-foreground">{new Date(trade.timestamp).toLocaleTimeString()}</div>
    </div>;
}
