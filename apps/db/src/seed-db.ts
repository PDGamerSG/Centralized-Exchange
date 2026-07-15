import { Client } from "pg";
import { pgConfig } from "./config";

const client = new Client(pgConfig);

const KLINE_INTERVALS: { [view: string]: string } = {
    klines_1m: "1 minute",
    klines_1h: "1 hour",
    klines_1w: "1 week",
};

async function initializeDB() {
    await client.connect();

    await client.query(`
        DROP MATERIALIZED VIEW IF EXISTS klines_1m;
        DROP MATERIALIZED VIEW IF EXISTS klines_1h;
        DROP MATERIALIZED VIEW IF EXISTS klines_1w;
        DROP TABLE IF EXISTS "tata_prices";

        CREATE TABLE "tata_prices"(
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price           DOUBLE PRECISION,
            volume          DOUBLE PRECISION,
            currency_code   VARCHAR (10)
        );

        SELECT create_hypertable('tata_prices', 'time');
    `);

    for (const [view, interval] of Object.entries(KLINE_INTERVALS)) {
        await client.query(`
            CREATE MATERIALIZED VIEW ${view} AS
            SELECT
                time_bucket('${interval}', time) AS bucket,
                first(price, time) AS open,
                max(price) AS high,
                min(price) AS low,
                last(price, time) AS close,
                sum(volume) AS volume,
                currency_code
            FROM tata_prices
            GROUP BY bucket, currency_code;
        `);
    }

    await client.end();
    console.log("Database initialized");
}

initializeDB().catch(console.error);
