import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Point } from "@/lib/derive";
import { formatMoney } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { BalanceAreaChart } from "@/components/charts/BalanceAreaChart";
import { TrendBadge } from "./TrendBadge";

interface MonthStat {
  value: number;
  trend: number | null;
}

export function BalanceHero({
  balance,
  series,
  trendPct,
  runwayNote,
  income,
  expense,
}: {
  balance: number;
  series: Point[];
  trendPct: number | null;
  runwayNote?: string;
  income: MonthStat;
  expense: MonthStat;
}) {
  const animated = useCountUp(balance);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-card bg-gradient-to-br from-[#0f172a] via-[#111c33] to-[#1e293b] p-6 text-white shadow-hero sm:p-7">
      {/* soft glow */}
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/25 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="eyebrow text-white/50">Total balance</p>
          <p className="tnum mt-2 text-[2.6rem] font-bold leading-none tracking-tight">
            {formatMoney(animated)}
          </p>
          {runwayNote && <p className="mt-2 text-xs text-white/55">{runwayNote}</p>}
        </div>
        <TrendBadge pct={trendPct} onDark />
      </div>

      <div className="relative mt-3 flex-1">
        {series.length > 1 ? (
          <BalanceAreaChart data={series} onDark height={120} />
        ) : (
          <div className="grid h-[120px] place-items-center rounded-chart bg-white/5 text-sm text-white/50">
            Add a few transactions to see your balance trend
          </div>
        )}
      </div>

      {/* Income / Spent this month */}
      <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
        <MiniStat
          icon={<ArrowDownLeft className="size-4" />}
          label="Income this month"
          value={income.value}
          trend={income.trend}
          goodWhenUp
          tint="text-emerald-300"
        />
        <MiniStat
          icon={<ArrowUpRight className="size-4" />}
          label="Spent this month"
          value={expense.value}
          trend={expense.trend}
          goodWhenUp={false}
          tint="text-rose-300"
        />
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  trend,
  goodWhenUp,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  trend: number | null;
  goodWhenUp: boolean;
  tint: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-white/60`}>
          <span className={tint}>{icon}</span>
          {label}
        </span>
        <TrendBadge pct={trend} goodWhenUp={goodWhenUp} onDark />
      </div>
      <p className="tnum mt-1.5 text-xl font-bold tracking-tight">{formatMoney(value)}</p>
    </div>
  );
}
