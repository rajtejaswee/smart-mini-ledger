import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Point } from "@/lib/derive";
import { formatMoney, formatDate } from "@/lib/format";

interface TipProps {
  active?: boolean;
  payload?: Array<{ payload: Point }>;
}

function AreaTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-float">
      <p className="text-xs text-muted">{formatDate(p.date)}</p>
      <p className="tnum text-sm font-semibold text-ink">{formatMoney(p.value)}</p>
    </div>
  );
}

export function BalanceAreaChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={132}>
      <AreaChart data={data} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.16} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Tooltip
          content={<AreaTip />}
          cursor={{ stroke: "var(--color-line)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary)"
          strokeWidth={2}
          fill="url(#balFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
