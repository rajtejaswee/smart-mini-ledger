import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "income" | "expense" | "primary";

const toneStyles: Record<Tone, { chip: string; value: string }> = {
  income: { chip: "bg-income/10 text-income", value: "text-ink" },
  expense: { chip: "bg-expense/10 text-expense", value: "text-ink" },
  primary: { chip: "bg-primary/10 text-primary", value: "text-ink" },
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  trend?: ReactNode;
}) {
  const s = toneStyles[tone];
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-[12px]", s.chip)}>
          <Icon className="size-4.5" aria-hidden />
        </span>
        {trend}
      </div>
      <p className="mt-3 text-sm font-medium text-muted">{label}</p>
      <p className={cn("tnum mt-1 text-2xl font-bold tracking-tight", s.value)}>{value}</p>
    </div>
  );
}
