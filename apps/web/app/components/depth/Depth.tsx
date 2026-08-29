"use client";

import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { getDepth } from "../../utils/httpClient";
import { SignalingManager } from "../../utils/SignalingManager";
import { decimalsOf, formatPrice } from "../../utils/format";
import { decimalsFor, groupLevels, groupingSteps, Level, sizeDecimals, tickSize } from "../../utils/orderbook";
import { usePriceDirection, useTicker } from "../../utils/useTicker";
import { baseAsset, quoteAsset } from "../CoinLogo";
import { useOrderForm } from "../trade/orderForm";
import { DepthRow, DepthSide, ROW_HEIGHT } from "./DepthSide";

type View = "both" | "bids" | "asks";

export function Depth({ market }: { market: string }) {
    const [bids, setBids] = useState<Level[]>();
    const [asks, setAsks] = useState<Level[]>();
    const [step, setStep] = useState<number>();
    const [view, setView] = useState<View>("both");
    const { fillFromBook } = useOrderForm();
    const ticker = useTicker(market);
    const direction = usePriceDirection(ticker?.lastPrice);
    const listRef = useRef<HTMLDivElement>(null);
    const capacity = useRowCapacity(listRef);

    useEffect(() => {
        setBids(undefined);
        setAsks(undefined);
        setStep(undefined);

        const id = `DEPTH-${market}`;
        SignalingManager.getInstance().registerCallback("depth", (data: any) => {
            // Merge the incremental update into the book: replace touched levels,
            // drop zero-quantity ones, then re-sort.
            const applyUpdate = (
                original: Level[] | undefined,
                updates: Level[],
                sort: (x: Level, y: Level) => number,
            ) => {
                const book = new Map((original || []).map(([p, q]) => [p, q]));
                for (const [p, q] of updates || []) {
                    if (Number(q) === 0) book.delete(p);
                    else book.set(p, q);
                }
                return Array.from(book.entries()).sort(sort) as Level[];
            };

            setBids((prev) => applyUpdate(prev, data.bids, (x, y) => Number(y[0]) - Number(x[0])));
            setAsks((prev) => applyUpdate(prev, data.asks, (x, y) => Number(x[0]) - Number(y[0])));
        }, id);

        SignalingManager.getInstance().subscribe(`depth.${market}`);

        getDepth(market).then((d) => {
            // The REST snapshot lists bids ascending; the UI wants the best bid first.
            setBids([...d.bids].sort((x, y) => Number(y[0]) - Number(x[0])));
            setAsks([...d.asks].sort((x, y) => Number(x[0]) - Number(y[0])));
        }).catch(() => { });

        return () => {
            SignalingManager.getInstance().unsubscribe(`depth.${market}`);
            SignalingManager.getInstance().deRegisterCallback("depth", id);
        };
    }, [market]);

    const tick = useMemo(() => tickSize([...(asks ?? []), ...(bids ?? [])]), [asks, bids]);
    const steps = useMemo(() => groupingSteps(tick), [tick]);
    const activeStep = step ?? steps[0];
    const priceDecimals = decimalsFor(activeStep);
    const sizeScale = useMemo(() => sizeDecimals([...(asks ?? []), ...(bids ?? [])]), [asks, bids]);

    const rowsPerSide = view === "both" ? Math.floor(capacity / 2) : capacity;
    const askRows = useSide(asks, activeStep, "ask", rowsPerSide);
    const bidRows = useSide(bids, activeStep, "bid", rowsPerSide);
    const maxTotal = Math.max(askRows.maxTotal, bidRows.maxTotal);

    const bestBid = bids?.[0]?.[0];
    const bestAsk = asks?.[0]?.[0];
    const spread = bestBid && bestAsk ? Number(bestAsk) - Number(bestBid) : undefined;
    const spreadPercent = spread !== undefined && bestAsk ? (spread / Number(bestAsk)) * 100 : undefined;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-none items-center justify-between gap-2 px-2 py-1.5">
                <ViewToggle view={view} onChange={setView} />
                <GroupSelect steps={steps} value={activeStep} onChange={setStep} />
            </div>

            <div className="flex flex-none items-center px-3 pb-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="flex-1 text-left">Price</span>
                <span className="flex-1 text-right">Size ({baseAsset(market)})</span>
                <span className="flex-1 text-right">Total</span>
            </div>

            <div ref={listRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {view !== "bids" && (
                    <DepthSide rows={askRows.rows} side="ask" maxTotal={maxTotal} priceDecimals={priceDecimals} sizeDecimals={sizeScale} onSelect={select(fillFromBook, priceDecimals, sizeScale)} align="bottom" />
                )}

                <div className={`flex flex-none items-center justify-between gap-2 border-y border-border px-3 py-2 ${view === "both" ? "" : "order-first"}`}>
                    <span className={`font-mono text-base font-semibold tabular-nums ${Number(ticker?.priceChange) >= 0 ? "text-up" : "text-down"} ${direction === "up" ? "flash-up" : direction === "down" ? "flash-down" : ""}`}>
                        {ticker ? formatPrice(ticker.lastPrice) : "—"}
                    </span>
                    <span className="truncate text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                        {spread !== undefined
                            ? `spread ${formatPrice(spread, decimalsOf(bestAsk))} · ${spreadPercent!.toFixed(3)}%`
                            : `${quoteAsset(market)}`}
                    </span>
                </div>

                {view !== "asks" && (
                    <DepthSide rows={bidRows.rows} side="bid" maxTotal={maxTotal} priceDecimals={priceDecimals} sizeDecimals={sizeScale} onSelect={select(fillFromBook, priceDecimals, sizeScale)} />
                )}
            </div>

            <BookRatio bidVolume={bidRows.maxTotal} askVolume={askRows.maxTotal} />
        </div>
    );
}

const select = (fill: (price: string, quantity?: string) => void, priceDecimals: number, sizeDecimals: number) =>
    (row: DepthRow) => fill(row.price.toFixed(priceDecimals), row.total.toFixed(sizeDecimals));

/** Grouped, trimmed to what fits, with a running cumulative size. */
function useSide(levels: Level[] | undefined, step: number, side: "bid" | "ask", rows: number) {
    return useMemo(() => {
        if (!levels) return { rows: [] as DepthRow[], maxTotal: 0 };
        const grouped = groupLevels(levels, step, side).slice(0, Math.max(1, rows));
        let running = 0;
        const out = grouped.map(([price, quantity]) => ({ price, quantity, total: (running += quantity) }));
        return { rows: side === "ask" ? out.reverse() : out, maxTotal: running };
    }, [levels, step, side, rows]);
}

/* The book fills whatever height the panel gives it, so the same component
   shows five levels a side in a phone sheet and twenty on a desktop column. */
function useRowCapacity(ref: RefObject<HTMLElement>) {
    const [capacity, setCapacity] = useState(14);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        const observer = new ResizeObserver(() => {
            // 48px is the spread row that sits between the two sides.
            const usable = element.clientHeight - 48;
            setCapacity(Math.max(6, Math.floor(usable / ROW_HEIGHT)));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return capacity;
}

function BookRatio({ bidVolume, askVolume }: { bidVolume: number; askVolume: number }) {
    const total = bidVolume + askVolume;
    if (total <= 0) return null;
    const bidShare = (bidVolume / total) * 100;
    return (
        <div className="flex flex-none items-center gap-2 border-t border-border px-3 py-2">
            <span className="font-mono text-[10px] tabular-nums text-up">{bidShare.toFixed(0)}%</span>
            <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-down/30">
                <div className="h-full bg-up transition-[width] duration-500" style={{ width: `${bidShare}%` }} />
            </div>
            <span className="font-mono text-[10px] tabular-nums text-down">{(100 - bidShare).toFixed(0)}%</span>
        </div>
    );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (view: View) => void }) {
    const options: { value: View; label: string; icon: JSX.Element }[] = [
        { value: "both", label: "Bids and asks", icon: <><rect x="3" y="3" width="14" height="6" rx="1" /><rect x="3" y="11" width="14" height="6" rx="1" /></> },
        { value: "bids", label: "Bids only", icon: <rect x="3" y="10" width="14" height="7" rx="1" /> },
        { value: "asks", label: "Asks only", icon: <rect x="3" y="3" width="14" height="7" rx="1" /> },
    ];
    return (
        <div className="flex items-center gap-0.5">
            {options.map(({ value, label, icon }) => (
                <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={view === value}
                    onClick={() => onChange(value)}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-200 ${view === value ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">{icon}</svg>
                </button>
            ))}
        </div>
    );
}

function GroupSelect({ steps, value, onChange }: { steps: number[]; value: number; onChange: (step: number) => void }) {
    return (
        <label className="flex items-center gap-1.5">
            <span className="sr-only">Price grouping</span>
            <select
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="h-7 cursor-pointer rounded-md border border-border bg-transparent px-1.5 font-mono text-xs tabular-nums text-muted-foreground outline-none transition-colors duration-200 hover:text-foreground"
            >
                {steps.map((step) => (
                    <option key={step} value={step} className="bg-elevated text-foreground">
                        {formatPrice(step, decimalsFor(step))}
                    </option>
                ))}
            </select>
        </label>
    );
}
