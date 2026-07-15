import fs from "fs";
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types";
import { CANCEL_ORDER, CREATE_ORDER, GET_DEPTH, GET_OPEN_ORDERS, MessageFromApi, ON_RAMP } from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";

// TODO: use a decimal library instead of floats for money math
export const BASE_CURRENCY = "INR";

interface UserBalance {
    [asset: string]: {
        available: number;
        locked: number;
    }
}

const SNAPSHOT_FILE = "./snapshot.json";
const SNAPSHOT_INTERVAL_MS = 3000;
const SEED_USER_IDS = ["1", "2", "5"];

export class Engine {
    private orderbooks: Orderbook[] = [];
    private balances: Map<string, UserBalance> = new Map();

    constructor() {
        let snapshot: Buffer | null = null;
        try {
            if (process.env.WITH_SNAPSHOT) {
                snapshot = fs.readFileSync(SNAPSHOT_FILE);
            }
        } catch (e) {
            console.log("No snapshot found, starting fresh");
        }

        if (snapshot) {
            const saved = JSON.parse(snapshot.toString());
            this.orderbooks = saved.orderbooks.map((o: any) =>
                new Orderbook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
            this.balances = new Map(saved.balances);
        } else {
            this.orderbooks = [new Orderbook("TATA", [], [], 0, 0)];
            this.setBaseBalances();
        }

        setInterval(() => this.saveSnapshot(), SNAPSHOT_INTERVAL_MS).unref();
    }

    saveSnapshot() {
        const snapshot = {
            orderbooks: this.orderbooks.map(o => o.getSnapshot()),
            balances: Array.from(this.balances.entries())
        };
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot));
    }

    process({ message, clientId }: { message: MessageFromApi, clientId: string }) {
        switch (message.type) {
            case CREATE_ORDER:
                try {
                    const { market, price, quantity, side, userId } = message.data;
                    const { executedQty, fills, orderId } = this.createOrder(market, price, quantity, side, userId);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_PLACED",
                        payload: { orderId, executedQty, fills }
                    });
                } catch (e) {
                    console.log("Error while creating order", e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: { orderId: "", executedQty: 0, remainingQty: 0 }
                    });
                }
                break;
            case CANCEL_ORDER:
                try {
                    this.cancelOrder(message.data.orderId, message.data.market);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "ORDER_CANCELLED",
                        payload: { orderId: message.data.orderId, executedQty: 0, remainingQty: 0 }
                    });
                } catch (e) {
                    console.log("Error while cancelling order", e);
                }
                break;
            case GET_OPEN_ORDERS:
                try {
                    const orderbook = this.getOrderbook(message.data.market);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "OPEN_ORDERS",
                        payload: orderbook.getOpenOrders(message.data.userId)
                    });
                } catch (e) {
                    console.log("Error while fetching open orders", e);
                }
                break;
            case ON_RAMP:
                this.onRamp(message.data.userId, Number(message.data.amount));
                break;
            case GET_DEPTH:
                try {
                    const orderbook = this.getOrderbook(message.data.market);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: orderbook.getDepth()
                    });
                } catch (e) {
                    console.log("Error while fetching depth", e);
                    RedisManager.getInstance().sendToApi(clientId, {
                        type: "DEPTH",
                        payload: { bids: [], asks: [] }
                    });
                }
                break;
        }
    }

    addOrderbook(orderbook: Orderbook) {
        this.orderbooks.push(orderbook);
    }

    createOrder(market: string, price: string, quantity: string, side: "buy" | "sell", userId: string) {
        const orderbook = this.getOrderbook(market);
        const [baseAsset, quoteAsset] = market.split("_");

        this.checkAndLockFunds(baseAsset, quoteAsset, side, userId, price, quantity);

        const order: Order = {
            price: Number(price),
            quantity: Number(quantity),
            orderId: this.generateOrderId(),
            filled: 0,
            side,
            userId
        };

        const { fills, executedQty } = orderbook.addOrder(order);
        this.updateBalance(userId, baseAsset, quoteAsset, side, fills);

        this.createDbTrades(fills, market, userId);
        this.updateDbOrders(order, executedQty, fills, market);
        this.publishWsDepthUpdates(fills, price, side, market);
        this.publishWsTrades(fills, userId, market);

        return { executedQty, fills, orderId: order.orderId };
    }

    cancelOrder(orderId: string, market: string) {
        const orderbook = this.getOrderbook(market);
        const baseAsset = market.split("_")[0];

        const order = orderbook.asks.find(o => o.orderId === orderId)
            || orderbook.bids.find(o => o.orderId === orderId);
        if (!order) {
            throw new Error(`No open order found with id ${orderId}`);
        }

        if (order.side === "buy") {
            const price = orderbook.cancelBid(order);
            const lockedQuote = (order.quantity - order.filled) * order.price;
            const balance = this.assetBalance(order.userId, BASE_CURRENCY);
            balance.available += lockedQuote;
            balance.locked -= lockedQuote;
            if (price) {
                this.sendUpdatedDepthAt(price.toString(), market);
            }
        } else {
            const price = orderbook.cancelAsk(order);
            const lockedBase = order.quantity - order.filled;
            const balance = this.assetBalance(order.userId, baseAsset);
            balance.available += lockedBase;
            balance.locked -= lockedBase;
            if (price) {
                this.sendUpdatedDepthAt(price.toString(), market);
            }
        }
    }

    updateDbOrders(order: Order, executedQty: number, fills: Fill[], market: string) {
        RedisManager.getInstance().pushMessage({
            type: ORDER_UPDATE,
            data: {
                orderId: order.orderId,
                executedQty: executedQty,
                market: market,
                price: order.price.toString(),
                quantity: order.quantity.toString(),
                side: order.side,
            }
        });

        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: ORDER_UPDATE,
                data: {
                    orderId: fill.makerOrderId,
                    executedQty: fill.qty
                }
            });
        });
    }

    createDbTrades(fills: Fill[], market: string, userId: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().pushMessage({
                type: TRADE_ADDED,
                data: {
                    market: market,
                    id: fill.tradeId.toString(),
                    isBuyerMaker: fill.otherUserId === userId,
                    price: fill.price,
                    quantity: fill.qty.toString(),
                    quoteQuantity: (fill.qty * Number(fill.price)).toString(),
                    timestamp: Date.now()
                }
            });
        });
    }

    publishWsTrades(fills: Fill[], userId: string, market: string) {
        fills.forEach(fill => {
            RedisManager.getInstance().publishMessage(`trade@${market}`, {
                stream: `trade@${market}`,
                data: {
                    e: "trade",
                    t: fill.tradeId,
                    m: fill.otherUserId === userId,
                    p: fill.price,
                    q: fill.qty.toString(),
                    s: market,
                }
            });
        });
    }

    sendUpdatedDepthAt(price: string, market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const updatedBids = depth.bids.filter(x => x[0] === price);
        const updatedAsks = depth.asks.filter(x => x[0] === price);

        RedisManager.getInstance().publishMessage(`depth@${market}`, {
            stream: `depth@${market}`,
            data: {
                a: updatedAsks.length ? updatedAsks : [[price, "0"]],
                b: updatedBids.length ? updatedBids : [[price, "0"]],
                e: "depth"
            }
        });
    }

    publishWsDepthUpdates(fills: Fill[], price: string, side: "buy" | "sell", market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            return;
        }
        const depth = orderbook.getDepth();
        const fillPrices = fills.map(fill => fill.price);

        if (side === "buy") {
            const updatedAsks = depth.asks.filter(x => fillPrices.includes(x[0]));
            const updatedBid = depth.bids.find(x => x[0] === price);
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updatedAsks,
                    b: updatedBid ? [updatedBid] : [],
                    e: "depth"
                }
            });
        } else {
            const updatedBids = depth.bids.filter(x => fillPrices.includes(x[0]));
            const updatedAsk = depth.asks.find(x => x[0] === price);
            RedisManager.getInstance().publishMessage(`depth@${market}`, {
                stream: `depth@${market}`,
                data: {
                    a: updatedAsk ? [updatedAsk] : [],
                    b: updatedBids,
                    e: "depth"
                }
            });
        }
    }

    updateBalance(userId: string, baseAsset: string, quoteAsset: string, side: "buy" | "sell", fills: Fill[]) {
        for (const fill of fills) {
            const quoteAmount = fill.qty * Number(fill.price);
            const takerQuote = this.assetBalance(userId, quoteAsset);
            const takerBase = this.assetBalance(userId, baseAsset);
            const makerQuote = this.assetBalance(fill.otherUserId, quoteAsset);
            const makerBase = this.assetBalance(fill.otherUserId, baseAsset);

            if (side === "buy") {
                makerQuote.available += quoteAmount;
                takerQuote.locked -= quoteAmount;
                makerBase.locked -= fill.qty;
                takerBase.available += fill.qty;
            } else {
                makerQuote.locked -= quoteAmount;
                takerQuote.available += quoteAmount;
                makerBase.available += fill.qty;
                takerBase.locked -= fill.qty;
            }
        }
    }

    checkAndLockFunds(baseAsset: string, quoteAsset: string, side: "buy" | "sell", userId: string, price: string, quantity: string) {
        const asset = side === "buy" ? quoteAsset : baseAsset;
        const required = side === "buy" ? Number(quantity) * Number(price) : Number(quantity);
        const balance = this.assetBalance(userId, asset);

        if (balance.available < required) {
            throw new Error("Insufficient funds");
        }
        balance.available -= required;
        balance.locked += required;
    }

    onRamp(userId: string, amount: number) {
        this.assetBalance(userId, BASE_CURRENCY).available += amount;
    }

    private getOrderbook(market: string) {
        const orderbook = this.orderbooks.find(o => o.ticker() === market);
        if (!orderbook) {
            throw new Error(`No orderbook found for market ${market}`);
        }
        return orderbook;
    }

    private assetBalance(userId: string, asset: string) {
        let userBalance = this.balances.get(userId);
        if (!userBalance) {
            userBalance = {};
            this.balances.set(userId, userBalance);
        }
        if (!userBalance[asset]) {
            userBalance[asset] = { available: 0, locked: 0 };
        }
        return userBalance[asset];
    }

    private generateOrderId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    private setBaseBalances() {
        for (const userId of SEED_USER_IDS) {
            this.balances.set(userId, {
                [BASE_CURRENCY]: { available: 10_000_000, locked: 0 },
                TATA: { available: 10_000_000, locked: 0 }
            });
        }
    }
}
