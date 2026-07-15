import type { Replay } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "income" | "expense";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-muted">{label}</dt>
      <dd
        className={cn(
          "tnum text-sm font-semibold",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
          !tone && "text-ink"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function MonthlyReplayCard({ replay }: { replay: Replay }) {
  const biggest = replay.biggestExpense;
  const savingsRate =
    replay.earned > 0 ? Math.max(0, (replay.earned - replay.spent) / replay.earned) : 0;

  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-white p-6 shadow-card">
      <h3 className="eyebrow">This month</h3>
      <dl className="mt-4 space-y-3.5">
        <Row label="Earned" value={formatMoney(replay.earned)} tone="income" />
        <Row label="Spent" value={formatMoney(replay.spent)} tone="expense" />
        <Row
          label="Biggest expense"
          value={biggest ? `${biggest.category} · ${formatMoney(biggest.amount)}` : "—"}
        />
        <Row
          label="Top category"
          value={replay.topCategory ? `${replay.topCategory.category} · ${replay.topCategory.count}×` : "—"}
        />
        <Row label="Avg / day" value={formatMoney(replay.avgDailySpend)} />
      </dl>

      {/* Savings rate */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Savings rate</span>
          <span className="tnum font-semibold text-ink">{Math.round(savingsRate * 100)}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-pill bg-plane">
          <div
            className="h-full rounded-pill bg-income transition-[width] duration-500"
            style={{ width: `${Math.round(savingsRate * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
