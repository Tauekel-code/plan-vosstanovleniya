import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { computeFlow } from '../../engine/financialEngine';
import type { ScenarioParams } from '../../engine/types';
import { CHART_COLORS, CurrencyTooltip } from './ChartTheme';
import { formatCurrencyCompact } from '../../utils/format';

export function RevenueSplitChart({ scenario, months = 24 }: { scenario: ScenarioParams; months?: number }) {
  const data = Array.from({ length: months }, (_, i) => {
    const revenue = scenario.revenue.monthlyRevenue * Math.pow(1 + scenario.growthRatePct / 100, i);
    const flow = computeFlow(revenue, scenario.distribution, scenario.expenses);
    return {
      month: `M${i + 1}`,
      Банк: flow.bank,
      'Другие обязательства': flow.other,
      Бизнес: flow.businessBudget,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fillBank" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.bank} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS.bank} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillOther" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.other} stopOpacity={0.5} />
            <stop offset="100%" stopColor={CHART_COLORS.other} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillBusiness" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.business} stopOpacity={0.55} />
            <stop offset="100%" stopColor={CHART_COLORS.business} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis dataKey="month" stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} interval={3} tickLine={false} axisLine={false} />
        <YAxis
          stroke={CHART_COLORS.axis}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatCurrencyCompact(v)}
          tickLine={false}
          axisLine={false}
          width={64}
        />
        <Tooltip content={<CurrencyTooltip />} />
        <Area type="monotone" dataKey="Бизнес" stackId="1" stroke={CHART_COLORS.business} fill="url(#fillBusiness)" strokeWidth={2} />
        <Area type="monotone" dataKey="Другие обязательства" stackId="1" stroke={CHART_COLORS.other} fill="url(#fillOther)" strokeWidth={2} />
        <Area type="monotone" dataKey="Банк" stackId="1" stroke={CHART_COLORS.bank} fill="url(#fillBank)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
