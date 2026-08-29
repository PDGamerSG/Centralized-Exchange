"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getTickers } from "../../utils/httpClient";
import { formatPercent, formatPrice } from "../../utils/format";
import { Ticker } from "../../utils/types";
import { useFavorites } from "../../utils/useFavorites";
import { CoinLogo, baseAsset, isPerp, quoteAsset } from "../CoinLogo";
import { PerpBadge } from "../core/Badge";
import { Star } from "../core/Star";

/* Switching pairs without a trip back to the markets list is the one thing
   every exchange puts in this corner of the screen. Starred markets sort
   to the top so the pairs someone actually watches are one tap away. */
export function MarketSelector({ market }: { market: string }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [tickers, setTickers] = useState<Ticker[]>();
    const { favorites, toggle, isFavorite } = useFavorites();
    const router = useRouter();
    const wrapRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

    /* The market bar scrolls horizontally on narrow desktops, and that scroll
       container clips anything absolutely positioned inside it. The panel is
       rendered into the body instead and pinned to the button's rectangle. */
    const place = useCallback(() => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (rect) setAnchor({ top: rect.bottom + 8, left: rect.left });
    }, []);

    useEffect(() => {
        if (!open || tickers) return;
        getTickers().then(setTickers).catch(() => { });
    }, [open, tickers]);

    useLayoutEffect(() => {
        if (!open) return;
        place();
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open, place]);

    useEffect(() => {
        if (!open) return;
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        const onPointerDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (wrapRef.current?.contains(target) || panelRef.current?.contains(target)) return;
            setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        window.addEventListener("mousedown", onPointerDown);
        return () => {
            window.removeEventListener("keydown", onKey);
            window.removeEventListener("mousedown", onPointerDown);
        };
    }, [open]);

    const results = useMemo(() => {
        if (!tickers) return undefined;
        const needle = query.trim().toLowerCase().replace(/[/_\s]/g, "");
        return tickers
            .filter((t) => !needle || t.symbol.toLowerCase().replace("_", "").includes(needle))
            .sort((a, b) => {
                const star = Number(favorites.includes(b.symbol)) - Number(favorites.includes(a.symbol));
                return star || Number(b.quoteVolume) - Number(a.quoteVolume);
            })
            .slice(0, 60);
    }, [tickers, query, favorites]);

    const select = (symbol: string) => {
        setOpen(false);
        setQuery("");
        router.push(`/trade/${symbol}`);
    };

    return (
        <div ref={wrapRef} className="relative flex-none">
            <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2.5 transition-colors duration-200 hover:bg-foreground/5 sm:gap-3"
            >
                <div className="flex flex-row">
                    <CoinLogo asset={baseAsset(market)} className="z-10 h-6 w-6" />
                    <CoinLogo asset={quoteAsset(market)} className="-ml-2 h-6 w-6" />
                </div>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold tracking-tight">
                    {baseAsset(market)}<span className="text-muted-foreground"> / {quoteAsset(market)}</span>
                    {isPerp(market) && <PerpBadge />}
                </span>
                <svg className={`h-3.5 w-3.5 flex-none text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {open && anchor && createPortal(
                <div
                    ref={panelRef}
                    style={{ top: anchor.top, left: anchor.left }}
                    className="animate-rise fixed z-[70] flex max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl"
                >
                    <div className="flex-none border-b border-border p-2">
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search pair"
                            aria-label="Search pair"
                            className="h-9 w-full rounded-lg bg-foreground/5 px-3 text-sm outline-none transition-colors duration-200 placeholder:text-muted-foreground focus:bg-foreground/10"
                        />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto thin-scrollbar" role="listbox">
                        {!results && <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading markets…</p>}
                        {results?.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No match.</p>}
                        {results?.map((t) => {
                            const up = Number(t.priceChangePercent) >= 0;
                            return (
                                <div
                                    key={t.symbol}
                                    role="option"
                                    aria-selected={t.symbol === market}
                                    className={`flex items-center gap-2 px-2 transition-colors duration-200 hover:bg-foreground/5 ${t.symbol === market ? "bg-foreground/5" : ""}`}
                                >
                                    <Star active={isFavorite(t.symbol)} onToggle={() => toggle(t.symbol)} label={t.symbol} />
                                    <button type="button" onClick={() => select(t.symbol)} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left">
                                        <CoinLogo asset={baseAsset(t.symbol)} className="h-6 w-6 flex-none" />
                                        <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                            <span className="truncate text-sm font-medium">
                                                {baseAsset(t.symbol)}<span className="text-muted-foreground">/{quoteAsset(t.symbol)}</span>
                                            </span>
                                            {isPerp(t.symbol) && <PerpBadge />}
                                        </span>
                                        <span className="flex-none font-mono text-xs tabular-nums">{formatPrice(t.lastPrice)}</span>
                                        <span className={`w-16 flex-none text-right font-mono text-xs tabular-nums ${up ? "text-up" : "text-down"}`}>
                                            {formatPercent(t.priceChangePercent)}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
