import { Client } from "pg";
import { pgConfig } from "./config";

const REFRESH_INTERVAL_MS = 1000 * 10;

const client = new Client(pgConfig);
client.connect();

async function refreshViews() {
    await client.query("REFRESH MATERIALIZED VIEW klines_1m");
    await client.query("REFRESH MATERIALIZED VIEW klines_1h");
    await client.query("REFRESH MATERIALIZED VIEW klines_1w");
    console.log("Materialized views refreshed");
}

refreshViews().catch(console.error);

setInterval(() => {
    refreshViews().catch(console.error);
}, REFRESH_INTERVAL_MS);
