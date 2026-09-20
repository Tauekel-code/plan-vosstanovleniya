import type { TooltipProps } from 'recharts';
import { formatCurrency, formatMonths } from '../../utils/format';

export const CHART_COLORS = {
  bank: '#3987E5',
  other: '#D95926',
  business: '#199E70',
  grid: 'rgba(255,255,255,0.06)',
  axis: 'rgba(255,255,255,0.35)',
};

export const CHART_COLORS_LIGHT = {
  bank: '#2A78D6',
  other: '#EB6834',
  business: '#1BAF7A',
  grid: 'rgba(11,14,23,0.08)',
  axis: 'rgba(11,14,23,0.45)',
};

export function CurrencyTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-line bg-panel px-3 py-2 text-xs shadow-instrument">
      <div className="mb-1 text-mono text-white/40">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="flex items-center gap-2 text-mono tabular">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium text-white/90">{formatCurrency(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-panel-line bg-panel px-3 py-2 text-xs shadow-instrument">
      <div className="mb-1 text-mono text-white/40">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey as string} className="flex items-center gap-2 text-mono tabular">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-medium text-white/90">{formatMonths(p.value as number)}</span>
        </div>
      ))}
    </div>
  );
}
