"use client";
import { BookTrades } from "@/app/components/BookTrades";
import { MarketBar } from "@/app/components/MarketBar";
import { SwapUI } from "@/app/components/SwapUI";
import { TradeView } from "@/app/components/TradeView";
import { useParams } from "next/navigation";

export default function Page() {
    const { market } = useParams();
    return <div className="flex flex-row flex-1">
        <div className="flex flex-col flex-1">
            <MarketBar market={market as string} />
            <div className="flex h-[720px] flex-row border-b border-border">
                <div className="flex flex-col flex-1">
                    <TradeView market={market as string} />
                </div>
                <div className="flex w-[250px] flex-col overflow-hidden border-l border-border">
                    <BookTrades market={market as string} />
                </div>
            </div>
        </div>
        <div className="w-[280px] flex-none border-l border-border">
            <SwapUI market={market as string} />
        </div>
    </div>
}
