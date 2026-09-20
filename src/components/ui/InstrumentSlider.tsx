import { useMemo } from 'react';
import clsx from '../../utils/clsx';
import { AnimatedNumber } from './AnimatedNumber';

interface InstrumentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format: (v: number) => string;
  marks?: number[];
  accent?: 'brass' | 'flow' | 'garnet';
  size?: 'default' | 'hero';
}

const accentClasses: Record<NonNullable<InstrumentSliderProps['accent']>, { track: string; glow: string; text: string }> = {
  brass: { track: 'accent-brass', glow: 'shadow-glow', text: 'text-brass' },
  flow: { track: 'accent-flow', glow: 'shadow-[0_0_24px_rgba(79,189,175,0.35)]', text: 'text-flow' },
  garnet: { track: 'accent-garnet', glow: 'shadow-[0_0_24px_rgba(192,91,77,0.35)]', text: 'text-garnet' },
};

export function InstrumentSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  marks,
  accent = 'brass',
  size = 'default',
}: InstrumentSliderProps) {
  const pct = useMemo(() => ((value - min) / (max - min)) * 100, [value, min, max]);
  const a = accentClasses[accent];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-mono text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</span>
        <AnimatedNumber
          value={value}
          format={format}
          className={clsx(
            'text-mono tabular font-semibold',
            a.text,
            size === 'hero' ? 'text-4xl sm:text-5xl' : 'text-xl',
          )}
        />
      </div>

      <div className="relative pt-1">
        {/* instrument-scale ticks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between px-[2px]">
          {Array.from({ length: 21 }).map((_, i) => (
            <span
              key={i}
              className={clsx('w-px bg-white/10', i % 5 === 0 ? 'h-2.5' : 'h-1.5')}
            />
          ))}
        </div>

        <div className="relative mt-3">
          <div
            className={clsx(
              'absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full',
              accent === 'brass' && 'bg-brass',
              accent === 'flow' && 'bg-flow',
              accent === 'garnet' && 'bg-garnet',
            )}
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/10" />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={clsx(
              'relative z-10 w-full cursor-pointer appearance-none bg-transparent',
              size === 'hero' ? 'h-8' : 'h-6',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink [&::-webkit-slider-thumb]:bg-white',
              size === 'hero'
                ? '[&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7'
                : '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
              a.glow,
              '[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-white',
            )}
            aria-label={label}
          />
        </div>

        {marks && (
          <div className="mt-2 flex justify-between text-mono text-[10px] tabular text-white/35">
            {marks.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(m)}
                className="hover:text-white/70"
              >
                {format(m)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
