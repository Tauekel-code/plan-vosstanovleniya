import { Card, CardHeader } from '../ui/Card';
import type { DebtState } from '../../engine/types';

interface Props {
  debt: DebtState;
  onChange: (d: DebtState) => void;
}

export function DebtEditor({ debt, onChange }: Props) {
  return (
    <Card>
      <CardHeader eyebrow="Обязательства" title="Долги и дополнительные платежи" />
      <div className="grid grid-cols-1 gap-3 px-5 pb-5 pt-4 sm:grid-cols-2">
        <Field label="Долг банку" value={debt.bankDebt} onChange={(v) => onChange({ ...debt, bankDebt: v })} />
        <Field
          label="Другие обязательства"
          value={debt.otherDebt}
          onChange={(v) => onChange({ ...debt, otherDebt: v })}
        />
        <Field
          label="Доп. платёж банку"
          value={debt.bankExtraPayment}
          onChange={(v) => onChange({ ...debt, bankExtraPayment: v })}
        />
        <Field
          label="Доп. платёж по другим обязательствам"
          value={debt.otherExtraPayment}
          onChange={(v) => onChange({ ...debt, otherExtraPayment: v })}
        />
      </div>
    </Card>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-xs text-white/50">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-panel-line bg-ink-soft px-3 py-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent text-mono tabular text-sm text-white/90 focus:outline-none"
        />
        <span className="text-xs text-white/30">₸</span>
      </div>
    </label>
  );
}
