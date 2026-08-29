"use client";

import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";

export type Side = "buy" | "sell";
export type OrderType = "limit" | "market";

type OrderFormState = {
    side: Side;
    setSide: (side: Side) => void;
    type: OrderType;
    setType: (type: OrderType) => void;
    price: string;
    setPrice: (price: string) => void;
    quantity: string;
    setQuantity: (quantity: string) => void;
    /** Clicking a book level loads it into the form, the way every exchange does. */
    fillFromBook: (price: string, quantity?: string) => void;
};

const Context = createContext<OrderFormState | null>(null);

/* The form is rendered twice — a column on desktop, a sheet on phones — and
   the book writes into it from a third place, so the state lives above all
   of them on the trade page. */
export function OrderFormProvider({ children }: { children: ReactNode }) {
    const [side, setSide] = useState<Side>("buy");
    const [type, setType] = useState<OrderType>("limit");
    const [price, setPrice] = useState("");
    const [quantity, setQuantity] = useState("");

    const fillFromBook = useCallback((nextPrice: string, nextQuantity?: string) => {
        setType("limit");
        setPrice(nextPrice);
        if (nextQuantity) setQuantity(nextQuantity);
    }, []);

    const value = useMemo(
        () => ({ side, setSide, type, setType, price, setPrice, quantity, setQuantity, fillFromBook }),
        [side, type, price, quantity, fillFromBook]
    );

    return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useOrderForm(): OrderFormState {
    const context = useContext(Context);
    if (!context) throw new Error("useOrderForm must be used inside OrderFormProvider");
    return context;
}
