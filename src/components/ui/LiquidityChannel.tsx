import { motion } from 'framer-motion';
import { formatCurrency, formatPct } from '../../utils/format';
import clsx from '../../utils/clsx';

export interface ChannelSegment {
  key: string;
  label: string;
  value: number;
  pct: number;
  swatchClass: string; // e.g. 'bg-garnet'
  barClass: string; // gradient classes for the flowing bar itself
}

/**
 * The product's signature visual: revenue as a single current that splits
 * into bank / other / business the instant a slider moves. Segment widths
 * spring to their new share; a diagonal shimmer drifts through each
 * segment to read as "live, moving money" rather than a static bar chart.
 */
export function LiquidityChannel({ segments, height = 64 }: { segments: ChannelSegment[]; height?: number }) {
  return (
    <div className="w-full">
      <div
        className="relative flex w-full overflow-hidden rounded-xl border border-panel-line bg-ink-soft"
        style={{ height }}
      >
        {segments.map((seg) => (
          <motion.div
            key={seg.key}
            className={clsx('relative flex items-center justify-center overflow-hidden', seg.barClass)}
            initial={false}
            animate={{ width: `${Math.max(seg.pct, 0)}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <div
              className="pointer-events-none absolute inset-0 animate-flowShimmer opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 2px, transparent 2px, transparent 14px)',
                backgroundSize: '200% 100%',
              }}
            />
          </motion.div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-start gap-2">
            <span className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', seg.swatchClass)} />
            <div>
              <div className="text-mono text-[11px] uppercase tracking-wide text-white/40">{seg.label}</div>
              <div className="text-mono tabular text-sm font-medium text-white/90">
                {formatCurrency(seg.value)}
              </div>
              <div className="text-mono tabular text-[11px] text-white/40">{formatPct(seg.pct)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
