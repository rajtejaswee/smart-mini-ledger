import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Summary } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AppHeader } from "@/components/AppHeader";
import { Card } from "@/components/ui/Card";
import { useCountUp } from "@/hooks/useCountUp";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function BalanceCard({ balance }: { balance: number }) {
  const animated = useCountUp(balance);
  return (
    <Card className="bg-white sm:col-span-2">
      <p className="text-sm font-medium text-muted">Current balance</p>
      <p className="tnum mt-2 text-4xl font-bold tracking-tight text-ink">
        {formatMoney(animated)}
      </p>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  kind,
}: {
  label: string;
  value: number;
  kind: "income" | "expense";
}) {
  const isIncome = kind === "income";
  return (
    <Card className="bg-white">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-8 place-items-center rounded-[10px]",
            isIncome ? "bg-income/10 text-income" : "bg-expense/10 text-expense"
          )}
        >
          {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p
        className={cn(
          "tnum mt-3 text-2xl font-bold tracking-tight",
          isIncome ? "text-income" : "text-expense"
        )}
      >
        {formatMoney(value)}
      </p>
    </Card>
  );
}

function TilesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="h-28 animate-pulse rounded-card bg-card sm:col-span-2" />
      <div className="h-28 animate-pulse rounded-card bg-card" />
      <div className="h-28 animate-pulse rounded-card bg-card" />
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ summary: Summary }>("/transactions/summary")
      .then((r) => setSummary(r.data.summary))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 animate-rise">
          <p className="text-sm text-muted">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {user?.name?.split(" ")[0]}
          </h1>
        </div>

        {loading || !summary ? (
          <TilesSkeleton />
        ) : (
          <div className="grid animate-rise gap-4 sm:grid-cols-2">
            <BalanceCard balance={summary.balance} />
            <MiniStat label="Income" value={summary.totalIncome} kind="income" />
            <MiniStat label="Expenses" value={summary.totalExpense} kind="expense" />
          </div>
        )}
      </main>
    </div>
  );
}
