import { RedisClientType, createClient } from "redis";
import { MessageFromOrderbook } from "./types";
import { MessageToEngine } from "./types/to";

export class RedisManager {
    private static instance: RedisManager;
    private client: RedisClientType;
    private publisher: RedisClientType;

    private constructor() {
        this.client = createClient();
        this.client.connect();
        this.publisher = createClient();
        this.publisher.connect();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new RedisManager();
        }
        return this.instance;
    }

    // Pushes a message onto the engine queue and resolves once the engine
    // publishes its reply on this request's unique client id channel.
    public sendAndAwait(message: MessageToEngine) {
        return new Promise<MessageFromOrderbook>((resolve) => {
            const id = this.getRandomClientId();
            this.client.subscribe(id, (reply) => {
                this.client.unsubscribe(id);
                resolve(JSON.parse(reply));
            });
            this.publisher.lPush("messages", JSON.stringify({ clientId: id, message }));
        });
    }

    public getRandomClientId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
}
