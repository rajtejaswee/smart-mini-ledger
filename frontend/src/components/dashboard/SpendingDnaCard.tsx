import { PieChart } from "lucide-react";
import type { CategorySlice } from "@/lib/derive";
import { sliceColor } from "@/lib/categories";
import { formatMoneyCompact } from "@/lib/format";
import { SpendingDonut } from "@/components/charts/SpendingDonut";

export function SpendingDnaCard({
  slices,
  total,
}: {
  slices: CategorySlice[];
  total: number;
}) {
  const top = slices[0];
  const insight = top
    ? `${top.category} is your biggest category at ${top.pct.toFixed(0)}% of spending.`
    : "No expenses recorded yet.";

  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-white p-6 shadow-card">
      <h3 className="eyebrow">Spending DNA</h3>

      {slices.length === 0 ? (
        <div className="grid flex-1 place-items-center py-10 text-center text-sm text-muted">
          <div>
            <PieChart className="mx-auto mb-2 size-6 text-line" />
            Your category breakdown will appear here.
          </div>
        </div>
      ) : (
        <>
          <div className="relative mt-2">
            <SpendingDonut slices={slices} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-[11px] font-medium text-muted">Spent</p>
                <p className="tnum text-lg font-bold text-ink">{formatMoneyCompact(total)}</p>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {slices.map((s, i) => (
              <li key={s.category} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: sliceColor(i, s.category) }}
                  />
                  <span className="capitalize text-ink">{s.category}</span>
                </span>
                <span className="tnum font-medium text-muted">{s.pct.toFixed(0)}%</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 rounded-input bg-plane px-3 py-2 text-xs leading-relaxed text-muted">
            {insight}
          </p>
        </>
      )}
    </div>
  );
}
