import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-pill transition-colors duration-200",
          "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
          "disabled:pointer-events-none disabled:opacity-50",
          checked ? "bg-primary" : "bg-white/10"
        )}
      >
        {/* Anchored left-1/top-1 so travel is measured from the track, not the static
            position; 44px track − 4 inset − 16 knob − 4 inset = 20px of travel. */}
        <span
          className={cn(
            "absolute left-1 top-1 size-4 rounded-full bg-white transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
