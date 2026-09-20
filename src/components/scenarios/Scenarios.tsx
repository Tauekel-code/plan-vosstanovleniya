import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { computeDebtForecast } from '../../engine/financialEngine';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, formatCurrencyCompact } from '../../utils/format';
import { CHART_COLORS } from '../charts/ChartTheme';

const SCENARIO_LINE_COLORS = ['#3987E5', '#D95926', '#199E70', '#C99A3D', '#9085E9'];

export function Scenarios() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const setActiveScenarioId = useAppStore((s) => s.setActiveScenarioId);
  const addCustomScenarioFromActive = useAppStore((s) => s.addCustomScenarioFromActive);
  const removeScenario = useAppStore((s) => s.removeScenario);

  const forecasts = useMemo(
    () =>
      scenarios.map((s) => ({
        scenario: s,
        forecast: computeDebtForecast(s.distribution, s.debt, (m) => s.revenue.monthlyRevenue * Math.pow(1 + s.growthRatePct / 100, m)),
      })),
    [scenarios],
  );

  const maxLen = Math.max(...forecasts.map((f) => f.forecast.months.length), 1);
  const chartData = Array.from({ length: Math.min(maxLen, 96) }, (_, i) => {
    const row: Record<string, number | string> = { month: `M${i + 1}` };
    for (const f of forecasts) {
      row[f.scenario.name] = f.forecast.months[i]?.totalRemaining ?? 0;
    }
    return row;
  });

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display text-2xl font-semibold text-white">Сценарии</h1>
          <p className="mt-1 text-sm text-white/45">Каждый сценарий независим и содержит собственные параметры.</p>
        </div>
        <Button variant="primary" onClick={addCustomScenarioFromActive}>
          + Скопировать активный
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scenarios.map((s) => {
          const isActive = s.id === activeScenarioId;
          return (
            <Card key={s.id} className={isActive ? 'border-brass/40' : undefined}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-display text-sm font-medium text-white">{s.name}</span>
                  {s.kind === 'custom' && scenarios.length > 1 && (
                    <button onClick={() => removeScenario(s.id)} className="text-white/30 hover:text-garnet">
                      ×
                    </button>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-mono tabular text-xs text-white/50">
                  <div>Выручка: {formatCurrency(s.revenue.monthlyRevenue)}</div>
                  <div>Рост: {s.growthRatePct}%/мес.</div>
                  <div>
                    Распределение: {s.distribution.bankPct}/{s.distribution.otherPct}/{s.distribution.businessPct}
                  </div>
                </div>
                <Button
                  variant={isActive ? 'primary' : 'outline'}
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => setActiveScenarioId(s.id)}
                >
                  {isActive ? 'Активный' : 'Сделать активным'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader eyebrow="График 4" title="Сценарии погашения" />
        <div className="px-3 pb-4 pt-2">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
              <XAxis dataKey="month" stroke={CHART_COLORS.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                stroke={CHART_COLORS.axis}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrencyCompact(v)}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{ background: '#141B29', border: '1px solid #2A3648', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
              {forecasts.map((f, i) => (
                <Line
                  key={f.scenario.id}
                  type="monotone"
                  dataKey={f.scenario.name}
                  stroke={SCENARIO_LINE_COLORS[i % SCENARIO_LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
