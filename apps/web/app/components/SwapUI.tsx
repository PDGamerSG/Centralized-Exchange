"use client";
import { useMemo, useState } from "react";
import { canPlaceOrders, placeOrder } from "../utils/orders";
import { formatPrice, formatQty } from "../utils/format";
import { useTicker } from "../utils/useTicker";
import { CoinLogo, baseAsset, quoteAsset } from "./CoinLogo";
import { Tabs } from "./core/Tabs";
import { useOrderForm } from "./trade/orderForm";

// No accounts exist in this build, so the balance is a fixed demo figure and
// the label says as much rather than implying a funded account.
const DEMO_BALANCE = { quote: 25_000, base: 12 };
const DEMO_USER_ID = "1";

type Status = { tone: "error" | "success"; message: string } | null;

export function SwapUI({ market }: { market: string }) {
    const { side, setSide, type, setType, price, setPrice, quantity, setQuantity } = useOrderForm();
    const ticker = useTicker(market);
    const [status, setStatus] = useState<Status>(null);
    const [submitting, setSubmitting] = useState(false);

    const base = baseAsset(market);
    const quote = quoteAsset(market);
    const buying = side === "buy";
    const marketPrice = Number(ticker?.lastPrice);
    const effectivePrice = type === "market" ? marketPrice : Number(price);
    const total = Number.isFinite(effectivePrice) && Number(quantity) > 0 ? effectivePrice * Number(quantity) : 0;

    // Buying is limited by quote balance, selling by the base asset held.
    const maxQuantity = useMemo(() => {
        if (!buying) return DEMO_BALANCE.base;
        if (!Number.isFinite(effectivePrice) || effectivePrice <= 0) return 0;
        return DEMO_BALANCE.quote / effectivePrice;
    }, [buying, effectivePrice]);

    const filled = maxQuantity > 0 ? Math.min(100, (Number(quantity) / maxQuantity) * 100) : 0;

    const setPortion = (percent: number) => {
        if (maxQuantity <= 0) return;
        const next = (maxQuantity * percent) / 100;
        setQuantity(next > 0 ? next.toFixed(4) : "");
    };

    const problem = (() => {
        if (type === "limit" && !(Number(price) > 0)) return "Enter a price above zero.";
        if (!(Number(quantity) > 0)) return "Enter a quantity above zero.";
        if (Number(quantity) > maxQuantity) return `That is more than the demo balance covers (max ${formatQty(maxQuantity)} ${base}).`;
        return null;
    })();

    const submit = async () => {
        if (problem) return setStatus({ tone: "error", message: problem });
        if (!canPlaceOrders) {
            return setStatus({
                tone: "error",
                message: "This build reads live Backpack data and cannot place orders. Point NEXT_PUBLIC_API_URL at the local exchange to trade.",
            });
        }
        setSubmitting(true);
        setStatus(null);
        try {
            await placeOrder({
                market,
                price: String(effectivePrice),
                quantity,
                side,
                userId: DEMO_USER_ID,
            });
            setStatus({ tone: "success", message: `${buying ? "Bought" : "Sold"} ${formatQty(quantity)} ${base}.` });
            setQuantity("");
        } catch {
            setStatus({ tone: "error", message: "The exchange rejected the order. Check the price and quantity, then try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return <div className="flex flex-col gap-4 p-3">
        <Tabs
            size="md"
            options={[
                { value: "buy", label: "Buy", activeClass: "bg-up/15 text-up" },
                { value: "sell", label: "Sell", activeClass: "bg-down/15 text-down" },
            ]}
            value={side}
            onChange={setSide}
        />

        <div className="flex items-center gap-4 border-b border-border px-1 pb-2">
            {(["limit", "market"] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`text-sm capitalize transition-colors duration-200 ${type === option ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                    {option}
                </button>
            ))}
        </div>

        <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Demo balance</p>
            <p className="font-mono text-xs tabular-nums">
                {buying ? `${formatPrice(DEMO_BALANCE.quote, 2)} ${quote}` : `${formatQty(DEMO_BALANCE.base)} ${base}`}
            </p>
        </div>

        {type === "limit" ? (
            <Field
                label="Price"
                asset={quote}
                value={price}
                onChange={setPrice}
                action={Number.isFinite(marketPrice) ? { label: "Last", onClick: () => setPrice(String(ticker!.lastPrice)) } : undefined}
            />
        ) : (
            <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Price</p>
                <div className="flex h-12 items-center justify-between rounded-xl border border-dashed border-border px-3">
                    <span className="text-sm text-muted-foreground">Best available</span>
                    <span className="font-mono text-sm tabular-nums">{ticker ? formatPrice(ticker.lastPrice) : "—"}</span>
                </div>
            </div>
        )}

        <Field label="Quantity" asset={base} value={quantity} onChange={setQuantity} />

        <div className="flex flex-col gap-3">
            <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(filled)}
                onChange={(e) => setPortion(Number(e.target.value))}
                aria-label="Portion of demo balance"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/10"
                style={{ accentColor: `hsl(var(--${buying ? "up" : "down"}))` }}
            />
            <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percent) => (
                    <button
                        key={percent}
                        type="button"
                        onClick={() => setPortion(percent)}
                        className="h-9 rounded-full border border-border text-xs text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
                    >
                        {percent === 100 ? "Max" : `${percent}%`}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Order value</p>
            <p className="font-mono text-sm tabular-nums">{formatPrice(total, 2)} {quote}</p>
        </div>

        <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className={`h-12 rounded-xl text-base font-semibold text-background transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 ${buying ? "bg-up" : "bg-down"}`}
        >
            {submitting ? "Placing…" : `${buying ? "Buy" : "Sell"} ${base}`}
        </button>

        {status && (
            <p className={`text-xs leading-relaxed ${status.tone === "error" ? "text-down" : "text-up"}`} role="status">
                {status.message}
            </p>
        )}

        {type === "limit" && (
            <div className="flex flex-row gap-4">
                <Toggle id="postOnly" label="Post only" />
                <Toggle id="ioc" label="IOC" />
            </div>
        )}
    </div>
}

function Toggle({ id, label }: { id: string; label: string }) {
    return <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground" htmlFor={id}>
        <input className="h-4 w-4 accent-foreground" id={id} type="checkbox" />
        {label}
    </label>;
}

function Field({ label, asset, value, onChange, action }: {
    label: string;
    asset: string;
    value: string;
    onChange: (value: string) => void;
    action?: { label: string; onClick: () => void };
}) {
    return <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{label}</p>
            {action && (
                <button type="button" onClick={action.onClick} className="text-[11px] text-muted-foreground underline-offset-2 transition-colors duration-200 hover:text-foreground hover:underline">
                    {action.label}
                </button>
            )}
        </div>
        <div className="relative">
            <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={value}
                onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
                className="h-12 w-full rounded-xl border border-border bg-foreground/5 pl-3 pr-14 text-right font-mono text-xl tabular-nums outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-foreground/40"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <CoinLogo asset={asset} className="h-6 w-6" />
            </div>
        </div>
    </div>
}
