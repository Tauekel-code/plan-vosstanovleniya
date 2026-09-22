import { useMemo, useRef, useState } from 'react';
import { useAppStore, type PersistedShape } from '../../store/useAppStore';
import { computeModel } from '../../engine/financialEngine';
import { buildBankViewFromScenario } from '../../engine/bankViewModel';
import {
  buildBankExportPayload,
  buildFullExportPayload,
  downloadCSV,
  downloadJSON,
  downloadPDF,
  downloadXLSX,
  flattenForTable,
  formatPreviewValue,
} from '../../engine/exportEngine';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import clsx from '../../utils/clsx';

type ExportKind = 'full' | 'bank';

export function ExportPanel() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const history = useAppStore((s) => s.history);
  const approvedScenarioId = useAppStore((s) => s.approvedScenarioId);
  const approvedAt = useAppStore((s) => s.approvedAt);
  const revenuePlan = useAppStore((s) => s.revenuePlan);
  const importState = useAppStore((s) => s.importState);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kind, setKind] = useState<ExportKind>('full');
  const model = useMemo(() => computeModel(scenario), [scenario]);

  const bankView = useMemo(() => buildBankViewFromScenario(scenario), [scenario]);

  const payload = kind === 'full' ? buildFullExportPayload(scenario, model, history) : buildBankExportPayload(bankView);
  const previewRows = flattenForTable(payload);
  const title = kind === 'full' ? 'План восстановления — полная модель' : 'План восстановления — версия для банка';
  const filenameBase = kind === 'full' ? 'full-export' : 'bank-export';

  function handleBackup() {
    const shape: PersistedShape = {
      version: 1,
      scenarios,
      activeScenarioId,
      history,
      approvedScenarioId,
      approvedAt,
      revenuePlan,
    };
    downloadJSON(shape, `plan-backup-${new Date().toISOString().slice(0, 10)}.json`);
  }

  function handleImportFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as PersistedShape;
        if (!data.scenarios || !Array.isArray(data.scenarios)) throw new Error('bad shape');
        importState(data);
      } catch {
        alert('Не удалось прочитать файл резервной копии — проверьте, что это корректный JSON, созданный этим приложением.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-display text-2xl font-semibold text-white">Экспорт и данные</h1>
        <p className="mt-1 text-sm text-white/45">
          Два независимых типа экспорта: полная модель и версия для банка. Перед скачиванием — предпросмотр.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setKind('full')}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-medium',
            kind === 'full' ? 'bg-brass text-ink' : 'bg-panel text-white/60 hover:text-white',
          )}
        >
          Full Export
        </button>
        <button
          onClick={() => setKind('bank')}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-medium',
            kind === 'bank' ? 'bg-brass text-ink' : 'bg-panel text-white/60 hover:text-white',
          )}
        >
          Bank Export
        </button>
      </div>

      <Card>
        <CardHeader eyebrow="Предпросмотр" title={title} />
        <div className="px-5 pb-5 pt-4">
          <table className="w-full text-sm">
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="border-b border-panel-line/50">
                  <td className="py-2 text-white/50">{row.Показатель}</td>
                  <td className="py-2 text-right text-mono tabular text-white/90">
                    {formatPreviewValue(row.Значение, row.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kind === 'bank' && (
            <p className="mt-3 text-xs text-white/35">
              Эта версия не содержит зарплату собственника, налоги, резервы и других кредиторов — только данные,
              разрешённые для банка.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-panel-line px-5 py-4">
          <Button variant="outline" onClick={() => downloadJSON(payload, `${filenameBase}.json`)}>
            Экспорт JSON
          </Button>
          <Button variant="outline" onClick={() => downloadCSV(payload, `${filenameBase}.csv`)}>
            Экспорт CSV
          </Button>
          <Button variant="outline" onClick={() => downloadXLSX(payload, `${filenameBase}.xlsx`)}>
            Экспорт Excel
          </Button>
          <Button variant="primary" onClick={() => downloadPDF(payload, `${filenameBase}.pdf`, title)}>
            Экспорт PDF
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader eyebrow="Локальные данные" title="Резервная копия" />
        <div className="flex flex-wrap items-center gap-3 px-5 pb-5 pt-4">
          <Button variant="outline" onClick={handleBackup}>
            Скачать резервную копию JSON
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Импортировать JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        <p className="px-5 pb-5 text-xs text-white/35">
          Все данные хранятся только локально в этом браузере (IndexedDB). Сервер, аккаунты и облачное хранение не
          используются.
        </p>
      </Card>
    </div>
  );
}
