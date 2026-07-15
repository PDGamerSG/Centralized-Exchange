import { describe, expect, it, vi } from "vitest";
import { Engine } from "../trade/Engine";
import { CREATE_ORDER } from "../types/fromApi";

vi.mock("../RedisManager", () => ({
    RedisManager: {
        getInstance: () => ({
            publishMessage: vi.fn(),
            sendToApi: vi.fn(),
            pushMessage: vi.fn()
        })
    }
}));

describe("Engine", () => {
    it("publishes trade updates for every created order", () => {
        const engine = new Engine();
        const publishSpy = vi.spyOn(engine, "publishWsTrades");

        engine.process({
            message: {
                type: CREATE_ORDER,
                data: { market: "TATA_INR", price: "1000", quantity: "1", side: "buy", userId: "1" }
            },
            clientId: "1"
        });

        engine.process({
            message: {
                type: CREATE_ORDER,
                data: { market: "TATA_INR", price: "1001", quantity: "1", side: "sell", userId: "2" }
            },
            clientId: "1"
        });

        expect(publishSpy).toHaveBeenCalledTimes(2);
    });

    it("matches crossing orders and reports the fill", () => {
        const engine = new Engine();

        engine.process({
            message: {
                type: CREATE_ORDER,
                data: { market: "TATA_INR", price: "1000", quantity: "1", side: "sell", userId: "1" }
            },
            clientId: "1"
        });

        const { executedQty, fills } = engine.createOrder("TATA_INR", "1000", "1", "buy", "2");

        expect(executedQty).toBe(1);
        expect(fills.length).toBe(1);
        expect(fills[0].price).toBe("1000");
        expect(fills[0].otherUserId).toBe("1");
    });
});
