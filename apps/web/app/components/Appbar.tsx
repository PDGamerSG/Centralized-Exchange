"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton, SuccessButton } from "./core/Button"
import { ThemeToggle } from "./ThemeToggle";

const links = [
    { label: "Markets", href: "/markets", section: "/markets" },
    { label: "Trade", href: "/trade/SOL_USDC", section: "/trade" },
];

export const Appbar = () => {
    const route = usePathname();
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false);

    // Tapping a link in the sheet navigates, so the sheet closes with the route.
    useEffect(() => {
        setMenuOpen(false);
    }, [route]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenuOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const linkClass = (active: boolean) =>
        `cursor-pointer text-sm transition-colors duration-300 ${active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`;

    return <header className="relative z-50 border-b border-border bg-card">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-6 lg:gap-8">
                <button type="button" className="flex flex-none cursor-pointer items-center gap-2" onClick={() => router.push('/')}>
                    <Image src="/logo.png" alt="" width={28} height={28} priority className="h-7 w-7" />
                    <span className="text-lg font-extrabold tracking-tighter sm:text-xl">OpenExchange</span>
                </button>
                <nav className="hidden items-center gap-6 sm:flex">
                    {links.map(({ label, href, section }) => (
                        <button key={label} type="button" className={linkClass(route.startsWith(section))} onClick={() => router.push(href)}>
                            {label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex flex-none items-center gap-2">
                <ThemeToggle />
                <div className="hidden items-center gap-2 sm:flex">
                    <SuccessButton>Deposit</SuccessButton>
                    <PrimaryButton>Withdraw</PrimaryButton>
                </div>
                <button
                    type="button"
                    aria-label={menuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((open) => !open)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:bg-foreground/5 hover:text-foreground sm:hidden"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {menuOpen
                            ? <path d="M18 6 6 18M6 6l12 12" />
                            : <path d="M3 6h18M3 12h18M3 18h18" />}
                    </svg>
                </button>
            </div>
        </div>

        {menuOpen && <>
            <div className="fixed inset-0 top-14 bg-background/60 sm:hidden" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-border bg-card p-3 shadow-xl sm:hidden">
                <nav className="flex flex-col">
                    {links.map(({ label, href, section }) => {
                        const active = route.startsWith(section);
                        return (
                            <button
                                key={label}
                                type="button"
                                onClick={() => router.push(href)}
                                className={`flex h-11 items-center rounded-lg px-3 text-left text-sm transition-colors duration-300 ${active ? "bg-foreground/5 font-medium text-foreground" : "text-muted-foreground"}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </nav>
                <div className="mt-1 grid grid-cols-2 gap-2">
                    <SuccessButton className="h-11 w-full">Deposit</SuccessButton>
                    <PrimaryButton className="h-11 w-full">Withdraw</PrimaryButton>
                </div>
            </div>
        </>}
    </header>
}
