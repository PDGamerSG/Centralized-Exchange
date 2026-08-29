import axios from "axios";
import { BASE_URL } from "./httpClient";

/* Orders only go somewhere when the UI is pointed at the local exchange.
   Against the read-only Backpack proxy there is nothing to place them on,
   so the form says so instead of pretending to submit. */
export const canPlaceOrders = Boolean(process.env.NEXT_PUBLIC_API_URL);

export type NewOrder = {
    market: string;
    price: string;
    quantity: string;
    side: "buy" | "sell";
    userId: string;
};

export async function placeOrder(order: NewOrder) {
    const response = await axios.post(`${BASE_URL}/order`, order);
    return response.data;
}
