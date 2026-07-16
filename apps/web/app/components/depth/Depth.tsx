"use client";

import { useEffect, useState } from "react";
import { getDepth, getKlines, getTicker, getTrades } from "../../utils/httpClient";
import { BidTable } from "./BidTable";
import { AskTable } from "./AskTable";
import { SignalingManager } from "../../utils/SignalingManager";

export function Depth({ market }: {market: string}) {
    const [bids, setBids] = useState<[string, string][]>();
    const [asks, setAsks] = useState<[string, string][]>();
    const [price, setPrice] = useState<string>();

    useEffect(() => {
        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            // Merge the incremental update into the book: replace touched levels,
            // drop zero-quantity ones, then re-sort.
            const applyUpdate = (
                original: [string, string][] | undefined,
                updates: [string, string][],
                sort: (x: [string, string], y: [string, string]) => number,
            ) => {
                const book = new Map((original || []).map(([p, q]) => [p, q]));
                for (const [p, q] of updates || []) {
                    if (Number(q) === 0) {
                        book.delete(p);
                    } else {
                        book.set(p, q);
                    }
                }
                return Array.from(book.entries()).sort(sort) as [string, string][];
            };

            setBids((originalBids) => applyUpdate(originalBids, data.bids, (x, y) => Number(y[0]) - Number(x[0])));
            setAsks((originalAsks) => applyUpdate(originalAsks, data.asks, (x, y) => Number(x[0]) - Number(y[0])));
        }, `DEPTH-${market}`);

        SignalingManager.getInstance().sendMessage({"method":"SUBSCRIBE","params":[`depth.${market}`]});

        getDepth(market).then(d => {
            // The REST snapshot lists bids ascending; the UI wants the best bid first.
            setBids([...d.bids].sort((x, y) => Number(y[0]) - Number(x[0])));
            setAsks([...d.asks].sort((x, y) => Number(x[0]) - Number(y[0])));
        });

        getTicker(market).then(t => setPrice(t.lastPrice));
        getTrades(market).then(t => {
            if (t.length > 0) {
                setPrice(t[0].price);
            }
        });

        return () => {
            SignalingManager.getInstance().sendMessage({"method":"UNSUBSCRIBE","params":[`depth.${market}`]});
            SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${market}`);
        }
    }, [market])
    
    return <div>
        <TableHeader />
        {asks && <AskTable asks={asks} />}
        {price && <div>{price}</div>}
        {bids && <BidTable bids={bids} />}
    </div>
}

function TableHeader() {
    return <div className="flex justify-between text-xs">
    <div className="text-white">Price</div>
    <div className="text-slate-500">Size</div>
    <div className="text-slate-500">Total</div>
</div>
}