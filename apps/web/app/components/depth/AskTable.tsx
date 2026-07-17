
export const AskTable = ({ asks }: { asks: [string, string][] }) => {
    let currentTotal = 0;
    // Cumulative total grows away from the spread, so accumulate over the
    // best (lowest) asks first, then flip so the best ask sits at the bottom.
    const relevantAsks = asks.slice(0, 15);
    const asksWithTotal: [string, string, number][] = relevantAsks.map(([price, quantity]) => [price, quantity, currentTotal += Number(quantity)]);
    const maxTotal = relevantAsks.reduce((acc, [_, quantity]) => acc + Number(quantity), 0);
    asksWithTotal.reverse();

    return <div>
        {asksWithTotal.map(([price, quantity, total]) => <Ask maxTotal={maxTotal} key={price} price={price} quantity={quantity} total={total} />)}
    </div>
}
function Ask({price, quantity, total, maxTotal}: {price: string, quantity: string, total: number, maxTotal: number}) {
    return <div
    style={{
        display: "flex",
        position: "relative",
        width: "100%",
        backgroundColor: "transparent",
        overflow: "hidden",
    }}
>
    <div
        style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: `${(100 * total) / maxTotal}%`,
        height: "100%",
        background: "hsl(359 81% 57% / 0.12)",
        transition: "width 0.3s ease-in-out",
        }}
    ></div>
    <div className="flex w-full justify-between px-3 py-[2px] font-mono text-xs">
        <div className="text-down">
            {price}
        </div>
        <div className="text-foreground/80">
            {quantity}
        </div>
        <div className="text-muted-foreground">
            {total?.toFixed(2)}
        </div>
    </div>
    </div>
}
