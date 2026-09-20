import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeFlow } from '../../engine/financialEngine';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/format';

export function PlanActual() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const history = useAppStore((s) => s.history);
  const upsertHistoryMonth = useAppStore((s) => s.upsertHistoryMonth);
  const removeHistoryMonth = useAppStore((s) => s.removeHistoryMonth);

  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [planned, setPlanned] = useState(scenario.revenue.plannedRevenue);
  const [actual, setActual] = useState<string>('');

  const rows = useMemo(
    () =>
      history.map((h) => {
        // Completed months: actual takes priority over planned (§7).
        const effectiveRevenue = h.actualRevenue ?? h.plannedRevenue;
        const flow = computeFlow(effectiveRevenue, scenario.distribution, scenario.expenses);
        const deviation = h.actualRevenue !== null ? h.actualRevenue - h.plannedRevenue : null;
        return { ...h, flow, deviation };
      }),
    [history, scenario],
  );

  function addMonth() {
    upsertHistoryMonth({
      month,
      plannedRevenue: planned,
      actualRevenue: actual === '' ? null : Number(actual),
    });
    setActual('');
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-display text-2xl font-semibold text-white">План / Факт</h1>
        <p className="mt-1 text-sm text-white/45">
          Для завершённых месяцев фактическая выручка приоритетнее плановой.
        </p>
      </div>

      <Card>
        <CardHeader eyebrow="Новая запись" title="Добавить месяц" />
        <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs text-white/50">Месяц</span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 w-full rounded-lg border border-panel-line bg-ink-soft px-3 py-2 text-sm text-white/90"
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/50">Плановая выручка</span>
            <input
              type="number"
              value={planned}
              onChange={(e) => setPlanned(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-panel-line bg-ink-soft px-3 py-2 text-mono tabular text-sm text-white/90"
            />
          </label>
          <label className="block">
            <span className="text-xs text-white/50">Фактическая выручка (если есть)</span>
            <input
              type="number"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="—"
              className="mt-1 w-full rounded-lg border border-panel-line bg-ink-soft px-3 py-2 text-mono tabular text-sm text-white/90"
            />
          </label>
          <div className="flex items-end">
            <Button variant="primary" className="w-full" onClick={addMonth}>
              Сохранить месяц
            </Button>
          </div>
        </div>
      </Card>

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-panel-line text-left text-xs uppercase tracking-wide text-white/40">
              <th className="px-4 py-3">Месяц</th>
              <th className="px-4 py-3">План</th>
              <th className="px-4 py-3">Факт</th>
              <th className="px-4 py-3">Отклонение</th>
              <th className="px-4 py-3">Банк</th>
              <th className="px-4 py-3">Другие</th>
              <th className="px-4 py-3">Бизнес</th>
              <th className="px-4 py-3">Своб. поток</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-b border-panel-line/60 text-mono tabular">
                <td className="px-4 py-3 text-white/80">{r.month}</td>
                <td className="px-4 py-3 text-white/60">{formatCurrency(r.plannedRevenue)}</td>
                <td className="px-4 py-3 text-white/90">
                  {r.actualRevenue !== null ? formatCurrency(r.actualRevenue) : '—'}
                </td>
                <td className={`px-4 py-3 ${r.deviation !== null && r.deviation < 0 ? 'text-garnet' : 'text-flow'}`}>
                  {r.deviation !== null ? `${r.deviation >= 0 ? '+' : ''}${formatCurrency(r.deviation)}` : '—'}
                </td>
                <td className="px-4 py-3 text-chart-bank">{formatCurrency(r.flow.bank)}</td>
                <td className="px-4 py-3 text-chart-other">{formatCurrency(r.flow.other)}</td>
                <td className="px-4 py-3 text-chart-business">{formatCurrency(r.flow.businessBudget)}</td>
                <td className="px-4 py-3 text-white/90">{formatCurrency(r.flow.freeCashFlow)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => removeHistoryMonth(r.month)} className="text-white/30 hover:text-garnet">
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-white/30">
                  Пока нет записей по месяцам.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {rows.map((r) => (
          <Card key={r.month} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-mono text-sm text-white/80">{r.month}</span>
              <button onClick={() => removeHistoryMonth(r.month)} className="text-white/30 hover:text-garnet">
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-mono tabular text-sm">
              <div className="text-white/50">План: {formatCurrency(r.plannedRevenue)}</div>
              <div className="text-white/90">Факт: {r.actualRevenue !== null ? formatCurrency(r.actualRevenue) : '—'}</div>
              <div className="text-chart-bank">Банк: {formatCurrency(r.flow.bank)}</div>
              <div className="text-chart-business">Бизнес: {formatCurrency(r.flow.businessBudget)}</div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
