"use client";

import { useState } from "react";
import { Depth } from "./depth/Depth";
import { Trades } from "./Trades";

export function BookTrades({ market }: { market: string }) {
    const [tab, setTab] = useState<"book" | "trades">("book");

    const tabClass = (active: boolean) =>
        `cursor-pointer rounded-full py-1 text-center text-xs font-medium transition-colors duration-300 ${active
            ? "bg-foreground/10 text-foreground"
            : "text-muted-foreground hover:text-foreground"}`;

    return <div className="flex flex-col h-full overflow-y-hidden">
        <div className="m-2 grid flex-none grid-cols-2 gap-1 rounded-full bg-foreground/5 p-1">
            <div className={tabClass(tab === "book")} onClick={() => setTab("book")}>Book</div>
            <div className={tabClass(tab === "trades")} onClick={() => setTab("trades")}>Trades</div>
        </div>
        <div className="flex flex-col grow overflow-y-auto no-scrollbar">
            {tab === "book" ? <Depth market={market} /> : <Trades market={market} />}
        </div>
    </div>;
}
