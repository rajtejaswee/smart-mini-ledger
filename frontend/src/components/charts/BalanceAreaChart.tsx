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

export function BalanceAreaChart({
  data,
  onDark = false,
  height = 132,
}: {
  data: Point[];
  onDark?: boolean;
  height?: number;
}) {
  const stroke = onDark ? "#e5e5e5" : "var(--color-primary)";
  const gradId = onDark ? "balFillDark" : "balFill";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={onDark ? 0.32 : 0.16} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Tooltip
          content={<AreaTip />}
          cursor={{ stroke: onDark ? "rgba(255,255,255,0.25)" : "var(--color-line)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: stroke }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
