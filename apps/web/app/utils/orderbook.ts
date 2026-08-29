export type Level = [string, string];

/** Smallest price step the venue quotes, read off the precision of its own strings. */
export function tickSize(levels: Level[]): number {
    let decimals = 0;
    for (const [price] of levels.slice(0, 20)) {
        const dot = price.indexOf(".");
        if (dot !== -1) decimals = Math.max(decimals, price.length - dot - 1);
    }
    return Number(`1e-${decimals}`);
}

/** How many decimals the venue quotes sizes with, capped so the column stays narrow. */
export function sizeDecimals(levels: Level[]): number {
    let decimals = 0;
    for (const [, quantity] of levels.slice(0, 20)) {
        const dot = quantity.indexOf(".");
        if (dot !== -1) decimals = Math.max(decimals, quantity.length - dot - 1);
    }
    return Math.min(decimals, 3);
}

/** The grouping choices offered above the book: the tick and three round multiples of it. */
export function groupingSteps(tick: number): number[] {
    return [1, 10, 100, 1000].map((multiple) => round(tick * multiple, decimalsFor(tick)));
}

export function decimalsFor(step: number): number {
    if (step >= 1) return 0;
    return Math.max(0, Math.ceil(-Math.log10(step)));
}

/* Bucket levels onto a coarser price grid. Bids round down and asks round up,
   so a bucket always overstates the distance from the mid rather than
   promising a better price than the book holds. */
export function groupLevels(levels: Level[], step: number, side: "bid" | "ask"): [number, number][] {
    if (step <= 0) return levels.map(([p, q]) => [Number(p), Number(q)]);
    const decimals = decimalsFor(step);
    const buckets = new Map<number, number>();

    for (const [price, quantity] of levels) {
        const value = Number(price);
        if (!Number.isFinite(value)) continue;
        const ratio = value / step;
        const bucket = round((side === "bid" ? Math.floor(ratio) : Math.ceil(ratio)) * step, decimals);
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + Number(quantity));
    }

    const sorted = Array.from(buckets.entries()).sort((a, b) => side === "bid" ? b[0] - a[0] : a[0] - b[0]);
    return sorted;
}

function round(value: number, decimals: number): number {
    return Number(value.toFixed(Math.min(decimals, 10)));
}
