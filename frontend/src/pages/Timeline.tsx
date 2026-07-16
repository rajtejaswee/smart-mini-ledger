import { CalendarClock } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadError } from "@/components/LoadError";
import { MonthNav } from "@/components/MonthNav";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { useLedger } from "@/hooks/useLedger";
import { txnsInMonth, groupByDay } from "@/lib/month";
import { categoryIcon } from "@/lib/categories";
import { formatMoney, formatDayLabel, formatSigned } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function Timeline() {
  const { txns, loading, error, retry, load, month, prev, next, canNext } = useLedger();
  const groups = groupByDay(txnsInMonth(txns, month));

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Timeline</h1>
          <p className="text-sm text-muted">Your month, entry by entry</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav month={month} onPrev={prev} onNext={next} canNext={canNext} />
          <AddTransactionButton reload={load} />
        </div>
      </div>

      {error ? (
        <LoadError what="timeline" onRetry={retry} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-card bg-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="grid place-items-center rounded-card border border-line bg-card py-20 text-center text-sm text-muted shadow-soft">
          <div>
            <CalendarClock className="mx-auto mb-2 size-6 text-line" />
            No transactions this month.
          </div>
        </div>
      ) : (
        <div className="animate-rise">
          {groups.map((g) => (
            <section key={g.date.toISOString()} className="mb-7">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {formatDayLabel(g.date)}
                </h2>
                <span
                  className={cn(
                    "tnum text-xs font-semibold",
                    g.net >= 0 ? "text-income" : "text-expense"
                  )}
                >
                  {formatSigned(g.net)}
                </span>
              </div>

              <ol>
                {g.items.map((t, idx) => {
                  const Icon = categoryIcon(t.category);
                  const income = t.type === "INCOME";
                  const last = idx === g.items.length - 1;
                  return (
                    <li key={t.id} className="flex gap-4">
                      {/* Timeline gutter: dot + connecting line */}
                      <div className="flex w-3 flex-col items-center">
                        <span
                          className={cn(
                            "mt-4 size-3 shrink-0 rounded-full ring-4 ring-plane",
                            income ? "bg-income" : "bg-expense"
                          )}
                        />
                        {!last && <span className="w-px flex-1 bg-line" />}
                      </div>

                      <div className="mb-3 flex flex-1 items-center justify-between rounded-card border border-line bg-card px-4 py-3 shadow-soft">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plane text-muted">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium capitalize text-ink">
                              {t.category}
                            </p>
                            {t.note && <p className="truncate text-xs text-muted">{t.note}</p>}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "tnum shrink-0 text-sm font-semibold",
                            income ? "text-income" : "text-ink"
                          )}
                        >
                          {income ? "+" : "−"}
                          {formatMoney(t.amount)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
