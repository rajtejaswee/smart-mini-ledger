import { Inbox } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { categoryIcon } from "@/lib/categories";
import { formatMoney, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function RecentTransactions({ txns }: { txns: Transaction[] }) {
  const recent = txns.slice(0, 6);

  return (
    <div className="h-full rounded-card border border-line bg-card p-6 shadow-card">
      <h3 className="eyebrow">Recent activity</h3>

      {recent.length === 0 ? (
        <div className="grid place-items-center py-12 text-center text-sm text-muted">
          <div>
            <Inbox className="mx-auto mb-2 size-6 text-line" />
            No transactions yet.
          </div>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {recent.map((t) => {
            const Icon = categoryIcon(t.category);
            const isIncome = t.type === "INCOME";
            return (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plane text-muted">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize text-ink">{t.category}</p>
                  <p className="truncate text-xs text-muted">{t.note || formatDate(t.date)}</p>
                </div>
                <span
                  className={cn(
                    "tnum shrink-0 text-sm font-semibold",
                    isIncome ? "text-income" : "text-ink"
                  )}
                >
                  {isIncome ? "+" : "−"}
                  {formatMoney(t.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
