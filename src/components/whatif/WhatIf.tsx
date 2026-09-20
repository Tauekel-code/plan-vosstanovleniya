import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { runWhatIf, type WhatIfOverrides } from '../../engine/whatIfEngine';
import { projectedPayoffDate } from '../../engine/forecastEngine';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatTile } from '../ui/StatTile';
import { formatCurrency, formatMonths } from '../../utils/format';

const NUMERIC_FIELDS: { key: keyof WhatIfOverrides; label: string }[] = [
  { key: 'monthlyRevenue', label: 'Выручка' },
  { key: 'bankPct', label: '% банку' },
  { key: 'otherPct', label: '% другим обязательствам' },
  { key: 'businessPct', label: '% бизнесу' },
  { key: 'ownerSalary', label: 'Зарплата собственника' },
  { key: 'employeeReserve', label: 'Резерв сотрудника' },
  { key: 'taxes', label: 'Налоги' },
  { key: 'operatingExpenses', label: 'Операционные расходы' },
  { key: 'reserveFund', label: 'Резервный фонд' },
  { key: 'marketingDevelopment', label: 'Маркетинг и развитие' },
  { key: 'bankDebt', label: 'Размер долга банку' },
  { key: 'bankExtraPayment', label: 'Доп. платёж банку' },
  { key: 'otherExtraPayment', label: 'Доп. платёж по другим обязательствам' },
  { key: 'growthRatePct', label: 'Темп роста выручки, % в мес.' },
];

export function WhatIf() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const overrides = useAppStore((s) => s.whatIfOverrides);
  const setWhatIf = useAppStore((s) => s.setWhatIf);
  const clearWhatIf = useAppStore((s) => s.clearWhatIf);

  const result = useMemo(() => runWhatIf(scenario, overrides), [scenario, overrides]);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-display text-2xl font-semibold text-white">Что будет, если…</h1>
          <p className="mt-1 text-sm text-white/45">
            Изменения здесь не влияют на основной сценарий — только на этот расчёт.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={clearWhatIf}>
          Сбросить изменения
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ComparisonCard title="Было" accent="neutral" payoffDate={projectedPayoffDate(result.before.debtForecast.fullPayoffMonth)}>
          <StatTile label="Выручка" value={result.before.flow.revenue} format={formatCurrency} accent="neutral" />
          <StatTile label="Платёж банку" value={result.before.flow.bank} format={formatCurrency} accent="chartBank" />
          <StatTile label="Своб. поток" value={result.before.flow.freeCashFlow} format={formatCurrency} accent="chartBusiness" />
          <StatTile
            label="Остаток долга"
            value={result.overriddenScenario.debt.bankDebt + result.overriddenScenario.debt.otherDebt}
            format={formatCurrency}
            accent="neutral"
          />
        </ComparisonCard>

        <ComparisonCard title="Стало" accent="brass" payoffDate={projectedPayoffDate(result.after.debtForecast.fullPayoffMonth)}>
          <StatTile label="Выручка" value={result.after.flow.revenue} format={formatCurrency} accent="neutral" />
          <StatTile label="Платёж банку" value={result.after.flow.bank} format={formatCurrency} accent="chartBank" />
          <StatTile
            label="Своб. поток"
            value={result.after.flow.freeCashFlow}
            format={formatCurrency}
            accent={result.after.flow.freeCashFlow < 0 ? 'garnet' : 'chartBusiness'}
          />
          <StatTile
            label="Остаток долга"
            value={result.overriddenScenario.debt.bankDebt + result.overriddenScenario.debt.otherDebt}
            format={formatCurrency}
            accent="neutral"
          />
        </ComparisonCard>
      </div>

      <Card>
        <CardHeader eyebrow="Параметры моделирования" title="Изменить временно" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {NUMERIC_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-xs text-white/50">{f.label}</span>
              <input
                type="number"
                value={overrides[f.key] ?? ''}
                placeholder="без изменений"
                onChange={(e) =>
                  setWhatIf({ [f.key]: e.target.value === '' ? undefined : Number(e.target.value) } as WhatIfOverrides)
                }
                className="mt-1 w-full rounded-lg border border-panel-line bg-ink-soft px-3 py-2 text-mono tabular text-sm text-white/90"
              />
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ComparisonCard({
  title,
  accent,
  payoffDate,
  children,
}: {
  title: string;
  accent: 'neutral' | 'brass';
  payoffDate: string | null;
  children: React.ReactNode;
}) {
  return (
    <Card className={accent === 'brass' ? 'border-brass/30' : undefined}>
      <CardHeader eyebrow={accent === 'brass' ? 'Сценарий с изменениями' : 'Текущий сценарий'} title={title} />
      <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">{children}</div>
      <div className="mx-5 mb-5 rounded-lg bg-panel-raised/60 px-3 py-2 text-sm">
        <span className="text-white/40">Дата погашения: </span>
        <span className="text-mono text-white/85">{payoffDate ?? formatMonths(null)}</span>
      </div>
    </Card>
  );
}
