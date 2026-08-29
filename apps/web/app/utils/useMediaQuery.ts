"use client";

import { useEffect, useState } from "react";

/* Starts false on the server and on the first client render, so anything
   gated on it must be safe to render in the "no match" state first. */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const list = window.matchMedia(query);
        const apply = () => setMatches(list.matches);
        apply();
        list.addEventListener("change", apply);
        return () => list.removeEventListener("change", apply);
    }, [query]);

    return matches;
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
