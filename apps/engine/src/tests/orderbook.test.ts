import { describe, expect, it } from "vitest";
import { Order, Orderbook } from "../trade/Orderbook";

function order(overrides: Partial<Order>): Order {
    return {
        price: 1000,
        quantity: 1,
        orderId: "1",
        filled: 0,
        side: "buy",
        userId: "1",
        ...overrides
    };
}

describe("Simple orders", () => {
    it("does not fill against an empty orderbook", () => {
        const orderbook = new Orderbook("TATA", [], [], 0, 0);

        const { fills, executedQty } = orderbook.addOrder(order({ price: 1000, quantity: 1 }));

        expect(fills.length).toBe(0);
        expect(executedQty).toBe(0);
        expect(orderbook.bids.length).toBe(1);
    });

    it("partially fills an incoming sell against a resting bid", () => {
        const orderbook = new Orderbook("TATA", [
            order({ price: 1000, quantity: 1, orderId: "1", userId: "1" })
        ], [], 0, 0);

        const { fills, executedQty } = orderbook.addOrder(
            order({ price: 1000, quantity: 2, orderId: "2", side: "sell", userId: "2" })
        );

        expect(fills.length).toBe(1);
        expect(executedQty).toBe(1);
        expect(orderbook.bids.length).toBe(0);
        expect(orderbook.asks.length).toBe(1);
    });

    it("rests the unfilled remainder of a partially filled buy", () => {
        const orderbook = new Orderbook("TATA", [
            order({ price: 999, quantity: 1, orderId: "1", userId: "1" })
        ], [
            order({ price: 1001, quantity: 1, orderId: "2", side: "sell", userId: "2" })
        ], 0, 0);

        const { fills, executedQty } = orderbook.addOrder(
            order({ price: 1001, quantity: 2, orderId: "3", userId: "3" })
        );

        expect(fills.length).toBe(1);
        expect(executedQty).toBe(1);
        expect(orderbook.bids.length).toBe(2);
        expect(orderbook.asks.length).toBe(0);
    });
});

describe("Price-time priority", () => {
    it("fills the cheapest ask first regardless of insert order", () => {
        const orderbook = new Orderbook("TATA", [], [
            order({ price: 1002, quantity: 1, orderId: "1", side: "sell", userId: "1" }),
            order({ price: 1000, quantity: 1, orderId: "2", side: "sell", userId: "2" })
        ], 0, 0);

        const { fills } = orderbook.addOrder(
            order({ price: 1002, quantity: 1, orderId: "3", userId: "3" })
        );

        expect(fills.length).toBe(1);
        expect(fills[0].price).toBe("1000");
        expect(fills[0].makerOrderId).toBe("2");
    });

    it("fills the older order first at the same price", () => {
        const orderbook = new Orderbook("TATA", [], [
            order({ price: 1000, quantity: 1, orderId: "old", side: "sell", userId: "1" }),
            order({ price: 1000, quantity: 1, orderId: "new", side: "sell", userId: "2" })
        ], 0, 0);

        const { fills } = orderbook.addOrder(
            order({ price: 1000, quantity: 1, orderId: "3", userId: "3" })
        );

        expect(fills.length).toBe(1);
        expect(fills[0].makerOrderId).toBe("old");
    });
});

describe("Cancel", () => {
    it("removes a resting bid and reports its price", () => {
        const resting = order({ price: 999, quantity: 1, orderId: "1", userId: "1" });
        const orderbook = new Orderbook("TATA", [resting], [], 0, 0);

        const price = orderbook.cancelBid(resting);

        expect(price).toBe(999);
        expect(orderbook.bids.length).toBe(0);
    });

    it("is a no-op for an unknown order id", () => {
        const resting = order({ price: 999, quantity: 1, orderId: "1", userId: "1" });
        const orderbook = new Orderbook("TATA", [resting], [], 0, 0);

        const price = orderbook.cancelBid(order({ orderId: "unknown" }));

        expect(price).toBeUndefined();
        expect(orderbook.bids.length).toBe(1);
    });
});

describe("Depth", () => {
    it("aggregates quantities at the same price level", () => {
        const orderbook = new Orderbook("TATA", [
            order({ price: 999, quantity: 1, orderId: "1", userId: "1" }),
            order({ price: 999, quantity: 2, orderId: "2", userId: "2" })
        ], [], 0, 0);

        const depth = orderbook.getDepth();

        expect(depth.bids).toEqual([["999", "3"]]);
        expect(depth.asks).toEqual([]);
    });

    it("shows remaining quantity after a partial fill", () => {
        const orderbook = new Orderbook("TATA", [], [
            order({ price: 1000, quantity: 5, orderId: "1", side: "sell", userId: "1" })
        ], 0, 0);

        orderbook.addOrder(order({ price: 1000, quantity: 2, orderId: "2", userId: "2" }));
        const depth = orderbook.getDepth();

        expect(depth.asks).toEqual([["1000", "3"]]);
    });
});

describe("Self trade prevention", () => {
    it.todo("does not fill an order against the same user's resting order");
});
