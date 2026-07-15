import { Ticker } from "./types";

// export const BASE_URL = "wss://ws.backpack.exchange/"
export const BASE_URL = "ws://localhost:3001";

type Callback = (data: any) => void;
type CallbackEntry = { callback: Callback, id: string };

export class SignalingManager {
    private static instance: SignalingManager;
    private ws: WebSocket;
    private bufferedMessages: any[] = [];
    private callbacks: { [type: string]: CallbackEntry[] } = {};
    private id: number;
    private initialized: boolean = false;

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
            const type = message.data.e;
            if (!this.callbacks[type]) {
                return;
            }
            this.callbacks[type].forEach(({ callback }) => {
                if (type === "ticker") {
                    const newTicker: Partial<Ticker> = {
                        lastPrice: message.data.c,
                        high: message.data.h,
                        low: message.data.l,
                        volume: message.data.v,
                        quoteVolume: message.data.V,
                        symbol: message.data.s,
                    }
                    callback(newTicker);
                }
                if (type === "depth") {
                    callback({ bids: message.data.b, asks: message.data.a });
                }
            });
        }
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
