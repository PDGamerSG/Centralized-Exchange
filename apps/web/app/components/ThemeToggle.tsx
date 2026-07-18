"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
    const [light, setLight] = useState(false);

    useEffect(() => {
        setLight(document.documentElement.classList.contains("light"));
    }, []);

    const toggle = () => {
        const next = !light;
        setLight(next);
        document.documentElement.classList.toggle("light", next);
        localStorage.setItem("theme", next ? "light" : "dark");
        window.dispatchEvent(new Event("themechange"));
    };

    return <button
        type="button"
        aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground"
    >
        {light
            ? <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            : <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>}
    </button>;
}
