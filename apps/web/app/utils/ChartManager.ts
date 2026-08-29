import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  LineStyle,
  UTCTimestamp,
} from "lightweight-charts";

export type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
};

/* lightweight-charts parses hex/rgb only, so every value here has already
   been resolved from the CSS tokens by the caller. */
export type ChartTheme = {
  background: string;
  text: string;
  grid: string;
  up: string;
  down: string;
};

export class ChartManager {
  private chart: IChartApi;
  private candleSeries: ISeriesApi<"Candlestick">;
  private volumeSeries: ISeriesApi<"Histogram">;
  private theme: ChartTheme;

  constructor(container: HTMLElement, initialData: Candle[], theme: ChartTheme, intraday: boolean) {
    this.theme = theme;
    this.chart = createLightWeightChart(container, {
      autoSize: true,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: theme.grid, labelBackgroundColor: theme.text, style: LineStyle.LargeDashed },
        horzLine: { color: theme.grid, labelBackgroundColor: theme.text, style: LineStyle.LargeDashed },
      },
      rightPriceScale: {
        borderVisible: false,
        ticksVisible: false,
        entireTextOnly: true,
        scaleMargins: { top: 0.08, bottom: 0.26 },
      },
      timeScale: {
        borderVisible: false,
        // Minute and hour candles need the clock; daily ones only the date.
        timeVisible: intraday,
        secondsVisible: false,
        rightOffset: 3,
      },
      // Horizontal lines only: the vertical ones fight the candles.
      grid: {
        horzLines: { color: theme.grid },
        vertLines: { visible: false },
      },
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.text,
        fontFamily: "var(--font-mono), ui-monospace, monospace",
      },
      handleScale: { axisPressedMouseMove: { price: false } },
    });

    this.candleSeries = this.chart.addCandlestickSeries({
      upColor: theme.up,
      downColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
      borderVisible: false,
    });

    // Volume rides in the bottom quarter on its own invisible scale so it
    // never distorts the price axis.
    this.volumeSeries = this.chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    this.chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    this.setData(initialData);
  }

  public applyTheme(theme: ChartTheme) {
    this.theme = theme;
    this.chart.applyOptions({
      layout: { background: { type: ColorType.Solid, color: theme.background }, textColor: theme.text },
      grid: { horzLines: { color: theme.grid } },
      crosshair: {
        vertLine: { color: theme.grid, labelBackgroundColor: theme.text },
        horzLine: { color: theme.grid, labelBackgroundColor: theme.text },
      },
    });
    this.candleSeries.applyOptions({
      upColor: theme.up,
      downColor: theme.down,
      wickUpColor: theme.up,
      wickDownColor: theme.down,
    });
  }

  public setData(candles: Candle[]) {
    this.candleSeries.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );
    this.volumeSeries.setData(
      candles.map((c) => ({
        time: (c.timestamp / 1000) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? withAlpha(this.theme.up, 0.35) : withAlpha(this.theme.down, 0.35),
      }))
    );
  }

  public fit() {
    this.chart.timeScale().fitContent();
  }

  public destroy() {
    this.chart.remove();
  }
}

// The resolved token arrives as "rgb(r, g, b)"; volume bars want it faded.
function withAlpha(color: string, alpha: number): string {
  const parts = color.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return color;
  return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
}
