import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import type { DistributionParams } from '../../engine/types';

interface Props {
  distribution: DistributionParams;
  onChange: (d: DistributionParams) => void;
}

const FIELDS: { key: keyof DistributionParams; label: string; dot: string }[] = [
  { key: 'bankPct', label: 'Банк', dot: 'bg-chart-bank' },
  { key: 'otherPct', label: 'Другие обязательства', dot: 'bg-chart-other' },
  { key: 'businessPct', label: 'Бизнес', dot: 'bg-chart-business' },
];

export function DistributionEditor({ distribution, onChange }: Props) {
  const sum = distribution.bankPct + distribution.otherPct + distribution.businessPct;
  const isValid = Math.abs(sum - 100) < 0.01;

  function normalize() {
    if (sum === 0) return;
    const factor = 100 / sum;
    onChange({
      bankPct: Math.round(distribution.bankPct * factor * 10) / 10,
      otherPct: Math.round(distribution.otherPct * factor * 10) / 10,
      businessPct: Math.round((100 - distribution.bankPct * factor - distribution.otherPct * factor) * 10) / 10,
    });
  }

  return (
    <Card>
      <CardHeader
        eyebrow="Шаг 2"
        title="Распределение выручки"
        action={
          !isValid && (
            <Button size="sm" variant="outline" onClick={normalize}>
              Нормализовать до 100%
            </Button>
          )
        }
      />
      <div className="space-y-4 px-5 pb-5 pt-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <span className={`h-2 w-2 shrink-0 rounded-full ${f.dot}`} />
            <span className="w-40 shrink-0 text-sm text-white/70">{f.label}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={distribution[f.key]}
              onChange={(e) => onChange({ ...distribution, [f.key]: Number(e.target.value) })}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-brass"
            />
            <div className="w-16 shrink-0 text-right">
              <input
                type="number"
                value={distribution[f.key]}
                onChange={(e) => onChange({ ...distribution, [f.key]: Number(e.target.value) })}
                className="w-16 rounded-md border border-panel-line bg-ink-soft px-2 py-1 text-right text-mono tabular text-sm text-white/90"
              />
            </div>
            <span className="w-3 shrink-0 text-sm text-white/40">%</span>
          </div>
        ))}
        <div className={`text-mono tabular text-right text-xs ${isValid ? 'text-flow' : 'text-garnet'}`}>
          Сумма: {sum.toFixed(1)}%
        </div>
      </div>
    </Card>
  );
}
