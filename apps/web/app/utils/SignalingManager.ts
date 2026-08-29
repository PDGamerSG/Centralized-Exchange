import { Ticker } from "./types";

// Live Backpack stream; point NEXT_PUBLIC_WS_URL at ws://localhost:3001 to use the local exchange instead.
export const BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://ws.backpack.exchange/";

type Callback = (data: any) => void;
type CallbackEntry = { callback: Callback, id: string };

export class SignalingManager {
    private static instance: SignalingManager;
    private ws: WebSocket;
    private bufferedMessages: any[] = [];
    private callbacks: { [type: string]: CallbackEntry[] } = {};
    private id: number;
    private initialized: boolean = false;
    // Several panels watch the same stream, so channels are reference
    // counted: the last one to leave is the one that unsubscribes.
    private subscriptions: Map<string, number> = new Map();

    private constructor() {
        this.ws = new WebSocket(BASE_URL);
        this.bufferedMessages = [];
        this.id = 1;
        this.init();
    }

    public static getInstance() {
        if (!this.instance) {
            this.instance = new SignalingManager();
        }
        return this.instance;
    }

    init() {
        this.ws.onopen = () => {
            this.initialized = true;
            this.bufferedMessages.forEach(message => {
                this.ws.send(JSON.stringify(message));
            });
            this.bufferedMessages = [];
        }
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            // Subscription acks have no data payload; only stream events do.
            const type = message?.data?.e;
            if (!this.callbacks[type]) {
                return;
            }
            this.callbacks[type].forEach(({ callback }) => {
                if (type === "ticker") {
                    // `o` is the 24h open, so the change and its percentage
                    // can be recomputed here rather than going stale on the
                    // values the REST snapshot happened to carry.
                    const open = Number(message.data.o);
                    const close = Number(message.data.c);
                    const newTicker: Partial<Ticker> = {
                        firstPrice: message.data.o,
                        lastPrice: message.data.c,
                        high: message.data.h,
                        low: message.data.l,
                        volume: message.data.v,
                        quoteVolume: message.data.V,
                        symbol: message.data.s,
                        priceChange: String(close - open),
                        priceChangePercent: open ? String((close - open) / open) : "0",
                    }
                    callback(newTicker);
                }
                if (type === "depth") {
                    callback({ bids: message.data.b, asks: message.data.a });
                }
                if (type === "trade") {
                    // Backpack's trade stream sends timestamps in microseconds.
                    callback({
                        id: message.data.t,
                        isBuyerMaker: message.data.m,
                        price: message.data.p,
                        quantity: message.data.q,
                        timestamp: Math.floor(message.data.T / 1000),
                    });
                }
            });
        }
    }

    subscribe(channel: string) {
        const count = this.subscriptions.get(channel) ?? 0;
        this.subscriptions.set(channel, count + 1);
        if (count === 0) {
            this.sendMessage({ method: "SUBSCRIBE", params: [channel] });
        }
    }

    unsubscribe(channel: string) {
        const count = this.subscriptions.get(channel) ?? 0;
        if (count <= 1) {
            this.subscriptions.delete(channel);
            this.sendMessage({ method: "UNSUBSCRIBE", params: [channel] });
            return;
        }
        this.subscriptions.set(channel, count - 1);
    }

    sendMessage(message: any) {
        const messageToSend = {
            ...message,
            id: this.id++
        }
        if (!this.initialized) {
            this.bufferedMessages.push(messageToSend);
            return;
        }
        this.ws.send(JSON.stringify(messageToSend));
    }

    async registerCallback(type: string, callback: Callback, id: string) {
        this.callbacks[type] = this.callbacks[type] || [];
        this.callbacks[type].push({ callback, id });
    }

    async deRegisterCallback(type: string, id: string) {
        if (this.callbacks[type]) {
            const index = this.callbacks[type].findIndex(entry => entry.id === id);
            if (index !== -1) {
                this.callbacks[type].splice(index, 1);
            }
        }
    }
}
