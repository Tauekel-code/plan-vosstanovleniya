import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RevenuePlanMonth } from '../../engine/revenuePlanEngine';
import { CHART_COLORS, CurrencyTooltip } from './ChartTheme';
import { formatCurrencyCompact } from '../../utils/format';

export function RevenuePlanChart({ months }: { months: RevenuePlanMonth[] }) {
  const data = months.map((m) => ({
    month: `M${m.monthIndex}`,
    'Доход от продаж': m.salesRevenue,
    'Доход от абонплаты': m.supportRevenue,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.bank} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS.bank} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillSupport" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.business} stopOpacity={0.55} />
            <stop offset="100%" stopColor={CHART_COLORS.business} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="month"
          stroke={CHART_COLORS.axis}
          tick={{ fontSize: 11 }}
          interval={Math.max(0, Math.floor(data.length / 8))}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={CHART_COLORS.axis}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrencyCompact(v)}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<CurrencyTooltip />} />
        <Area
          type="monotone"
          dataKey="Доход от продаж"
          stackId="1"
          stroke={CHART_COLORS.bank}
          fill="url(#fillSales)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="Доход от абонплаты"
          stackId="1"
          stroke={CHART_COLORS.business}
          fill="url(#fillSupport)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
