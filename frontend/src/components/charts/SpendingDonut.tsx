import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { CategorySlice } from "@/lib/derive";
import { sliceColor } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: CategorySlice }>;
}

function DonutTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-float">
      <p className="text-xs capitalize text-muted">{s.category}</p>
      <p className="tnum text-sm font-semibold text-ink">
        {formatMoney(s.amount)} · {s.pct.toFixed(0)}%
      </p>
    </div>
  );
}

export function SpendingDonut({ slices }: { slices: CategorySlice[] }) {
  return (
    <ResponsiveContainer width="100%" height={176}>
      <PieChart>
        <Pie
          data={slices}
          dataKey="amount"
          nameKey="category"
          innerRadius={56}
          outerRadius={80}
          paddingAngle={2}
          stroke="none"
          startAngle={90}
          endAngle={-270}
        >
          {slices.map((s, i) => (
            <Cell key={s.category} fill={sliceColor(i, s.category)} />
          ))}
        </Pie>
        <Tooltip content={<DonutTip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
