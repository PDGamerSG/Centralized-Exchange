"use client";
import { useEffect, useRef } from "react";
import { ChartManager } from "../../utils/ChartManager";
import { getKlines, klineTime } from "../../utils/httpClient";
import { KLine } from "../../utils/types";
import { Panel } from "../core/Panel";

const REFRESH_MS = 30 * 1000;

/* lightweight-charts only parses hex/rgb color strings, so the hsl tokens
   have to be resolved to rgb by the browser before they reach the chart. */
const resolveColor = (variable: string) => {
  const probe = document.createElement("span");
  probe.style.color = `hsl(var(${variable}))`;
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
};

const chartTheme = () => ({
  background: resolveColor("--card"),
  color: resolveColor("--muted-foreground"),
});

export function ChartPanel({ market }: { market: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartManagerRef = useRef<ChartManager>(null);

  useEffect(() => {
    let disposed = false;

    const fetchCandles = async () => {
      const end = Math.floor(new Date().getTime() / 1000);
      const start = end - 60 * 60 * 24 * 7;
      let klineData: KLine[] = [];
      try {
        klineData = await getKlines(market, "1h", start, end);
      } catch (e) { }
      return klineData.map((x) => ({
        close: parseFloat(x.close),
        high: parseFloat(x.high),
        low: parseFloat(x.low),
        open: parseFloat(x.open),
        timestamp: klineTime(x),
      }));
    };

    const init = async () => {
      const candles = await fetchCandles();
      if (disposed || !chartRef.current) {
        return;
      }
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
      }
      const chartManager = new ChartManager(
        chartRef.current,
        candles,
        chartTheme()
      );
      //@ts-ignore
      chartManagerRef.current = chartManager;
    };

    init();

    const onThemeChange = () => {
      chartManagerRef.current?.applyLayout(chartTheme());
    };
    window.addEventListener("themechange", onThemeChange);

    const refreshTimer = setInterval(async () => {
      const candles = await fetchCandles();
      if (!disposed && candles.length > 0) {
        chartManagerRef.current?.setData(candles);
      }
    }, REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(refreshTimer);
      window.removeEventListener("themechange", onThemeChange);
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        //@ts-ignore
        chartManagerRef.current = null;
      }
    };
  }, [market]);

  return (
    <Panel label="Price · 1h candles · 7 days" className="h-[300px] flex-none sm:h-[380px] md:h-[420px] md:min-w-0 md:flex-1 lg:h-auto">
      <div ref={chartRef} className="min-h-0 flex-1" />
    </Panel>
  );
}
