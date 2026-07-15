import { createClient } from "redis";
import { Engine } from "./trade/Engine";

async function main() {
    const engine = new Engine();
    const redisClient = createClient();
    await redisClient.connect();
    console.log("Engine connected to redis, waiting for messages");

    while (true) {
        const entry = await redisClient.brPop("messages", 0);
        if (entry) {
            engine.process(JSON.parse(entry.element));
        }
    }
}

main();
