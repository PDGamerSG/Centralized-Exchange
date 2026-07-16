import axios from "axios";
import { Depth, KLine, Ticker, Trade } from "./types";

// Live Backpack exchange data, proxied through next.config.mjs rewrites.
// Point NEXT_PUBLIC_API_URL at http://localhost:3000/api/v1 to use the local exchange instead.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/backpack-api";

export async function getTicker(market: string): Promise<Ticker> {
    const tickers = await getTickers();
    const ticker = tickers.find(t => t.symbol === market);
    if (!ticker) {
        throw new Error(`No ticker found for ${market}`);
    }
    return ticker;
}

export async function getTickers(): Promise<Ticker[]> {
    const response = await axios.get(`${BASE_URL}/tickers`);
    return response.data;
}


export async function getDepth(market: string): Promise<Depth> {
    const response = await axios.get(`${BASE_URL}/depth?symbol=${market}`);
    return response.data;
}
export async function getTrades(market: string): Promise<Trade[]> {
    const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
    return response.data;
}

export async function getKlines(market: string, interval: string, startTime: number, endTime: number): Promise<KLine[]> {
    const response = await axios.get(`${BASE_URL}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`);
    const data: KLine[] = response.data;
    return data.sort((x, y) => klineTime(x) - klineTime(y));
}

// Backpack returns kline times as UTC strings like "2026-07-14 19:00:00".
// Normalize to ISO so every browser parses them, and as UTC.
export function klineTime(k: KLine): number {
    return new Date(`${k.end.replace(" ", "T")}Z`).getTime();
}
