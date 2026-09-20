import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeReverseCalculator } from '../../engine/reverseCalculator';
import { Card, CardHeader } from '../ui/Card';
import { StatTile } from '../ui/StatTile';
import { InstrumentSlider } from '../ui/InstrumentSlider';
import { formatCurrency, formatMonths } from '../../utils/format';

export function ReverseCalculator() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];

  const [months, setMonths] = useState(24);
  const result = useMemo(() => computeReverseCalculator(scenario, months), [scenario, months]);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-display text-2xl font-semibold text-white">Обратный калькулятор</h1>
        <p className="mt-1 text-sm text-white/45">«Хочу погасить долг за X месяцев» — считаем, что для этого нужно.</p>
      </div>

      <Card className="p-6">
        <InstrumentSlider
          label="Желаемый срок погашения"
          value={months}
          min={1}
          max={120}
          step={1}
          format={(v) => `${v} мес.`}
          marks={[6, 12, 24, 36, 60]}
          accent="brass"
          size="hero"
          onChange={setMonths}
        />
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Общий долг" value={result.totalDebt} format={formatCurrency} accent="neutral" />
        <StatTile
          label="Необходимый ежемесячный платёж"
          value={result.requiredMonthlyPayment}
          format={formatCurrency}
          accent="brass"
          large
        />
        <StatTile label="Необходимая выручка" value={result.requiredRevenue} format={formatCurrency} accent="brass" large />
        <StatTile
          label="Необходимая доля выручки"
          value={result.requiredRevenueSharePct}
          format={(v) => `${v.toFixed(0)}%`}
          accent="neutral"
        />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-mono text-[11px] uppercase tracking-[0.12em] text-white/40">Текущая выручка</div>
            <div className="text-mono tabular text-xl text-white/90">{formatCurrency(result.currentRevenue)}</div>
          </div>
          <div className="text-right">
            <div className="text-mono text-[11px] uppercase tracking-[0.12em] text-white/40">
              {result.deficit > 0 ? 'Дефицит выручки' : 'Запас выручки'}
            </div>
            <div className={`text-mono tabular text-xl font-semibold ${result.deficit > 0 ? 'text-garnet' : 'text-flow'}`}>
              {formatCurrency(Math.abs(result.deficit))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/45">
          {result.deficit > 0
            ? `Чтобы погасить долг за ${formatMonths(months)}, выручку нужно увеличить на ${formatCurrency(result.deficit)}`
            : `Текущей выручки достаточно, чтобы погасить долг за ${formatMonths(months)}`}
        </p>
      </Card>
    </div>
  );
}
