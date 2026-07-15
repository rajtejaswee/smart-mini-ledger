import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { MonthNav } from "@/components/MonthNav";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { useLedger } from "@/hooks/useLedger";
import { buildCalendar, sameDay, WEEKDAYS } from "@/lib/month";
import { categoryIcon } from "@/lib/categories";
import { formatMoney, formatMoneyCompact, formatDayLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Transaction } from "@/lib/types";

export default function CalendarPage() {
  const { txns, loading, load, month, prev, next, canNext } = useLedger();
  const [selected, setSelected] = useState<Date | null>(null);

  // Reset the selected day whenever the month changes.
  useEffect(() => setSelected(null), [month]);

  const cells = buildCalendar(month, txns);
  const maxSpend = Math.max(1, ...cells.map((c) => c.spend));
  const selectedTxns = selected
    ? txns.filter((t) => sameDay(new Date(t.date), selected))
    : [];

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Calendar</h1>
          <p className="text-sm text-muted">Daily spending at a glance — darker means more spent</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav month={month} onPrev={prev} onNext={next} canNext={canNext} />
          <AddTransactionButton reload={load} />
        </div>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-card bg-card" />
      ) : (
        <div className="grid animate-rise gap-5 lg:grid-cols-3">
          {/* Heatmap grid */}
          <div className="rounded-card border border-line bg-white p-4 shadow-soft sm:p-6 lg:col-span-2">
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map((d) => (
                <div key={d} className="pb-2 text-center text-xs font-semibold text-muted">
                  {d}
                </div>
              ))}

              {cells.map((c, i) => {
                if (!c.date) return <div key={`blank-${i}`} />;
                const intensity = c.spend / maxSpend;
                const hot = intensity > 0.5;
                const isToday = sameDay(c.date, new Date());
                const isSel = selected != null && sameDay(c.date, selected);
                const day = c.date.getDate();
                return (
                  <button
                    key={c.date.toISOString()}
                    type="button"
                    onClick={() => setSelected(c.date)}
                    style={{
                      backgroundColor:
                        c.spend > 0
                          ? `color-mix(in srgb, var(--color-expense) ${Math.round(
                              12 + 70 * intensity
                            )}%, white)`
                          : undefined,
                    }}
                    className={cn(
                      "relative flex aspect-square flex-col rounded-[12px] border p-1.5 text-left transition-transform duration-150 hover:scale-[1.04]",
                      c.spend > 0 ? "border-transparent" : "border-line bg-white",
                      isSel && "ring-2 ring-primary ring-offset-1",
                      isToday && !isSel && "ring-1 ring-primary/40"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        hot ? "text-white" : isToday ? "text-primary" : "text-ink"
                      )}
                    >
                      {day}
                    </span>
                    {c.spend > 0 && (
                      <span
                        className={cn(
                          "mt-auto truncate text-[10px] font-medium",
                          hot ? "text-white/90" : "text-muted"
                        )}
                      >
                        {formatMoneyCompact(c.spend)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail */}
          <DayPanel date={selected} txns={selectedTxns} />
        </div>
      )}
    </AppLayout>
  );
}

function DayPanel({ date, txns }: { date: Date | null; txns: Transaction[] }) {
  const spent = txns
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="rounded-card border border-line bg-white p-6 shadow-soft">
      {!date ? (
        <div className="grid place-items-center py-16 text-center text-sm text-muted">
          <div>
            <CalendarDays className="mx-auto mb-2 size-6 text-line" />
            Select a day to see its transactions.
          </div>
        </div>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-ink">{formatDayLabel(date)}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {txns.length === 0
              ? "No transactions"
              : `${txns.length} transaction${txns.length > 1 ? "s" : ""} · ${formatMoney(spent)} spent`}
          </p>

          {txns.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {txns.map((t) => {
                const Icon = categoryIcon(t.category);
                const income = t.type === "INCOME";
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plane text-muted">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium capitalize text-ink">
                        {t.category}
                      </p>
                      {t.note && <p className="truncate text-xs text-muted">{t.note}</p>}
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
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
