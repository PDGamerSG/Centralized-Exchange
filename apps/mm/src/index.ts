import axios from "axios";

const BASE_URL = process.env.API_URL || "http://localhost:3000";
const MARKET = "TATA_INR";
const USER_ID = "5";
const TOTAL_BIDS = 15;
const TOTAL_ASKS = 15;

interface OpenOrder {
    orderId: string;
    price: string;
    side: "buy" | "sell";
}

async function main() {
    const price = 1000 + Math.random() * 10;
    const openOrders = await axios.get<OpenOrder[]>(
        `${BASE_URL}/api/v1/order/open?userId=${USER_ID}&market=${MARKET}`);

    const totalBids = openOrders.data.filter(o => o.side === "buy").length;
    const totalAsks = openOrders.data.filter(o => o.side === "sell").length;

    const cancelledBids = await cancelBidsAbove(openOrders.data, price);
    const cancelledAsks = await cancelAsksBelow(openOrders.data, price);

    let bidsToAdd = TOTAL_BIDS - totalBids - cancelledBids;
    let asksToAdd = TOTAL_ASKS - totalAsks - cancelledAsks;

    while (bidsToAdd > 0 || asksToAdd > 0) {
        if (bidsToAdd > 0) {
            await placeOrder("buy", (price - Math.random()).toFixed(1));
            bidsToAdd--;
        }
        if (asksToAdd > 0) {
            await placeOrder("sell", (price + Math.random()).toFixed(1));
            asksToAdd--;
        }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    main();
}

async function placeOrder(side: "buy" | "sell", price: string) {
    await axios.post(`${BASE_URL}/api/v1/order`, {
        market: MARKET,
        price,
        quantity: "1",
        side,
        userId: USER_ID
    });
}

async function cancelOrder(orderId: string) {
    return axios.delete(`${BASE_URL}/api/v1/order`, {
        data: { orderId, market: MARKET }
    });
}

// Cancels bids priced above the target (plus a random 10% of the rest) so the book keeps moving
async function cancelBidsAbove(openOrders: OpenOrder[], price: number) {
    const toCancel = openOrders.filter(o =>
        o.side === "buy" && (Number(o.price) > price || Math.random() < 0.1));
    await Promise.all(toCancel.map(o => cancelOrder(o.orderId)));
    return toCancel.length;
}

// Cancels asks priced below the target (plus a random 50% of the rest)
async function cancelAsksBelow(openOrders: OpenOrder[], price: number) {
    const toCancel = openOrders.filter(o =>
        o.side === "sell" && (Number(o.price) < price || Math.random() < 0.5));
    await Promise.all(toCancel.map(o => cancelOrder(o.orderId)));
    return toCancel.length;
}

main();
