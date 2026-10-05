export const PrimaryButton = ({
  children,
  onClick,
  className = "",
}: {
  children: string;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg border border-border px-4 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-foreground/5 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};

export const SuccessButton = ({
  children,
  onClick,
  className = "",
}: {
  children: string;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 rounded-lg bg-foreground px-4 text-xs font-semibold text-background transition-opacity duration-200 hover:opacity-90 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
};
