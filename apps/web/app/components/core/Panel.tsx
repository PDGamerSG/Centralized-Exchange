import { ReactNode } from "react";

export function Panel({ label, right, className = "", children }: {
    label?: string;
    right?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card ${className}`}>
            {(label || right) && (
                <header className="flex flex-none items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
                    {right}
                </header>
            )}
            {children}
        </section>
    );
}
