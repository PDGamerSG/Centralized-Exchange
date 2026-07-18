
export const BidTable = ({ bids }: {bids: [string, string][]}) => {
    let currentTotal = 0;
    const relevantBids = bids.slice(0, 15);
    const bidsWithTotal: [string, string, number][] = relevantBids.map(([price, quantity]) => [price, quantity, currentTotal += Number(quantity)]);
    const maxTotal = relevantBids.reduce((acc, [_, quantity]) => acc + Number(quantity), 0);

    return <div>
        {bidsWithTotal?.map(([price, quantity, total]) => <Bid maxTotal={maxTotal} total={total} key={price} price={price} quantity={quantity} />)}
    </div>
}

function Bid({ price, quantity, total, maxTotal }: { price: string, quantity: string, total: number, maxTotal: number }) {
    return (
        <div
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
            background: "hsl(var(--up) / 0.12)",
            transition: "width 0.3s ease-in-out",
            }}
        ></div>
            <div className="flex w-full justify-between px-3 py-[2px] font-mono text-xs">
                <div className="text-up">
                    {price}
                </div>
                <div className="text-foreground/80">
                    {quantity}
                </div>
                <div className="text-muted-foreground">
                    {total.toFixed(2)}
                </div>
            </div>
        </div>
    );
}
