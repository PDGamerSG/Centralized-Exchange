"use client";
import { useState } from "react";
import { CoinLogo, baseAsset, quoteAsset } from "./CoinLogo";

export function SwapUI({ market }: {market: string}) {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [activeTab, setActiveTab] = useState('buy');
    const [type, setType] = useState('limit');
    const total = Number(price) * Number(quantity);
    const buying = activeTab === 'buy';

    const sideClass = (active: boolean, tone: string) =>
        `rounded-lg py-2 text-sm font-semibold transition-colors duration-300 ${active ? tone : "text-muted-foreground hover:text-foreground"}`;
    const typeClass = (active: boolean) =>
        `cursor-pointer text-sm transition-colors duration-300 ${active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`;

    return <div className="flex flex-col gap-4 p-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-foreground/5 p-1">
            <button type="button" className={sideClass(buying, "bg-up/15 text-up")} onClick={() => setActiveTab('buy')}>
                Buy
            </button>
            <button type="button" className={sideClass(!buying, "bg-down/15 text-down")} onClick={() => setActiveTab('sell')}>
                Sell
            </button>
        </div>
        <div className="flex flex-row gap-4 px-1">
            <div className={typeClass(type === 'limit')} onClick={() => setType('limit')}>Limit</div>
            <div className={typeClass(type === 'market')} onClick={() => setType('market')}>Market</div>
        </div>
        <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="font-mono text-xs">36.94 USDC</p>
        </div>
        <Field label="Price" asset={quoteAsset(market)} value={price} onChange={setPrice} />
        <div className="flex flex-col gap-2">
            <Field label="Quantity" asset={baseAsset(market)} value={quantity} onChange={setQuantity} />
            <div className="flex justify-end">
                <p className="font-mono text-xs text-muted-foreground">≈ {Number.isFinite(total) ? total.toFixed(2) : "0.00"} USDC</p>
            </div>
        </div>
        <div className="flex justify-center gap-2">
            {["25%", "50%", "75%", "Max"].map((label) => (
                <button
                    key={label}
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
                >
                    {label}
                </button>
            ))}
        </div>
        <button
            type="button"
            className={`h-12 rounded-xl text-base font-semibold text-background transition-opacity duration-300 hover:opacity-90 ${buying ? "bg-up" : "bg-down"}`}
        >
            {buying ? "Buy" : "Sell"} {baseAsset(market)}
        </button>
        <div className="flex flex-row gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground" htmlFor="postOnly">
                <input className="h-4 w-4 accent-foreground" id="postOnly" type="checkbox" />
                Post only
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground" htmlFor="ioc">
                <input className="h-4 w-4 accent-foreground" id="ioc" type="checkbox" />
                IOC
            </label>
        </div>
    </div>
}

function Field({ label, asset, value, onChange }: { label: string, asset: string, value: string, onChange: (value: string) => void }) {
    return <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="relative">
            <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-foreground/5 pl-3 pr-12 text-right font-mono text-xl outline-none transition-colors duration-300 placeholder:text-muted-foreground/60 focus:border-foreground/40"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CoinLogo asset={asset} className="h-6 w-6" />
            </div>
        </div>
    </div>
}
