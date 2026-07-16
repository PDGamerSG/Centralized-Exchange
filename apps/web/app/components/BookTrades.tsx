"use client";

import { useState } from "react";
import { Depth } from "./depth/Depth";
import { Trades } from "./Trades";

export function BookTrades({ market }: { market: string }) {
    const [tab, setTab] = useState<"book" | "trades">("book");

    const tabClass = (active: boolean) =>
        `text-sm font-medium py-1 cursor-pointer border-b-2 ${active
            ? "border-accentBlue text-baseTextHighEmphasis"
            : "border-transparent text-baseTextMedEmphasis hover:text-baseTextHighEmphasis"}`;

    return <div className="flex flex-col h-full overflow-y-hidden">
        <div className="flex flex-row gap-4 px-2 py-2">
            <div className={tabClass(tab === "book")} onClick={() => setTab("book")}>Book</div>
            <div className={tabClass(tab === "trades")} onClick={() => setTab("trades")}>Trades</div>
        </div>
        <div className="flex flex-col grow overflow-y-auto no-scrollbar">
            {tab === "book" ? <Depth market={market} /> : <Trades market={market} />}
        </div>
    </div>;
}
