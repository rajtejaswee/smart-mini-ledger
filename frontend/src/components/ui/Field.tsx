import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, icon, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "h-11 w-full rounded-input border bg-card px-3.5 text-sm text-ink",
            "placeholder:text-muted/60 transition-shadow duration-200",
            "focus:outline-none focus:ring-4",
            icon && "pl-10",
            error
              ? "border-expense focus:ring-expense/10"
              : "border-line focus:border-primary focus:ring-primary/10",
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-expense">{error}</p>}
    </div>
  );
});
