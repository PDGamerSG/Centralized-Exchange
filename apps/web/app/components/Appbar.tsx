"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { PrimaryButton, SuccessButton } from "./core/Button"
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export const Appbar = () => {
    const route = usePathname();
    const router = useRouter()

    const linkClass = (active: boolean) =>
        `cursor-pointer text-sm transition-colors duration-300 ${active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}`;

    return <header className="border-b border-border">
        <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-8">
                <div className="flex cursor-pointer items-center gap-2" onClick={() => router.push('/')}>
                    <Image src="/logo.png" alt="OpenExchange" width={28} height={28} priority />
                    <span className="text-xl font-extrabold tracking-tighter">OpenExchange</span>
                    <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up"></span>
                        live
                    </span>
                </div>
                <nav className="flex items-center gap-6">
                    <span className={linkClass(route.startsWith('/markets'))} onClick={() => router.push('/markets')}>
                        Markets
                    </span>
                    <span className={linkClass(route.startsWith('/trade'))} onClick={() => router.push('/trade/SOL_USDC')}>
                        Trade
                    </span>
                </nav>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <SuccessButton>Deposit</SuccessButton>
                <PrimaryButton>Withdraw</PrimaryButton>
            </div>
        </div>
    </header>
}
