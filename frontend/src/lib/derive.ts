import type { Transaction } from "./types";

export interface Point {
  date: string;
  value: number;
}

// Cumulative balance over time (income +, expense −), oldest → newest. For the area chart.
export function runningBalanceSeries(txns: Transaction[]): Point[] {
  const sorted = [...txns].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  let balance = 0;
  return sorted.map((t) => {
    balance += t.type === "INCOME" ? t.amount : -t.amount;
    return { date: t.date, value: Math.round(balance * 100) / 100 };
  });
}

export interface CategorySlice {
  category: string;
  amount: number;
  pct: number;
}

// Expense totals by category, largest first, with a 6th "Other" bucket. For the donut.
export function categoryBreakdown(
  txns: Transaction[],
  topN = 5
): { slices: CategorySlice[]; total: number } {
  const sums = new Map<string, number>();
  for (const t of txns) {
    if (t.type !== "EXPENSE") continue;
    sums.set(t.category, (sums.get(t.category) ?? 0) + t.amount);
  }

  const total = [...sums.values()].reduce((s, v) => s + v, 0);
  const sorted = [...sums.entries()].sort((a, b) => b[1] - a[1]);
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  const slices: CategorySlice[] = sorted
    .slice(0, topN)
    .map(([category, amount]) => ({ category, amount, pct: pct(amount) }));

  const restSum = sorted.slice(topN).reduce((s, [, v]) => s + v, 0);
  if (restSum > 0) slices.push({ category: "Other", amount: restSum, pct: pct(restSum) });

  return { slices, total };
}

// % change guarded against zero/invalid denominators.
export function pctChange(current: number, previous: number): number | null {
  if (!previous || !isFinite(previous)) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
