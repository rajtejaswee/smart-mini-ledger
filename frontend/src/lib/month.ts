import type { Transaction } from "./types";

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function txnsInMonth(txns: Transaction[], month: Date): Transaction[] {
  return txns.filter((t) => isSameMonth(new Date(t.date), month));
}

// ---- Timeline grouping (newest day first) ----
export interface DayGroup {
  date: Date;
  items: Transaction[];
  net: number;
}

export function groupByDay(txns: Transaction[]): DayGroup[] {
  const buckets = new Map<string, Transaction[]>();
  const sorted = [...txns].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  for (const t of sorted) {
    const key = new Date(t.date).toDateString();
    const list = buckets.get(key);
    if (list) list.push(t);
    else buckets.set(key, [t]);
  }
  return [...buckets.entries()].map(([key, items]) => ({
    date: new Date(key),
    items,
    net: items.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0),
  }));
}

// ---- Calendar heatmap cells ----
export interface CalendarDay {
  date: Date | null; // null = leading blank
  spend: number;
  count: number;
}

export function buildCalendar(month: Date, txns: Transaction[]): CalendarDay[] {
  const first = startOfMonth(month);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const byDay = new Map<number, { spend: number; count: number }>();
  for (const t of txns) {
    if (t.type !== "EXPENSE") continue;
    const d = new Date(t.date);
    if (!isSameMonth(d, month)) continue;
    const cur = byDay.get(d.getDate()) ?? { spend: 0, count: 0 };
    cur.spend += t.amount;
    cur.count += 1;
    byDay.set(d.getDate(), cur);
  }

  const cells: CalendarDay[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ date: null, spend: 0, count: 0 });
  for (let day = 1; day <= daysInMonth; day++) {
    const info = byDay.get(day) ?? { spend: 0, count: 0 };
    cells.push({
      date: new Date(month.getFullYear(), month.getMonth(), day),
      spend: info.spend,
      count: info.count,
    });
  }
  return cells;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
