import type { HTMLAttributes } from 'react';
import clsx from '../../utils/clsx';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-panel-line bg-panel shadow-instrument',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5">
      <div>
        {eyebrow && (
          <div className="text-mono text-[11px] uppercase tracking-[0.14em] text-white/40">{eyebrow}</div>
        )}
        <h3 className="text-display text-[15px] font-medium text-white/90">{title}</h3>
      </div>
      {action}
    </div>
  );
}
