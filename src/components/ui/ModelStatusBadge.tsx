import clsx from '../../utils/clsx';
import type { FinancialModel } from '../../engine/types';

export function ModelStatusBadge({ model }: { model: FinancialModel }) {
  const hasError = model.issues.some((i) => i.severity === 'error');
  const hasWarning = model.issues.some((i) => i.severity === 'warning');

  const label = hasError ? 'Требует внимания' : hasWarning ? 'Есть предупреждения' : 'Модель устойчива';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        hasError
          ? 'bg-garnet/15 text-garnet-soft'
          : hasWarning
            ? 'bg-brass/15 text-brass-soft'
            : 'bg-flow/15 text-flow-soft',
      )}
    >
      <span
        className={clsx(
          'h-1.5 w-1.5 rounded-full',
          hasError ? 'bg-garnet' : hasWarning ? 'bg-brass' : 'bg-flow',
        )}
      />
      {label}
    </span>
  );
}
