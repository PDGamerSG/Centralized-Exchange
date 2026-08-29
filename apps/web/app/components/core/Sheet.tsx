"use client";

import { ReactNode, useEffect } from "react";

/* Bottom sheet for phones: the pattern every exchange app uses to keep the
   order form one thumb-tap away without stealing space from the chart. */
export function Sheet({ open, onClose, title, children }: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        // Freeze the page behind the sheet so a scroll gesture stays inside it.
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = previous;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden">
            <div className="animate-fade absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="animate-rise relative max-h-[88dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-elevated pb-[env(safe-area-inset-bottom)] shadow-2xl thin-scrollbar"
            >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-elevated px-4 py-3">
                    <p className="text-sm font-semibold">{title}</p>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}
