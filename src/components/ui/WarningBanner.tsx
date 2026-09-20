import type { ValidationIssue } from '../../engine/types';
import clsx from '../../utils/clsx';

export function WarningBanner({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="space-y-2">
      {issues.map((issue) => (
        <div
          key={issue.code}
          className={clsx(
            'flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm',
            issue.severity === 'error'
              ? 'border-garnet/40 bg-garnet/10 text-garnet-soft'
              : 'border-brass/30 bg-brass/10 text-brass-soft',
          )}
        >
          <span className="mt-0.5 text-base leading-none">{issue.severity === 'error' ? '⛔' : '⚠'}</span>
          <span>{issue.message}</span>
        </div>
      ))}
    </div>
  );
}
