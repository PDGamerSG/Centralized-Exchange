"use client";

import { useState } from "react";

// Backpack hosts an icon for every asset it lists (sol.png, aster.png, ...),
// so the logos always match the markets the UI shows.
const iconUrl = (asset: string) => `https://backpack.exchange/coins/${asset.toLowerCase()}.png`;

export function baseAsset(market: string): string {
    return market.split("_")[0];
}

export function quoteAsset(market: string): string {
    return market.split("_")[1] ?? "USDC";
}

export function CoinLogo({ asset, className }: { asset: string, className?: string }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return <div className={`flex items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground ${className ?? ""}`}>
            {asset.slice(0, 1)}
        </div>;
    }
    return <img
        alt={`${asset} logo`}
        src={iconUrl(asset)}
        loading="lazy"
        decoding="async"
        className={`rounded-full ${className ?? ""}`}
        onError={() => setFailed(true)}
    />;
}
