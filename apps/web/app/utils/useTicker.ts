"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getTicker } from "./httpClient";
import { SignalingManager } from "./SignalingManager";
import { Ticker } from "./types";

/* REST gives the full snapshot, the stream gives the moving parts. Merging
   them in one place keeps every consumer on the same numbers. */
export function useTicker(market: string): Ticker | null {
    const [ticker, setTicker] = useState<Ticker | null>(null);
    // Three panels can watch the same market, and callbacks are removed by id.
    const instance = useId();

    useEffect(() => {
        let disposed = false;
        setTicker(null);
        getTicker(market).then((t) => { if (!disposed) setTicker(t); }).catch(() => { });

        const id = `TICKER-${market}-${instance}`;
        SignalingManager.getInstance().registerCallback("ticker", (data: Partial<Ticker>) => {
            // Callbacks are registered per type, not per stream, so a second
            // subscribed market would otherwise overwrite this one.
            if (data.symbol && data.symbol !== market) return;
            setTicker((prev) => ({ ...(prev ?? ({} as Ticker)), ...pruned(data) }));
        }, id);
        SignalingManager.getInstance().subscribe(`ticker.${market}`);

        return () => {
            disposed = true;
            SignalingManager.getInstance().deRegisterCallback("ticker", id);
            SignalingManager.getInstance().unsubscribe(`ticker.${market}`);
        };
    }, [market, instance]);

    return ticker;
}

// A stream event only carries the fields that moved; undefined ones must not
// wipe what the REST snapshot already provided.
function pruned(data: Partial<Ticker>): Partial<Ticker> {
    return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null)) as Partial<Ticker>;
}

/** "up" | "down" | null for one render after the value moves, for flash styling. */
export function usePriceDirection(value: string | undefined): "up" | "down" | null {
    const [direction, setDirection] = useState<"up" | "down" | null>(null);
    const previous = useRef<number>();

    useEffect(() => {
        const next = Number(value);
        if (!Number.isFinite(next)) return;
        const last = previous.current;
        previous.current = next;
        if (last === undefined || last === next) return;
        setDirection(next > last ? "up" : "down");
        const timer = setTimeout(() => setDirection(null), 600);
        return () => clearTimeout(timer);
    }, [value]);

    return direction;
}
