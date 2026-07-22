"use client";

import { useState } from "react";
import { Tabs } from "./core/Tabs";
import { Depth } from "./depth/Depth";
import { Trades } from "./Trades";

export function BookTrades({ market }: { market: string }) {
    const [tab, setTab] = useState<"book" | "trades">("book");

    return <div className="flex flex-col h-full overflow-y-hidden">
        <Tabs
            className="m-2 flex-none"
            options={[
                { value: "book", label: "Book" },
                { value: "trades", label: "Trades" },
            ]}
            value={tab}
            onChange={setTab}
        />
        <div className="flex flex-col grow overflow-y-auto no-scrollbar">
            {tab === "book" ? <Depth market={market} /> : <Trades market={market} />}
        </div>
    </div>;
}
