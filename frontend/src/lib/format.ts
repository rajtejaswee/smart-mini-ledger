// ₹ INR formatting and friendly dates.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(n: number): string {
  return inr.format(n);
}

export function formatMoneyCompact(n: number): string {
  return inrCompact.format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "Today" / "Yesterday" / "Monday, 14 Jul" — for timeline day headers.
export function formatDayLabel(d: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
}

// Signed money for deltas: +₹500 / −₹500
export function formatSigned(n: number): string {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${formatMoney(Math.abs(n))}`;
}
