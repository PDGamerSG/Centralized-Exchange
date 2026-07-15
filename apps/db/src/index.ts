import { Client } from "pg";
import { createClient } from "redis";
import { pgConfig } from "./config";
import { DbMessage } from "./types";

const pgClient = new Client(pgConfig);

async function main() {
    await pgClient.connect();
    const redisClient = createClient();
    await redisClient.connect();
    console.log("DB worker connected to redis, waiting for messages");

    while (true) {
        const entry = await redisClient.brPop("db_processor", 0);
        if (!entry) {
            continue;
        }

        const message: DbMessage = JSON.parse(entry.element);
        if (message.type === "TRADE_ADDED") {
            const { market, price, quantity, timestamp } = message.data;
            console.log(`Storing trade: ${market} ${quantity} @ ${price}`);
            await pgClient.query(
                "INSERT INTO tata_prices (time, price, volume, currency_code) VALUES ($1, $2, $3, $4)",
                [new Date(timestamp), price, Number(quantity), market]
            );
        }
    }
}

main();
