import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeModel } from '../../engine/financialEngine';
import { computeForecast, projectedPayoffDate } from '../../engine/forecastEngine';
import { Card, CardHeader } from '../ui/Card';
import { StatTile } from '../ui/StatTile';
import { Button } from '../ui/Button';
import { InstrumentSlider } from '../ui/InstrumentSlider';
import { LiquidityChannel, type ChannelSegment } from '../ui/LiquidityChannel';
import { WarningBanner } from '../ui/WarningBanner';
import { DistributionEditor } from './DistributionEditor';
import { ExpensesEditor } from './ExpensesEditor';
import { DebtEditor } from './DebtEditor';
import { RevenueSplitChart } from '../charts/RevenueSplitChart';
import { DebtPaydownChart } from '../charts/DebtPaydownChart';
import { formatCurrency, formatCurrencyCompact, formatMonths } from '../../utils/format';

export function Dashboard() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const updateActiveScenario = useAppStore((s) => s.updateActiveScenario);
  const history = useAppStore((s) => s.history);
  const approvedScenarioId = useAppStore((s) => s.approvedScenarioId);
  const approveActiveScenario = useAppStore((s) => s.approveActiveScenario);
  const setConsoleScreen = useAppStore((s) => s.setConsoleScreen);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const model = useMemo(() => computeModel(scenario), [scenario]);
  const forecast = useMemo(() => computeForecast(history), [history]);
  const payoffDate = projectedPayoffDate(model.debtForecast.fullPayoffMonth);

  const revenueMax = Math.max(scenario.revenue.monthlyRevenue * 2.5, 20_000_000);
  const revenueMarks = [5_000_000, 10_000_000, 15_000_000, 20_000_000].filter((m) => m <= revenueMax);

  const segments: ChannelSegment[] = [
    {
      key: 'bank',
      label: 'Банк',
      value: model.flow.bank,
      pct: scenario.distribution.bankPct,
      swatchClass: 'bg-chart-bank',
      barClass: 'bg-chart-bank',
    },
    {
      key: 'other',
      label: 'Другие обязательства',
      value: model.flow.other,
      pct: scenario.distribution.otherPct,
      swatchClass: 'bg-chart-other',
      barClass: 'bg-chart-other',
    },
    {
      key: 'business',
      label: 'Бизнес',
      value: model.flow.businessBudget,
      pct: scenario.distribution.businessPct,
      swatchClass: 'bg-chart-business',
      barClass: 'bg-chart-business',
    },
  ];

  const bankJustPaidOff = scenario.debt.bankDebt <= 0;
  const isApproved = approvedScenarioId === scenario.id;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-display text-2xl font-semibold text-white">Главный экран</h1>
          <p className="mt-1 text-sm text-white/45">
            Денежный поток восстановления и погашения — {scenario.name.toLowerCase()} сценарий.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isApproved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flow/15 px-3 py-1 text-xs text-flow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-flow" />
              Утверждён
            </span>
          )}
          <Button
            variant={isApproved ? 'outline' : 'primary'}
            onClick={() => (isApproved ? setConsoleScreen('summary') : approveActiveScenario())}
          >
            {isApproved ? 'Открыть описание' : 'Утвердить сценарий'}
          </Button>
        </div>
      </div>

      <WarningBanner issues={model.issues} />

      {bankJustPaidOff && (
        <div className="rounded-xl border border-flow/30 bg-flow/10 px-4 py-3 text-sm text-flow-soft">
          Обязательство перед банком погашено. Высвободившаяся доля требует нового распределения — выберите его
          самостоятельно в параметрах ниже.
        </div>
      )}

      <Card className="p-6">
        <InstrumentSlider
          label="Месячная выручка"
          value={scenario.revenue.monthlyRevenue}
          min={0}
          max={revenueMax}
          step={100_000}
          format={formatCurrencyCompact}
          marks={revenueMarks}
          accent="brass"
          size="hero"
          onChange={(v) =>
            updateActiveScenario((s) => ({ ...s, revenue: { ...s.revenue, monthlyRevenue: v } }))
          }
        />
        <div className="mt-6">
          <LiquidityChannel segments={segments} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader eyebrow="Шаги 1–5" title="Денежный поток" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">
            <StatTile label="Выручка" value={model.flow.revenue} format={formatCurrencyCompact} accent="neutral" />
            <StatTile label="Банк" value={model.flow.bank} format={formatCurrencyCompact} accent="chartBank" />
            <StatTile label="Другие обязательства" value={model.flow.other} format={formatCurrencyCompact} accent="chartOther" />
            <StatTile label="Бюджет бизнеса" value={model.flow.businessBudget} format={formatCurrencyCompact} accent="chartBusiness" />
            <StatTile
              label="Свободный поток"
              value={model.flow.freeCashFlow}
              format={formatCurrency}
              accent={model.flow.freeCashFlow < 0 ? 'garnet' : 'flow'}
              large
              className="col-span-2"
            />
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Шаг 6" title="Обязательства" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">
            <StatTile label="Долг банку" value={scenario.debt.bankDebt} format={formatCurrencyCompact} accent="neutral" />
            <StatTile
              label="Другие обязательства"
              value={scenario.debt.otherDebt}
              format={formatCurrencyCompact}
              accent="neutral"
            />
            <StatTile
              label="Общий долг"
              value={scenario.debt.bankDebt + scenario.debt.otherDebt}
              format={formatCurrency}
              accent="neutral"
              large
              className="col-span-2"
            />
            <StatTile
              label="Текущий платёж"
              value={model.flow.bank + model.flow.other}
              format={formatCurrencyCompact}
              accent="brass"
            />
            <div className="col-span-2 rounded-xl border border-panel-line bg-panel-raised/60 px-4 py-3.5">
              <div className="text-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
                Прогнозная дата погашения
              </div>
              <div className="text-mono text-xl font-semibold text-white">
                {payoffDate ?? formatMonths(model.debtForecast.fullPayoffMonth)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="§22, §8" title="Дополнительно" />
          <div className="grid grid-cols-2 gap-3 px-5 pb-5 pt-4">
            <StatTile
              label="Мин. необходимая выручка"
              value={model.minimumRequiredRevenue}
              format={formatCurrencyCompact}
              accent="brass"
            />
            <StatTile
              label="Средняя факт. выручка (3 мес)"
              value={forecast.avg3 ?? 0}
              format={forecast.avg3 === null ? () => '—' : formatCurrencyCompact}
              accent="neutral"
            />
            <StatTile
              label="Прогнозная выручка"
              value={forecast.trendRevenue ?? scenario.revenue.forecastRevenue}
              format={formatCurrencyCompact}
              accent="neutral"
            />
            <StatTile
              label="Отклонение факта от плана"
              value={scenario.revenue.monthlyRevenue - scenario.revenue.plannedRevenue}
              format={(v) => `${v >= 0 ? '+' : ''}${formatCurrencyCompact(v)}`}
              accent={scenario.revenue.monthlyRevenue >= scenario.revenue.plannedRevenue ? 'flow' : 'garnet'}
            />
          </div>
          {forecast.warning && (
            <div className="mx-5 mb-5 rounded-lg bg-brass/10 px-3 py-2 text-xs text-brass-soft">{forecast.warning}</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader eyebrow="График 1" title="Выручка · банк · бизнес" />
          <div className="px-3 pb-4 pt-2">
            <RevenueSplitChart scenario={scenario} />
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow="График 2" title="Снижение задолженности" />
          <div className="px-3 pb-4 pt-2">
            <DebtPaydownChart forecast={model.debtForecast} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DistributionEditor
          distribution={scenario.distribution}
          onChange={(d) => updateActiveScenario((s) => ({ ...s, distribution: d }))}
        />
        <DebtEditor debt={scenario.debt} onChange={(d) => updateActiveScenario((s) => ({ ...s, debt: d }))} />
      </div>

      <ExpensesEditor
        expenses={scenario.expenses}
        onChange={(e) => updateActiveScenario((s) => ({ ...s, expenses: e }))}
      />
    </div>
  );
}
