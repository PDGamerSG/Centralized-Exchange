"use client";

export type TabOption<T extends string> = { value: T; label: string; activeClass?: string };

export function Tabs<T extends string>({ options, value, onChange, size = "sm", className = "" }: {
    options: readonly TabOption<T>[];
    value: T;
    onChange: (value: T) => void;
    size?: "sm" | "md";
    className?: string;
}) {
    // Taller on touch screens, back to the compact desktop height at lg.
    const sizing = size === "md" ? "py-2 text-sm font-semibold lg:py-1.5" : "py-1.5 text-xs font-medium lg:py-1";
    return (
        <div className={`grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-foreground/5 p-1 ${className}`}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`rounded-full text-center transition-colors duration-300 ${sizing} ${active
                            ? option.activeClass ?? "bg-foreground/10 text-foreground"
                            : "text-muted-foreground hover:text-foreground"}`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
