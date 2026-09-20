import { Card, CardHeader } from '../ui/Card';
import type { BusinessExpenses } from '../../engine/types';
import { sumExpenses } from '../../engine/financialEngine';
import { formatCurrency } from '../../utils/format';

interface Props {
  expenses: BusinessExpenses;
  onChange: (e: BusinessExpenses) => void;
}

const FIELDS: { key: keyof BusinessExpenses; label: string }[] = [
  { key: 'ownerSalary', label: 'Зарплата собственника' },
  { key: 'employeeReserve', label: 'Резерв на сотрудника' },
  { key: 'taxes', label: 'Налоги' },
  { key: 'operatingExpenses', label: 'Операционные расходы' },
  { key: 'reserveFund', label: 'Резервный фонд' },
  { key: 'marketingDevelopment', label: 'Маркетинг и развитие' },
];

export function ExpensesEditor({ expenses, onChange }: Props) {
  return (
    <Card>
      <CardHeader eyebrow="Шаг 4" title="Расходы бизнеса" />
      <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs text-white/50">{f.label}</span>
            <div className="mt-1 flex items-center rounded-lg border border-panel-line bg-ink-soft px-3 py-2">
              <input
                type="number"
                value={expenses[f.key]}
                onChange={(e) => onChange({ ...expenses, [f.key]: Number(e.target.value) })}
                className="w-full bg-transparent text-mono tabular text-sm text-white/90 focus:outline-none"
              />
              <span className="text-xs text-white/30">₸</span>
            </div>
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-panel-line px-5 py-3 text-sm">
        <span className="text-white/50">Итого расходов</span>
        <span className="text-mono tabular font-medium text-white/90">{formatCurrency(sumExpenses(expenses))}</span>
      </div>
    </Card>
  );
}
