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
        <div className="flex justify-between text-xs px-1 py-1">
            <div className="text-slate-500">Price</div>
            <div className="text-slate-500">Qty</div>
            <div className="text-slate-500">Time</div>
        </div>
        <div className="flex flex-col overflow-y-auto no-scrollbar">
            {trades.map((t) => <TradeRow key={t.id} trade={t} />)}
        </div>
    </div>;
}

function TradeRow({ trade }: { trade: Trade }) {
    // isBuyerMaker means the aggressor sold into a resting bid, so paint it red.
    const color = trade.isBuyerMaker ? "text-red-500" : "text-green-500";
    return <div className="flex justify-between text-xs px-1 py-[2px]">
        <div className={color}>{trade.price}</div>
        <div className="text-slate-300">{trade.quantity}</div>
        <div className="text-slate-500">{new Date(trade.timestamp).toLocaleTimeString()}</div>
    </div>;
}
