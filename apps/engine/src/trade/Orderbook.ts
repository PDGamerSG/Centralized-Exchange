import { BASE_CURRENCY } from "./Engine";

export interface Order {
    price: number;
    quantity: number;
    orderId: string;
    filled: number;
    side: "buy" | "sell";
    userId: string;
}

export interface Fill {
    price: string;
    qty: number;
    tradeId: number;
    otherUserId: string;
    makerOrderId: string;
}

export class Orderbook {
    bids: Order[];
    asks: Order[];
    baseAsset: string;
    quoteAsset: string = BASE_CURRENCY;
    lastTradeId: number;
    currentPrice: number;

    constructor(baseAsset: string, bids: Order[], asks: Order[], lastTradeId: number, currentPrice: number) {
        this.bids = bids;
        this.asks = asks;
        this.baseAsset = baseAsset;
        this.lastTradeId = lastTradeId || 0;
        this.currentPrice = currentPrice || 0;
    }

    ticker() {
        return `${this.baseAsset}_${this.quoteAsset}`;
    }

    getSnapshot() {
        return {
            baseAsset: this.baseAsset,
            bids: this.bids,
            asks: this.asks,
            lastTradeId: this.lastTradeId,
            currentPrice: this.currentPrice
        };
    }

    // TODO: self-trade prevention — an order can still fill against the same user's resting order
    addOrder(order: Order): { executedQty: number, fills: Fill[] } {
        const { executedQty, fills } = order.side === "buy"
            ? this.matchBid(order)
            : this.matchAsk(order);

        order.filled = executedQty;

        if (executedQty < order.quantity) {
            if (order.side === "buy") {
                this.bids.push(order);
            } else {
                this.asks.push(order);
            }
        }

        return { executedQty, fills };
    }

    private matchBid(order: Order): { fills: Fill[], executedQty: number } {
        // Best (lowest) ask first; equal prices keep insertion order, so older orders fill first
        this.asks.sort((a, b) => a.price - b.price);

        const fills: Fill[] = [];
        let executedQty = 0;

        for (const ask of this.asks) {
            if (ask.price > order.price || executedQty === order.quantity) {
                break;
            }
            const filledQty = Math.min(order.quantity - executedQty, ask.quantity - ask.filled);
            if (filledQty <= 0) {
                continue;
            }
            executedQty += filledQty;
            ask.filled += filledQty;
            fills.push({
                price: ask.price.toString(),
                qty: filledQty,
                tradeId: this.lastTradeId++,
                otherUserId: ask.userId,
                makerOrderId: ask.orderId
            });
        }

        this.asks = this.asks.filter(ask => ask.filled < ask.quantity);
        return { fills, executedQty };
    }

    private matchAsk(order: Order): { fills: Fill[], executedQty: number } {
        // Best (highest) bid first; equal prices keep insertion order, so older orders fill first
        this.bids.sort((a, b) => b.price - a.price);

        const fills: Fill[] = [];
        let executedQty = 0;

        for (const bid of this.bids) {
            if (bid.price < order.price || executedQty === order.quantity) {
                break;
            }
            const filledQty = Math.min(order.quantity - executedQty, bid.quantity - bid.filled);
            if (filledQty <= 0) {
                continue;
            }
            executedQty += filledQty;
            bid.filled += filledQty;
            fills.push({
                price: bid.price.toString(),
                qty: filledQty,
                tradeId: this.lastTradeId++,
                otherUserId: bid.userId,
                makerOrderId: bid.orderId
            });
        }

        this.bids = this.bids.filter(bid => bid.filled < bid.quantity);
        return { fills, executedQty };
    }

    getDepth() {
        const bidLevels: { [price: string]: number } = {};
        const askLevels: { [price: string]: number } = {};

        for (const order of this.bids) {
            bidLevels[order.price] = (bidLevels[order.price] || 0) + (order.quantity - order.filled);
        }

        for (const order of this.asks) {
            askLevels[order.price] = (askLevels[order.price] || 0) + (order.quantity - order.filled);
        }

        const bids = Object.entries(bidLevels).map(([price, quantity]): [string, string] => [price, quantity.toString()]);
        const asks = Object.entries(askLevels).map(([price, quantity]): [string, string] => [price, quantity.toString()]);

        return { bids, asks };
    }

    getOpenOrders(userId: string): Order[] {
        const asks = this.asks.filter(order => order.userId === userId);
        const bids = this.bids.filter(order => order.userId === userId);
        return [...asks, ...bids];
    }

    cancelBid(order: Order) {
        const index = this.bids.findIndex(bid => bid.orderId === order.orderId);
        if (index !== -1) {
            const price = this.bids[index].price;
            this.bids.splice(index, 1);
            return price;
        }
    }

    cancelAsk(order: Order) {
        const index = this.asks.findIndex(ask => ask.orderId === order.orderId);
        if (index !== -1) {
            const price = this.asks[index].price;
            this.asks.splice(index, 1);
            return price;
        }
    }
}
