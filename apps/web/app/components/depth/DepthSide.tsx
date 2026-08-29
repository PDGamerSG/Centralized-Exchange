"use client";

import { formatPrice, formatQty } from "../../utils/format";

export const ROW_HEIGHT = 22;

export type DepthRow = { price: number; quantity: number; total: number };

/* Bars grow from the right edge, away from the price column, so the price
   ladder stays legible and the depth reads as a single silhouette. */
export function DepthSide({ rows, side, maxTotal, priceDecimals, sizeDecimals, onSelect, align = "top" }: {
    rows: DepthRow[];
    side: "bid" | "ask";
    maxTotal: number;
    priceDecimals: number;
    sizeDecimals: number;
    onSelect: (row: DepthRow) => void;
    align?: "top" | "bottom";
}) {
    const tone = side === "bid" ? "text-up" : "text-down";
    const bar = side === "bid" ? "hsl(var(--up) / 0.14)" : "hsl(var(--down) / 0.14)";

    return (
        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${align === "bottom" ? "justify-end" : "justify-start"}`}>
            {rows.map((row) => (
                <button
                    key={row.price}
                    type="button"
                    onClick={() => onSelect(row)}
                    title={`Fill ${formatPrice(row.price, priceDecimals)} into the order form`}
                    className="relative flex w-full flex-none items-center px-3 transition-colors duration-150 hover:bg-foreground/[0.06]"
                    style={{ height: ROW_HEIGHT }}
                >
                    <div
                        className="absolute inset-y-0 right-0 transition-[width] duration-300 ease-out"
                        style={{ width: `${maxTotal > 0 ? (100 * row.total) / maxTotal : 0}%`, background: bar }}
                    />
                    <span className={`relative z-10 flex-1 text-left font-mono text-xs tabular-nums ${tone}`}>
                        {formatPrice(row.price, priceDecimals)}
                    </span>
                    <span className="relative z-10 flex-1 text-right font-mono text-xs tabular-nums text-foreground/80">
                        {formatQty(row.quantity, sizeDecimals)}
                    </span>
                    <span className="relative z-10 flex-1 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {formatQty(row.total, 2)}
                    </span>
                </button>
            ))}
        </div>
    );
}
