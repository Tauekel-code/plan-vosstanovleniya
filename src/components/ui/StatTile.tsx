import clsx from '../../utils/clsx';
import { AnimatedNumber } from './AnimatedNumber';

interface StatTileProps {
  label: string;
  value: number;
  format: (v: number) => string;
  accent?: 'brass' | 'flow' | 'garnet' | 'neutral' | 'chartBank' | 'chartOther' | 'chartBusiness';
  sub?: string;
  large?: boolean;
  className?: string;
}

const accentText: Record<NonNullable<StatTileProps['accent']>, string> = {
  brass: 'text-brass',
  flow: 'text-flow',
  garnet: 'text-garnet',
  neutral: 'text-white',
  chartBank: 'text-chart-bank',
  chartOther: 'text-chart-other',
  chartBusiness: 'text-chart-business',
};

export function StatTile({ label, value, format, accent = 'neutral', sub, large, className }: StatTileProps) {
  return (
    <div className={clsx('rounded-xl border border-panel-line bg-panel-raised/60 px-4 py-3.5', className)}>
      <div className="text-mono text-[11px] uppercase tracking-[0.12em] text-white/40">{label}</div>
      <AnimatedNumber
        value={value}
        format={format}
        className={clsx(
          'text-mono tabular block truncate font-semibold',
          accentText[accent],
          large ? 'text-2xl' : 'text-lg',
        )}
      />
      {sub && <div className="mt-1 text-xs text-white/35">{sub}</div>}
    </div>
  );
}
