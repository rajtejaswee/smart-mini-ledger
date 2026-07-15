import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";

// Shows a % delta with an arrow. `goodWhenUp` flips the color meaning:
// for a balance/income, up is good (green); for expenses, up is bad (red).
export function TrendBadge({
  pct,
  goodWhenUp = true,
}: {
  pct: number | null;
  goodWhenUp?: boolean;
}) {
  if (pct === null || !isFinite(pct)) return null;
  const up = pct >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-xs font-semibold",
        good ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}
