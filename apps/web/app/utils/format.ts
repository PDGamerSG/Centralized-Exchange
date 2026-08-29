/* Backpack sends every number as a string already rounded to the market's
   tick size — "183.45", "0.00001234". That string is the most reliable
   precision hint available, so the formatters below keep its decimal count
   instead of inventing one. Columns of prices then line up on the point. */

export function decimalsOf(raw: string | number | undefined): number {
    const dot = String(raw ?? "").indexOf(".");
    return dot === -1 ? 0 : String(raw).length - dot - 1;
}

const group = (value: number, decimals: number) =>
    value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Price at the market's own precision, thousands grouped. `—` for no value. */
export function formatPrice(raw: string | number | undefined, decimals?: number): string {
    if (raw === undefined || raw === null || raw === "") return "—";
    const value = Number(raw);
    if (!Number.isFinite(value)) return "—";
    return group(value, decimals ?? decimalsOf(raw));
}

/** Size column. Large sizes lose their decimals — they'd only add noise. */
export function formatQty(raw: string | number | undefined, decimals?: number): string {
    if (raw === undefined || raw === null || raw === "") return "—";
    const value = Number(raw);
    if (!Number.isFinite(value)) return "—";
    if (decimals === undefined && value >= 10_000) return group(value, 0);
    return group(value, decimals ?? Math.min(decimalsOf(raw), 4));
}

/** 24h volumes and notionals, where the magnitude matters more than the digits. */
export function formatCompact(raw: string | number | undefined): string {
    if (raw === undefined || raw === null || raw === "") return "—";
    const value = Number(raw);
    if (!Number.isFinite(value)) return "—";
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return group(value, abs >= 1 ? 2 : 4);
}

/** Backpack reports priceChangePercent as a fraction, so 0.0231 is +2.31%. */
export function formatPercent(fraction: string | number | undefined): string {
    const value = Number(fraction);
    if (!Number.isFinite(value)) return "—";
    return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
}

export function formatSigned(raw: string | number | undefined, decimals?: number): string {
    const value = Number(raw);
    if (!Number.isFinite(value)) return "—";
    return `${value >= 0 ? "+" : "−"}${formatPrice(Math.abs(value), decimals ?? decimalsOf(raw))}`;
}

export function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString("en-GB", { hour12: false });
}

/** Where the last price sits between the 24h low and high, as 0–1. */
export function rangePosition(low: string, high: string, last: string): number {
    const lo = Number(low), hi = Number(high), value = Number(last);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo) return 0.5;
    return Math.min(1, Math.max(0, (value - lo) / (hi - lo)));
}
