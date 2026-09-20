import clsx from '../../utils/clsx';
import type { ConsoleScreen } from '../../store/useAppStore';
import { useAppStore } from '../../store/useAppStore';

const NAV: { key: ConsoleScreen; label: string; hint: string }[] = [
  { key: 'dashboard', label: 'Главный экран', hint: 'Поток и обязательства' },
  { key: 'planActual', label: 'План / Факт', hint: 'По месяцам' },
  { key: 'whatIf', label: 'Что будет, если…', hint: 'Моделирование' },
  { key: 'reverse', label: 'Обратный калькулятор', hint: 'От срока к выручке' },
  { key: 'scenarios', label: 'Сценарии', hint: 'Консервативный / Базовый / Рост' },
  { key: 'summary', label: 'Описание', hint: 'Меморандум для печати' },
  { key: 'export', label: 'Экспорт и данные', hint: 'PDF · Excel · CSV · JSON' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const consoleScreen = useAppStore((s) => s.consoleScreen);
  const setConsoleScreen = useAppStore((s) => s.setConsoleScreen);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-panel-line bg-ink-soft">
      <div className="px-5 pb-5 pt-6">
        <div className="text-display text-[15px] font-semibold tracking-tight text-white">
          План восстановления
        </div>
        <div className="mt-0.5 text-mono text-[11px] uppercase tracking-[0.12em] text-white/35">
          Полный финансовый режим
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              setConsoleScreen(item.key);
              onNavigate?.();
            }}
            className={clsx(
              'block w-full rounded-lg px-3 py-2.5 text-left transition-colors',
              consoleScreen === item.key
                ? 'bg-panel-raised text-white'
                : 'text-white/55 hover:bg-white/5 hover:text-white/85',
            )}
          >
            <div className="text-sm font-medium">{item.label}</div>
            <div className="text-[11px] text-white/35">{item.hint}</div>
          </button>
        ))}
      </nav>
    </aside>
  );
}
