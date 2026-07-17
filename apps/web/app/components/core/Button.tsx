export const PrimaryButton = ({ children, onClick }: { children: string, onClick?: () => void }) => {
    return <button
        type="button"
        onClick={onClick}
        className="h-8 rounded-full border border-border px-4 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-foreground/5 disabled:opacity-50"
    >
        {children}
    </button>
}

export const SuccessButton = ({ children, onClick }: { children: string, onClick?: () => void }) => {
    return <button
        type="button"
        onClick={onClick}
        className="h-8 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-opacity duration-300 hover:opacity-90 disabled:opacity-50"
    >
        {children}
    </button>
}
