"use client";
import { BookTrades } from "@/app/components/BookTrades";
import { SwapUI } from "@/app/components/SwapUI";
import { Panel } from "@/app/components/core/Panel";
import { ChartPanel } from "@/app/components/trade/ChartPanel";
import { MarketBar } from "@/app/components/trade/MarketBar";
import { useParams } from "next/navigation";

export default function Page() {
    const { market } = useParams();
    return <div className="flex h-[calc(100dvh-3.5rem)] flex-row gap-3 overflow-hidden p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
            <MarketBar market={market as string} />
            <div className="flex min-h-0 flex-1 flex-row gap-3">
                <ChartPanel market={market as string} />
                <Panel className="w-[260px] flex-none">
                    <BookTrades market={market as string} />
                </Panel>
            </div>
        </div>
        <Panel className="w-[300px] flex-none">
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
                <SwapUI market={market as string} />
            </div>
        </Panel>
    </div>
}
