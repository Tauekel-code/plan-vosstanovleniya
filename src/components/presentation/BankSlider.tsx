import type { CSSProperties } from 'react';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  marks?: number[];
  colorVar: string; // css color for the fill/thumb
}

export function BankSlider({ label, value, min, max, step, format, onChange, marks, colorVar }: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-mono text-xs uppercase tracking-[0.14em] text-[#6b6558]">{label}</span>
        <AnimatedNumber
          value={value}
          format={format}
          className="text-mono tabular text-4xl font-semibold sm:text-5xl"
          style={{ color: colorVar } satisfies CSSProperties}
        />
      </div>
      <div className="relative mt-4">
        <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-[#0B0E17]/8" />
        <div
          className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{ width: `${pct}%`, background: colorVar }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
          className="relative z-10 h-9 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-[0_4px_14px_rgba(11,14,23,0.25)]
            [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white"
          style={{ accentColor: colorVar }}
        />
      </div>
      {marks && (
        <div className="mt-1 flex justify-between text-mono text-[11px] tabular text-[#8a8471]">
          {marks.map((m) => (
            <button key={m} type="button" onClick={() => onChange(m)} className="hover:text-[#3a362c]">
              {format(m)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
