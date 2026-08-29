import { ReactNode } from "react";

export function Panel({ label, right, header, className = "", children }: {
    label?: string;
    right?: ReactNode;
    /** Replaces the label/right pair when a panel needs its own header row. */
    header?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    const hasHeader = Boolean(header || label || right);
    return (
        <section className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card ${className}`}>
            {hasHeader && (
                <div className="flex flex-none items-center justify-between gap-2 border-b border-border px-2 py-1.5">
                    {header ?? <>
                        {label && <p className="px-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</p>}
                        {right}
                    </>}
                </div>
            )}
            {children}
        </section>
    );
}
