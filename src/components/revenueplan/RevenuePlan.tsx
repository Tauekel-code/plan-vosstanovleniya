import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeRevenuePlan } from '../../engine/revenuePlanEngine';
import { computeDebtForecast } from '../../engine/financialEngine';
import { Card, CardHeader } from '../ui/Card';
import { StatTile } from '../ui/StatTile';
import { InstrumentSlider } from '../ui/InstrumentSlider';
import { RevenuePlanChart } from '../charts/RevenuePlanChart';
import { formatCurrency, formatCurrencyCompact, formatMonths } from '../../utils/format';
import clsx from '../../utils/clsx';

const HORIZON_OPTIONS = [12, 24, 36];

export function RevenuePlan() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];

  const plan = useAppStore((s) => s.revenuePlan);
  const updateRevenuePlan = useAppStore((s) => s.updateRevenuePlan);

  const result = useMemo(() => computeRevenuePlan(plan), [plan]);
  const now = result.firstMonth;
  const later = result.lastMonth;

  // "Сколько смогу гасить с продаж": run the debt forecast using only the flat
  // sales-revenue line (support income is deliberately left out — this answers
  // "what can product sales alone service", the support stream is shown separately).
  const salesOnlyForecast = useMemo(
    () =>
      computeDebtForecast(
        { bankPct: scenario.distribution.bankPct, otherPct: 0, businessPct: 100 - scenario.distribution.bankPct },
        { bankDebt: scenario.debt.bankDebt, otherDebt: 0, bankExtraPayment: 0, otherExtraPayment: 0, assumedTermMonths: null },
        () => now.salesRevenue,
        480,
      ),
    [scenario.distribution.bankPct, scenario.debt.bankDebt, now.salesRevenue],
  );
  const bankPaymentFromSales = now.salesRevenue * (scenario.distribution.bankPct / 100);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-display text-2xl font-semibold text-white">План доходов</h1>
        <p className="mt-1 text-sm text-white/45">
          Выручка снизу вверх: цена продукта × продажи в месяц, плюс ежемесячное сопровождение, которое копится с
          каждым проданным продуктом. Сначала — чтобы увидеть самому, что это работает.
        </p>
      </div>

      <Card className="p-6">
        <InstrumentSlider
          label="Среднее количество продаж в месяц"
          value={plan.avgUnitsPerMonth}
          min={0}
          max={50}
          step={1}
          format={(v) => `${Math.round(v)} шт.`}
          marks={[5, 10, 20, 30, 40]}
          accent="brass"
          size="hero"
          onChange={(v) => updateRevenuePlan({ avgUnitsPerMonth: v })}
        />
      </Card>

      <Card>
        <CardHeader eyebrow="Параметры юнит-экономики" title="Цена и сопровождение" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-white/50">Цена за продукт</span>
            <div className="mt-1 flex items-center rounded-lg border border-panel-line bg-ink-soft px-3 py-2">
              <input
                type="number"
                value={plan.unitPrice}
                onChange={(e) => updateRevenuePlan({ unitPrice: Number(e.target.value) })}
                className="w-full bg-transparent text-mono tabular text-sm text-white/90 focus:outline-none"
              />
              <span className="text-xs text-white/30">₸</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-white/50">Ежемесячное сопровождение / продукт</span>
            <div className="mt-1 flex items-center rounded-lg border border-panel-line bg-ink-soft px-3 py-2">
              <input
                type="number"
                value={plan.monthlySupportFee}
                onChange={(e) => updateRevenuePlan({ monthlySupportFee: Number(e.target.value) })}
                className="w-full bg-transparent text-mono tabular text-sm text-white/90 focus:outline-none"
              />
              <span className="text-xs text-white/30">₸</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-white/50">Уже на сопровождении (продуктов)</span>
            <div className="mt-1 flex items-center rounded-lg border border-panel-line bg-ink-soft px-3 py-2">
              <input
                type="number"
                value={plan.startingSubscribers}
                onChange={(e) => updateRevenuePlan({ startingSubscribers: Number(e.target.value) })}
                className="w-full bg-transparent text-mono tabular text-sm text-white/90 focus:outline-none"
              />
              <span className="text-xs text-white/30">шт.</span>
            </div>
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Доход от продаж (месяц 1)" value={now.salesRevenue} format={formatCurrencyCompact} accent="chartBank" />
        <StatTile
          label="Доход от абонплаты (месяц 1)"
          value={now.supportRevenue}
          format={formatCurrencyCompact}
          accent="chartBusiness"
        />
        <StatTile label="Итого выручка (месяц 1)" value={now.totalRevenue} format={formatCurrency} accent="neutral" large />
        <StatTile
          label={`На банк из продаж (${scenario.distribution.bankPct}%)`}
          value={bankPaymentFromSales}
          format={formatCurrencyCompact}
          accent="brass"
        />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 pt-5">
          <CardHeader eyebrow="Прогноз" title="Продажи и абонплата по месяцам" />
          <div className="flex gap-1">
            {HORIZON_OPTIONS.map((h) => (
              <button
                key={h}
                onClick={() => updateRevenuePlan({ horizonMonths: h })}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-xs',
                  plan.horizonMonths === h ? 'bg-brass text-ink font-semibold' : 'bg-panel-raised text-white/50 hover:text-white/80',
                )}
              >
                {h} мес.
              </button>
            ))}
          </div>
        </div>
        <div className="px-3 pb-4 pt-2">
          <RevenuePlanChart months={result.months} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-panel-line px-5 py-4 sm:grid-cols-4">
          <StatTile
            label={`База подписчиков через ${plan.horizonMonths} мес.`}
            value={later.cumulativeSubscribers}
            format={(v) => `${Math.round(v)} шт.`}
            accent="neutral"
          />
          <StatTile
            label={`Абонплата через ${plan.horizonMonths} мес.`}
            value={later.supportRevenue}
            format={formatCurrencyCompact}
            accent="chartBusiness"
          />
          <StatTile
            label={`Итого выручка через ${plan.horizonMonths} мес.`}
            value={later.totalRevenue}
            format={formatCurrencyCompact}
            accent="neutral"
          />
          <StatTile
            label="Рост абонплаты за период"
            value={later.supportRevenue - now.supportRevenue}
            format={(v) => `+${formatCurrencyCompact(v)}`}
            accent="flow"
          />
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
          Погашение только за счёт продаж
        </div>
        <p className="mt-2 text-sm text-white/60">
          Без учёта абонплаты и без роста продаж: при {plan.avgUnitsPerMonth} продажах в месяц и {scenario.distribution.bankPct}%
          банку прогнозный срок погашения текущего долга банку —{' '}
          <span className="text-mono font-semibold text-brass">{formatMonths(salesOnlyForecast.bankPayoffMonth)}</span>.
          Абонентская плата в этот расчёт не входит — это отдельный, растущий источник, показанный выше.
        </p>
      </Card>
    </div>
  );
}
