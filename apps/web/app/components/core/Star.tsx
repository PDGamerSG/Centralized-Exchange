"use client";

export function Star({ active, onToggle, label, className = "" }: {
    active: boolean;
    onToggle: () => void;
    label: string;
    className?: string;
}) {
    return (
        <button
            type="button"
            aria-label={active ? `Remove ${label} from favourites` : `Add ${label} to favourites`}
            aria-pressed={active}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(); }}
            className={`flex h-7 w-7 flex-none items-center justify-center rounded-full transition-colors duration-200 hover:bg-foreground/5 ${active ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"} ${className}`}
        >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.8l6.5-.9z" />
            </svg>
        </button>
    );
}
