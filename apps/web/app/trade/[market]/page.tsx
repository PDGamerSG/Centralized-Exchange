"use client";
import { BookTrades } from "@/app/components/BookTrades";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUI";
import { TradeView } from "@/app/components/TradeView";
import { useParams } from "next/navigation";

export default function Page() {
    const { market } = useParams();
    return <div className="flex h-[calc(100dvh-3.5rem)] flex-row overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
            <MarketBar market={market as string} />
            <div className="flex min-h-0 flex-1 flex-row">
                <div className="flex min-w-0 flex-1 flex-col">
                    <TradeView market={market as string} />
                </div>
                <div className="flex w-[250px] flex-col overflow-hidden border-l border-border">
                    <BookTrades market={market as string} />
                </div>
            </div>
        </div>
        <div className="w-[280px] flex-none overflow-y-auto border-l border-border no-scrollbar">
            <SwapUI market={market as string} />
        </div>
    </div>
}
