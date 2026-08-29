import { formatPrice, rangePosition } from "../../utils/format";

/* Where the last trade sits inside the day's range. Cheaper than a sparkline
   (no extra request per market) and it answers the question a trader
   actually asks of a list: is this thing near its high or near its low? */
export function RangeMeter({ low, high, last }: { low: string; high: string; last: string }) {
    const position = rangePosition(low, high, last);
    return (
        <div
            className="flex w-full min-w-[7rem] items-center gap-2"
            title={`24h low ${formatPrice(low)} · high ${formatPrice(high)}`}
        >
            <span className="font-mono text-[10px] text-muted-foreground">L</span>
            <div className="relative h-1 flex-1 rounded-full bg-foreground/10">
                <div
                    className="absolute top-1/2 h-2.5 w-[2px] -translate-y-1/2 rounded-full bg-foreground transition-[left] duration-500"
                    style={{ left: `calc(${position * 100}% - 1px)` }}
                />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">H</span>
        </div>
    );
}
