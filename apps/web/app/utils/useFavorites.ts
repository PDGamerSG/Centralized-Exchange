"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "favorite-markets";
// Every mounted list shares one set, so starring in the appbar search also
// lights the star on the markets table without a round trip through storage.
const listeners = new Set<(markets: string[]) => void>();

function read(): string[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        setFavorites(read());
        listeners.add(setFavorites);
        return () => { listeners.delete(setFavorites); };
    }, []);

    const toggle = useCallback((market: string) => {
        const next = read().includes(market)
            ? read().filter((m) => m !== market)
            : [...read(), market];
        try {
            localStorage.setItem(KEY, JSON.stringify(next));
        } catch { }
        listeners.forEach((notify) => notify(next));
    }, []);

    return { favorites, toggle, isFavorite: (market: string) => favorites.includes(market) };
}
