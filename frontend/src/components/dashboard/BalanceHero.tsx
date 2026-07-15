import type { Point } from "@/lib/derive";
import { formatMoney } from "@/lib/format";
import { useCountUp } from "@/hooks/useCountUp";
import { BalanceAreaChart } from "@/components/charts/BalanceAreaChart";
import { TrendBadge } from "./TrendBadge";

export function BalanceHero({
  balance,
  series,
  trendPct,
  runwayNote,
}: {
  balance: number;
  series: Point[];
  trendPct: number | null;
  runwayNote?: string;
}) {
  const animated = useCountUp(balance);

  return (
    <div className="flex h-full flex-col rounded-card border border-line bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">Total balance</p>
          <p className="tnum mt-1.5 text-4xl font-bold tracking-tight text-ink">
            {formatMoney(animated)}
          </p>
          {runwayNote && <p className="mt-1 text-xs text-muted">{runwayNote}</p>}
        </div>
        <TrendBadge pct={trendPct} />
      </div>

      <div className="mt-4 flex-1">
        {series.length > 1 ? (
          <BalanceAreaChart data={series} />
        ) : (
          <div className="grid h-[132px] place-items-center rounded-chart bg-plane text-sm text-muted">
            Add a few transactions to see your balance trend
          </div>
        )}
      </div>
    </div>
  );
}
