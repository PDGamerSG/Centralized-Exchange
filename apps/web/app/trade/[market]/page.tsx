"use client";
import { BookTrades } from "@/app/components/BookTrades";
import { SwapUI } from "@/app/components/SwapUI";
import { Panel } from "@/app/components/core/Panel";
import { Sheet } from "@/app/components/core/Sheet";
import { Tabs } from "@/app/components/core/Tabs";
import { Depth } from "@/app/components/depth/Depth";
import { Trades } from "@/app/components/Trades";
import { ChartPanel } from "@/app/components/trade/ChartPanel";
import { MarketBar } from "@/app/components/trade/MarketBar";
import { OrderFormProvider, Side, useOrderForm } from "@/app/components/trade/orderForm";
import { baseAsset } from "@/app/components/CoinLogo";
import { useMediaQuery } from "@/app/utils/useMediaQuery";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
    const { market } = useParams();
    return (
        <OrderFormProvider>
            <TradeScreen market={market as string} />
        </OrderFormProvider>
    );
}

const panels = [
    { value: "chart", label: "Chart" },
    { value: "book", label: "Book" },
    { value: "trades", label: "Trades" },
] as const;

type PanelTab = (typeof panels)[number]["value"];

/* The screen is one viewport tall at every size: nothing about a trading
   view survives the page scrolling away under a thumb. Which panels share
   that height is what changes — three columns on a desktop, chart beside
   book on a tablet, one tabbed panel plus a buy/sell bar on a phone. */
function TradeScreen({ market }: { market: string }) {
    const wide = useMediaQuery("(min-width: 768px)");
    const desktop = useMediaQuery("(min-width: 1024px)");
    const [tab, setTab] = useState<PanelTab>("chart");

    return (
        <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-3 overflow-hidden p-3 lg:flex-row">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
                <MarketBar market={market} />

                {wide ? (
                    <div className="flex min-h-0 flex-1 gap-3">
                        <ChartPanel market={market} className="min-w-0 flex-1" />
                        <Panel className="w-[260px] flex-none lg:w-[290px]">
                            <BookTrades market={market} />
                        </Panel>
                    </div>
                ) : (
                    <>
                        <Tabs className="flex-none" size="md" options={panels} value={tab} onChange={setTab} />
                        {tab === "chart" && <ChartPanel market={market} className="min-h-0 flex-1" />}
                        {tab === "book" && <Panel className="min-h-0 flex-1"><Depth market={market} /></Panel>}
                        {tab === "trades" && <Panel className="min-h-0 flex-1"><Trades market={market} /></Panel>}
                    </>
                )}
            </div>

            {desktop ? (
                <Panel className="w-[320px] flex-none">
                    <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar">
                        <SwapUI market={market} />
                    </div>
                </Panel>
            ) : (
                <TradeActionBar market={market} />
            )}
        </div>
    );
}

/* Below the three-column layout the order form lives in a sheet, so the
   two things a trader taps most stay pinned to the bottom of the screen. */
function TradeActionBar({ market }: { market: string }) {
    const { side, setSide } = useOrderForm();
    const [open, setOpen] = useState(false);

    const start = (next: Side) => {
        setSide(next);
        setOpen(true);
    };

    return (
        <>
            <div className="grid flex-none grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)]">
                <button
                    type="button"
                    onClick={() => start("buy")}
                    className="h-12 rounded-xl bg-up text-base font-semibold text-background transition-opacity duration-200 hover:opacity-90"
                >
                    Buy {baseAsset(market)}
                </button>
                <button
                    type="button"
                    onClick={() => start("sell")}
                    className="h-12 rounded-xl bg-down text-base font-semibold text-background transition-opacity duration-200 hover:opacity-90"
                >
                    Sell {baseAsset(market)}
                </button>
            </div>

            <Sheet open={open} onClose={() => setOpen(false)} title={`${side === "buy" ? "Buy" : "Sell"} ${baseAsset(market)}`}>
                <SwapUI market={market} />
            </Sheet>
        </>
    );
}
