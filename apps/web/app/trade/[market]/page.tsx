"use client";
import { BookTrades } from "@/app/components/BookTrades";
import { SwapUI } from "@/app/components/SwapUI";
import { Panel } from "@/app/components/core/Panel";
import { ChartPanel } from "@/app/components/trade/ChartPanel";
import { MarketBar } from "@/app/components/trade/MarketBar";
import { useParams } from "next/navigation";

/* Three fixed columns only fit from lg up. Below that the page becomes a
   normal scrolling stack — chart, book, order form — and the panels get
   explicit heights so each one is usable on its own. */
export default function Page() {
    const { market } = useParams();
    return <div className="flex flex-col gap-3 p-3 lg:h-[calc(100dvh-3.5rem)] lg:flex-row lg:overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
            <MarketBar market={market as string} />
            <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
                <ChartPanel market={market as string} />
                <Panel className="h-[420px] w-full flex-none md:w-[240px] lg:h-auto lg:w-[260px]">
                    <BookTrades market={market as string} />
                </Panel>
            </div>
        </div>
        <Panel className="flex-none sm:mx-auto sm:w-full sm:max-w-md lg:mx-0 lg:w-[300px] lg:max-w-none">
            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
                <SwapUI market={market as string} />
            </div>
        </Panel>
    </div>
}
