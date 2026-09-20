import { useAppStore } from '../../store/useAppStore';
import { computeModel } from '../../engine/financialEngine';
import { ModelStatusBadge } from '../ui/ModelStatusBadge';

export function TopBar({ onOpenNav }: { onOpenNav?: () => void }) {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const setActiveScenarioId = useAppStore((s) => s.setActiveScenarioId);
  const active = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const model = computeModel(active);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-panel-line bg-ink px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          onClick={onOpenNav}
          aria-label="Открыть меню"
          className="shrink-0 rounded-lg border border-panel-line p-2 text-white/70 hover:text-white lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <select
          value={activeScenarioId}
          onChange={(e) => setActiveScenarioId(e.target.value)}
          className="min-w-0 rounded-lg border border-panel-line bg-panel px-2.5 py-1.5 text-sm text-white/85 focus:border-brass/50 sm:px-3"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="hidden sm:block">
          <ModelStatusBadge model={model} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-mono text-xs text-white/30 lg:block">
          {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
