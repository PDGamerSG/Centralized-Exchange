"use client";
import { useEffect, useRef, useState } from "react";
import { Candle, ChartManager, ChartTheme } from "../../utils/ChartManager";
import { getKlines, klineTime } from "../../utils/httpClient";
import { Panel } from "../core/Panel";
import { Skeleton } from "../core/Skeleton";

const REFRESH_MS = 30 * 1000;

/* Each interval carries the window that shows a useful amount of history
   without asking the API for thousands of candles. */
const intervals = [
  { value: "1m", label: "1m", days: 0.5, intraday: true },
  { value: "5m", label: "5m", days: 2, intraday: true },
  { value: "15m", label: "15m", days: 5, intraday: true },
  { value: "1h", label: "1H", days: 14, intraday: true },
  { value: "4h", label: "4H", days: 60, intraday: true },
  { value: "1d", label: "1D", days: 365, intraday: false },
] as const;

type Interval = (typeof intervals)[number]["value"];

/* lightweight-charts only parses hex/rgb color strings, so the hsl tokens
   have to be resolved to rgb by the browser before they reach the chart. */
const resolveColor = (value: string) => {
  const probe = document.createElement("span");
  probe.style.color = value;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

const chartTheme = (): ChartTheme => ({
  background: resolveColor("hsl(var(--card))"),
  text: resolveColor("hsl(var(--muted-foreground))"),
  grid: resolveColor("hsl(var(--foreground) / 0.07)"),
  up: resolveColor("hsl(var(--up))"),
  down: resolveColor("hsl(var(--down))"),
});

export function ChartPanel({ market, className = "" }: { market: string; className?: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager | null>(null);
  const [interval, setIntervalValue] = useState<Interval>("1h");
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let disposed = false;
    const config = intervals.find((i) => i.value === interval)!;

    const fetchCandles = async (): Promise<Candle[]> => {
      const end = Math.floor(Date.now() / 1000);
      const start = Math.floor(end - config.days * 24 * 60 * 60);
      try {
        const klines = await getKlines(market, interval, start, end);
        return klines.map((k) => ({
          open: parseFloat(k.open),
          high: parseFloat(k.high),
          low: parseFloat(k.low),
          close: parseFloat(k.close),
          volume: parseFloat(k.volume) || 0,
          timestamp: klineTime(k),
        })).filter((c) => Number.isFinite(c.close));
      } catch {
        return [];
      }
    };

    const init = async () => {
      setLoading(true);
      const candles = await fetchCandles();
      if (disposed || !chartRef.current) return;
      chartManagerRef.current?.destroy();
      chartManagerRef.current = new ChartManager(chartRef.current, candles, chartTheme(), config.intraday);
      chartManagerRef.current.fit();
      setEmpty(candles.length === 0);
      setLoading(false);
    };

    init();

    const onThemeChange = () => chartManagerRef.current?.applyTheme(chartTheme());
    window.addEventListener("themechange", onThemeChange);

    const refreshTimer = setInterval(async () => {
      const candles = await fetchCandles();
      if (!disposed && candles.length > 0) chartManagerRef.current?.setData(candles);
    }, REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(refreshTimer);
      window.removeEventListener("themechange", onThemeChange);
      chartManagerRef.current?.destroy();
      chartManagerRef.current = null;
    };
  }, [market, interval]);

  return (
    <Panel
      className={`relative overflow-hidden ${className}`}
      header={
        <div className="flex w-full items-center gap-0.5 overflow-x-auto no-scrollbar">
          {intervals.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntervalValue(value)}
              aria-pressed={value === interval}
              className={`h-7 min-w-[2.25rem] rounded-md px-2 font-mono text-xs transition-colors duration-200 ${value === interval
                ? "bg-foreground/10 font-semibold text-foreground"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      }
    >
      <div ref={chartRef} className="min-h-0 flex-1" />
      {loading && (
        <div className="absolute inset-x-3 bottom-3 top-14 flex items-end gap-1">
          {Array.from({ length: 28 }, (_, i) => (
            <Skeleton key={i} className="flex-1" style={{ height: `${20 + ((i * 37) % 70)}%` }} />
          ))}
        </div>
      )}
      {!loading && empty && (
        <div className="absolute inset-0 top-10 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No candles for this interval yet.</p>
        </div>
      )}
    </Panel>
  );
}
