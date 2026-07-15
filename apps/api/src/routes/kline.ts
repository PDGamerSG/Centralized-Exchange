import { Client } from "pg";
import { Router } from "express";

const pgClient = new Client({
    user: process.env.PGUSER || "exchange",
    host: process.env.PGHOST || "localhost",
    database: process.env.PGDATABASE || "exchange",
    password: process.env.PGPASSWORD || "exchange",
    port: Number(process.env.PGPORT) || 5432,
});
pgClient.connect().catch((err) => console.log("Failed to connect to timescaledb:", err.message));

const VIEW_BY_INTERVAL: { [interval: string]: string } = {
    "1m": "klines_1m",
    "1h": "klines_1h",
    "1w": "klines_1w",
};

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
    const { interval, startTime, endTime } = req.query;

    const view = VIEW_BY_INTERVAL[interval as string];
    if (!view) {
        res.status(400).send("Invalid interval");
        return;
    }

    try {
        const result = await pgClient.query(
            `SELECT * FROM ${view} WHERE bucket >= $1 AND bucket <= $2`,
            [new Date(Number(startTime) * 1000), new Date(Number(endTime) * 1000)]
        );
        res.json(result.rows.map(row => ({
            close: row.close,
            end: row.bucket,
            high: row.high,
            low: row.low,
            open: row.open,
            quoteVolume: row.quoteVolume,
            start: row.start,
            trades: row.trades,
            volume: row.volume,
        })));
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});
