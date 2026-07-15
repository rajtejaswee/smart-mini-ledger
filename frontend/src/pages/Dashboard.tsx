import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Summary, Transaction, Burn, Replay } from "@/lib/types";
import { formatMoneyCompact, formatDateLong } from "@/lib/format";
import { runningBalanceSeries, categoryBreakdown, pctChange } from "@/lib/derive";
import { AppLayout } from "@/components/AppLayout";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { BalanceHero } from "@/components/dashboard/BalanceHero";
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

  const load = useCallback(async () => {
    const [s, t, b, r, pr] = await Promise.all([
      api.get<{ summary: Summary }>("/transactions/summary"),
      api.get<{ transactions: Transaction[] }>("/transactions"),
      api.get<Burn>("/insights/burn"),
      api.get<Replay>("/insights/replay"),
      api.get<Replay>(`/insights/replay?month=${prevMonthKey()}`),
    ]);
    setData({
      summary: s.data.summary,
      txns: t.data.transactions,
      burn: b.data,
      replay: r.data,
      prevReplay: pr.data,
    });
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

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
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-muted sm:block">
            {formatDateLong(new Date().toISOString())}
          </p>
          <AddTransactionButton reload={load} />
        </div>
      </div>

      {loading || !data ? <GridSkeleton /> : <DashboardGrid data={data} />}
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
    <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <BalanceHero
          balance={summary.balance}
          series={series}
          trendPct={balanceTrend}
          runwayNote={runwayNote}
          income={{ value: replay.earned, trend: incomeTrend }}
          expense={{ value: replay.spent, trend: expenseTrend }}
        />
      </div>

      <div>
        <SpendingDnaCard slices={slices} total={total} />
      </div>

      <div className="lg:col-span-2">
        <RecentTransactions txns={txns} />
      </div>

      <div>
        <MonthlyReplayCard replay={replay} />
      </div>
    </div>
  );
}
