import { useEffect, useRef } from "react";
import { ChartManager } from "../utils/ChartManager";
import { getKlines, klineTime } from "../utils/httpClient";
import { KLine } from "../utils/types";

const REFRESH_MS = 30 * 1000;

export function TradeView({
  market,
}: {
  market: string;
}) {
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
        {
          background: "#0e0f14",
          color: "white",
        }
      );
      //@ts-ignore
      chartManagerRef.current = chartManager;
    };

    init();

    const refreshTimer = setInterval(async () => {
      const candles = await fetchCandles();
      if (!disposed && candles.length > 0) {
        chartManagerRef.current?.setData(candles);
      }
    }, REFRESH_MS);

    return () => {
      disposed = true;
      clearInterval(refreshTimer);
      if (chartManagerRef.current) {
        chartManagerRef.current.destroy();
        //@ts-ignore
        chartManagerRef.current = null;
      }
    };
  }, [market]);

  return (
    <>
      <div ref={chartRef} style={{ height: "520px", width: "100%", marginTop: 4 }}></div>
    </>
  );
}
