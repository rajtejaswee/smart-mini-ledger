import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Summary, Transaction, Burn, Replay } from "@/lib/types";
import { formatMoney, formatMoneyCompact, formatDateLong } from "@/lib/format";
import { runningBalanceSeries, categoryBreakdown, pctChange } from "@/lib/derive";
import { AppLayout } from "@/components/AppLayout";
import { BalanceHero } from "@/components/dashboard/BalanceHero";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TrendBadge } from "@/components/dashboard/TrendBadge";
import { SpendingDnaCard } from "@/components/dashboard/SpendingDnaCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { MonthlyReplayCard } from "@/components/dashboard/MonthlyReplayCard";

interface DashboardData {
  summary: Summary;
  txns: Transaction[];
  burn: Burn;
  replay: Replay;
  prevReplay: Replay;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function prevMonthKey(): string {
  const now = new Date();
  const p = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, "0")}`;
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="h-52 animate-pulse rounded-card bg-card lg:col-span-2" />
      <div className="h-[26rem] animate-pulse rounded-card bg-card lg:row-span-2" />
      <div className="h-32 animate-pulse rounded-card bg-card" />
      <div className="h-32 animate-pulse rounded-card bg-card" />
      <div className="h-64 animate-pulse rounded-card bg-card lg:col-span-2" />
      <div className="h-64 animate-pulse rounded-card bg-card" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ summary: Summary }>("/transactions/summary"),
      api.get<{ transactions: Transaction[] }>("/transactions"),
      api.get<Burn>("/insights/burn"),
      api.get<Replay>("/insights/replay"),
      api.get<Replay>(`/insights/replay?month=${prevMonthKey()}`),
    ])
      .then(([s, t, b, r, pr]) =>
        setData({
          summary: s.data.summary,
          txns: t.data.transactions,
          burn: b.data,
          replay: r.data,
          prevReplay: pr.data,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-rise">
        <div>
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {user?.name?.split(" ")[0]}
          </h1>
        </div>
        <p className="text-sm text-muted">{formatDateLong(new Date().toISOString())}</p>
      </div>

      {loading || !data ? (
        <GridSkeleton />
      ) : (
        <DashboardGrid data={data} />
      )}
    </AppLayout>
  );
}

function DashboardGrid({ data }: { data: DashboardData }) {
  const { summary, txns, burn, replay, prevReplay } = data;

  const series = runningBalanceSeries(txns);
  const { slices, total } = categoryBreakdown(txns);

  // This month's net change → last month's ending balance → % trend.
  const monthNet = replay.earned - replay.spent;
  const balanceTrend = pctChange(summary.balance, summary.balance - monthNet);
  const incomeTrend = pctChange(replay.earned, prevReplay.earned);
  const expenseTrend = pctChange(replay.spent, prevReplay.spent);

  const runwayNote =
    burn.daysRemaining != null
      ? `At ${formatMoneyCompact(burn.burnRatePerDay)}/day, funds last ~${burn.daysRemaining} days`
      : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 animate-rise lg:grid-cols-3">
      <div className="lg:col-span-2">
        <BalanceHero
          balance={summary.balance}
          series={series}
          trendPct={balanceTrend}
          runwayNote={runwayNote}
        />
      </div>

      <div className="lg:row-span-2">
        <SpendingDnaCard slices={slices} total={total} />
      </div>

      <KpiCard
        icon={ArrowDownLeft}
        label="Income this month"
        value={formatMoney(replay.earned)}
        tone="income"
        trend={<TrendBadge pct={incomeTrend} goodWhenUp />}
      />
      <KpiCard
        icon={ArrowUpRight}
        label="Spent this month"
        value={formatMoney(replay.spent)}
        tone="expense"
        trend={<TrendBadge pct={expenseTrend} goodWhenUp={false} />}
      />

      <div className="lg:col-span-2">
        <RecentTransactions txns={txns} />
      </div>

      <div>
        <MonthlyReplayCard replay={replay} />
      </div>
    </div>
  );
}
