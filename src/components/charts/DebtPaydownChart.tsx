import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import type { DebtForecast } from '../../engine/types';
import { CHART_COLORS, CurrencyTooltip } from './ChartTheme';
import { formatCurrencyCompact } from '../../utils/format';

export function DebtPaydownChart({ forecast }: { forecast: DebtForecast }) {
  const data = forecast.months.map((m) => ({
    month: `M${m.monthIndex}`,
    'Долг банку': m.bankRemaining,
    'Другие обязательства': m.otherRemaining,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="month" stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(data.length / 8))} tickLine={false} axisLine={false} />
        <YAxis
          stroke={CHART_COLORS.axis}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrencyCompact(v)}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<CurrencyTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
        <Line type="monotone" dataKey="Долг банку" stroke={CHART_COLORS.bank} strokeWidth={2.5} dot={false} />
        <Line type="monotone" dataKey="Другие обязательства" stroke={CHART_COLORS.other} strokeWidth={2.5} dot={false} strokeDasharray="4 3" />
      </LineChart>
    </ResponsiveContainer>
  );
}
