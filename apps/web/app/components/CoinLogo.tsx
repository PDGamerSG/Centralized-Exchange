"use client";

import { useState } from "react";
import Image from "next/image";

// Backpack hosts an icon for every asset it lists (sol.png, aster.png, ...),
// so the logos always match the markets the UI shows.
const iconUrl = (asset: string) =>
  `https://backpack.exchange/coins/${asset.toLowerCase()}.png`;

export function baseAsset(market: string): string {
  return market.split("_")[0];
}

export function quoteAsset(market: string): string {
  return market.split("_")[1] ?? "USDC";
}

// Backpack lists perpetuals as BASE_QUOTE_PERP alongside the spot pair, so
// without this the two rows are identical.
export function isPerp(market: string): boolean {
  return market.endsWith("_PERP");
}

export function CoinLogo({
  asset,
  className,
}: {
  asset: string;
  className?: string;
}) {
  const [failedAsset, setFailedAsset] = useState<string>();

  if (failedAsset === asset) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground ${className ?? ""}`}
      >
        {asset.slice(0, 1)}
      </div>
    );
  }
  return (
    <Image
      alt={`${asset} logo`}
      src={iconUrl(asset)}
      width={36}
      height={36}
      unoptimized
      loading="lazy"
      decoding="async"
      className={`rounded-full ${className ?? ""}`}
      onError={() => setFailedAsset(asset)}
    />
  );
}
