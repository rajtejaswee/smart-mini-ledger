import { prisma } from "../config/db";
import {
  startOfMonth,
  startOfNextMonth,
  daysInMonth,
  daysElapsedInMonth,
  subDays,
  isSameMonth,
  toMonthKey,
} from "../utils/date";
import type { ConfidenceInput } from "../validators/insights.schema";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The one shared "engine" that powers four smart features. Everything here derives
 * purely from a user's transactions — no external data, mostly aggregation + ratios.
 */

// ── 1. Confidence Score ──────────────────────────────────────────────
// Compares a proposed amount against the category's historical average and flags
// outliers (and guesses an "extra zeros" typo fix).
export async function checkConfidence(userId: string, input: ConfidenceInput) {
  const rows = await prisma.transaction.findMany({
    where: { userId, isDeleted: false, type: input.type, category: input.category },
    select: { amount: true },
  });

  const count = rows.length;
  if (count < 3) {
    return {
      unusual: false,
      count,
      average: null,
      reason: "Not enough history for this category yet",
    };
  }

  const average = round2(rows.reduce((sum, r) => sum + r.amount, 0) / count);
  const ratio = average > 0 ? input.amount / average : 0;
  const unusual = average > 0 && (ratio >= 3 || ratio <= 1 / 3);

  // If the amount looks ~10x/100x too big, suggest the most likely intended value.
  let suggestedAmount: number | null = null;
  if (unusual && ratio >= 3) {
    const candidates = [input.amount / 10, input.amount / 100, input.amount / 1000].filter(
      (c) => c >= 1
    );
    const best = candidates.reduce(
      (b, c) => (Math.abs(c - average) < Math.abs(b - average) ? c : b),
      input.amount
    );
    if (best !== input.amount && Math.abs(best - average) < Math.abs(input.amount - average)) {
      suggestedAmount = round2(best);
    }
  }

  return { unusual, count, average, ratio: round2(ratio), suggestedAmount };
}

// ── 2. Cash Burn Meter ───────────────────────────────────────────────
// Current balance + this-month burn rate + how long the money lasts.
export async function getBurn(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const nextMonth = startOfNextMonth(now);
  const base = { userId, isDeleted: false } as const;

  const [incomeAgg, expenseAgg, monthExpenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...base, type: "INCOME" } }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { ...base, type: "EXPENSE" } }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...base, type: "EXPENSE", date: { gte: monthStart, lt: nextMonth } },
    }),
  ]);

  const totalIncome = incomeAgg._sum.amount ?? 0;
  const totalExpense = expenseAgg._sum.amount ?? 0;
  const monthExpense = monthExpenseAgg._sum.amount ?? 0;

  const balance = round2(totalIncome - totalExpense);
  const daysElapsed = daysElapsedInMonth(now);
  const burnRatePerDay = round2(monthExpense / Math.max(1, daysElapsed));
  const daysRemaining =
    burnRatePerDay > 0 && balance > 0 ? Math.floor(balance / burnRatePerDay) : null;

  return {
    balance,
    burnRatePerDay,
    daysRemaining,
    monthExpense: round2(monthExpense),
    daysElapsed,
  };
}

// ── 3. Expense Velocity ──────────────────────────────────────────────
// Rolling last-7-days vs the 7 days before that.
export async function getVelocity(userId: string) {
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const twoWeeksAgo = subDays(now, 14);
  const base = { userId, isDeleted: false, type: "EXPENSE" } as const;

  const [thisWeekAgg, lastWeekAgg] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...base, date: { gte: weekAgo, lte: now } },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...base, date: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
  ]);

  const thisWeek = round2(thisWeekAgg._sum.amount ?? 0);
  const lastWeek = round2(lastWeekAgg._sum.amount ?? 0);
  const changePercent = lastWeek > 0 ? round2(((thisWeek - lastWeek) / lastWeek) * 100) : null;
  const direction = thisWeek > lastWeek ? "up" : thisWeek < lastWeek ? "down" : "flat";

  return { thisWeek, lastWeek, changePercent, direction };
}

// ── 4. Monthly Replay ────────────────────────────────────────────────
// A premium recap for a given month (defaults to the current one).
export async function getReplay(userId: string, monthParam?: string) {
  let base = new Date();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    base = new Date(year, month - 1, 1);
  }

  const start = startOfMonth(base);
  const next = startOfNextMonth(base);

  const txns = await prisma.transaction.findMany({
    where: { userId, isDeleted: false, date: { gte: start, lt: next } },
    orderBy: { amount: "desc" },
  });

  const expenses = txns.filter((t) => t.type === "EXPENSE");
  const earned = round2(
    txns.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0)
  );
  const spent = round2(expenses.reduce((s, t) => s + t.amount, 0));

  // txns are sorted by amount desc, so the first expense is the biggest.
  const top = expenses[0];
  const biggestExpense = top
    ? { amount: top.amount, category: top.category, date: top.date }
    : null;

  // Most frequent expense category (by number of transactions).
  const counts = new Map<string, number>();
  for (const t of expenses) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  let topCategory: { category: string; count: number } | null = null;
  for (const [category, count] of counts) {
    if (!topCategory || count > topCategory.count) topCategory = { category, count };
  }

  // For the current month, average over days elapsed; for past months, full month.
  const now = new Date();
  const days = isSameMonth(start, now) ? daysElapsedInMonth(now) : daysInMonth(start);
  const avgDailySpend = round2(spent / Math.max(1, days));

  return {
    month: toMonthKey(start),
    earned,
    spent,
    biggestExpense,
    topCategory,
    avgDailySpend,
    transactionCount: txns.length,
  };
}
