"use client";

import { useState } from "react";
import { Tabs } from "./core/Tabs";
import { Depth } from "./depth/Depth";
import { Trades } from "./Trades";

export function BookTrades({ market }: { market: string }) {
    const [tab, setTab] = useState<"book" | "trades">("book");

    return <div className="flex h-full min-h-0 flex-col">
        <Tabs
            className="m-2 flex-none"
            options={[
                { value: "book", label: "Order book" },
                { value: "trades", label: "Trades" },
            ]}
            value={tab}
            onChange={setTab}
        />
        {tab === "book" ? <Depth market={market} /> : <Trades market={market} />}
    </div>;
}
