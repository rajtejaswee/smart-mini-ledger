import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Summary, Transaction, Burn, Replay } from "@/lib/types";
import { formatMoneyCompact, formatDateLong } from "@/lib/format";
import { runningBalanceSeries, categoryBreakdown, pctChange } from "@/lib/derive";
import { Plus, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { LoadError } from "@/components/LoadError";
import { Button } from "@/components/ui/Button";
import { AddTransactionButton } from "@/components/transactions/AddTransactionButton";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
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
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
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
      setError(false);
    } catch {
      // Without this, a failed load left the skeleton grid up forever.
      setError(true);
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const retry = () => {
    setError(false);
    setLoading(true);
    load().finally(() => setLoading(false));
  };

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

      {error && !data ? (
        <LoadError what="dashboard" onRetry={retry} />
      ) : loading || !data ? (
        <GridSkeleton />
      ) : data.txns.length === 0 ? (
        <FirstRun reload={load} />
      ) : (
        <DashboardGrid data={data} />
      )}
    </AppLayout>
  );
}

// A brand-new account used to land on a page of zeros with no guidance.
function FirstRun({ reload }: { reload: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-[#06110e] via-[#0a1512] to-[#0c0f0a] px-6 py-16 text-center text-white shadow-hero ring-1 ring-primary/15 animate-rise">
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-56 rounded-full bg-expense/10 blur-3xl" />
      <div className="relative">
        <span className="glass mx-auto grid size-14 place-items-center rounded-2xl">
          <Sparkles className="size-6 text-primary" />
        </span>
        <h2 className="mt-5 text-xl font-bold tracking-tight">Your ledger is empty</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
          Add your first transaction and the dashboard comes alive — balance trend,
          spending DNA, and your monthly recap all build from here.
        </p>
        <Button size="lg" className="mt-6" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add your first transaction
        </Button>
      </div>
      <AddTransactionModal open={open} onClose={() => setOpen(false)} reload={reload} />
    </div>
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

  // With a monthly income on file the projection is net of expected income;
  // "sustainable" means income covers the burn, so there's no run-out date.
  const runwayNote = burn.sustainable
    ? "Income covers your spending — balance projected to grow"
    : burn.daysRemaining != null
      ? burn.netBurnPerDay != null
        ? `At ${formatMoneyCompact(burn.netBurnPerDay)}/day net of income, funds last ~${burn.daysRemaining} days`
        : `At ${formatMoneyCompact(burn.burnRatePerDay)}/day, funds last ~${burn.daysRemaining} days`
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
