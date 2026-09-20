import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { buildBankViewFromScenario } from '../../engine/bankViewModel';
import { buildBankNarrative, narrativeFilename } from '../../engine/narrative';
import { buildNarrativeDocxBlob, downloadNarrativeDocx } from '../../engine/narrativeDocx';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/format';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function BankSummary() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const approvedScenarioId = useAppStore((s) => s.approvedScenarioId);
  const approvedAt = useAppStore((s) => s.approvedAt);
  const approveActiveScenario = useAppStore((s) => s.approveActiveScenario);
  const clearApproval = useAppStore((s) => s.clearApproval);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const isApproved = approvedScenarioId === activeScenarioId && approvedAt !== null;

  const bankView = useMemo(() => buildBankViewFromScenario(scenario), [scenario]);

  const narrative = isApproved ? buildBankNarrative(bankView, scenario.name, approvedAt!) : null;
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  async function handleDownload() {
    if (narrative) {
      await downloadNarrativeDocx(narrative, bankView, narrativeFilename(scenario.name, 'docx'));
      return;
    }
    // Not approved yet — approve first, then build the memo from that exact timestamp.
    const newApprovedAt = approveActiveScenario();
    const freshNarrative = buildBankNarrative(bankView, scenario.name, newApprovedAt);
    await downloadNarrativeDocx(freshNarrative, bankView, narrativeFilename(scenario.name, 'docx'));
  }

  async function handleShare() {
    if (!narrative) return;
    setSharing(true);
    setShareNotice(null);
    try {
      const blob = await buildNarrativeDocxBlob(narrative, bankView);
      const file = new File([blob], narrativeFilename(scenario.name, 'docx'), { type: DOCX_MIME });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title: string; text: string }) => Promise<void>;
      };
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: narrative.title, text: narrative.scenarioLine });
      } else {
        await downloadNarrativeDocx(narrative, bankView, narrativeFilename(scenario.name, 'docx'));
        setShareNotice('Этот браузер не умеет отправлять файлы напрямую — файл скачан, приложите его вручную в письмо или мессенджер.');
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setShareNotice('Не удалось отправить — попробуйте скачать файл и отправить его вручную.');
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="mb-6 flex items-start justify-between print:hidden">
        <div>
          <h1 className="text-display text-2xl font-semibold text-white">Описание</h1>
          <p className="mt-1 text-sm text-white/45">
            Деловой меморандум по текущему сценарию «{scenario.name}» — на основе тех же данных, что видит банк.
          </p>
        </div>
        <div className="flex gap-2">
          {isApproved && (
            <Button variant="outline" onClick={clearApproval}>
              Снять утверждение
            </Button>
          )}
          {isApproved && (
            <Button variant="outline" onClick={handleDownload}>
              Скачать
            </Button>
          )}
          {isApproved && (
            <Button variant="outline" onClick={handleShare} disabled={sharing}>
              {sharing ? 'Отправка…' : 'Отправить'}
            </Button>
          )}
          {isApproved && (
            <Button variant="primary" onClick={() => window.print()}>
              Печать
            </Button>
          )}
        </div>
      </div>

      {shareNotice && (
        <div className="mb-6 rounded-lg border border-brass/30 bg-brass/10 px-4 py-3 text-sm text-brass-soft print:hidden">
          {shareNotice}
        </div>
      )}

      {!isApproved && (
        <Card className="p-8 text-center print:hidden">
          <p className="mx-auto max-w-md text-white/60">
            Проверьте цифры сценария «{scenario.name}» на главном экране, затем скачайте его — здесь появится готовый
            текст меморандума для печати и отправки.
          </p>
          <Button variant="primary" className="mt-5" onClick={handleDownload}>
            Скачать сценарий «{scenario.name}»
          </Button>
        </Card>
      )}

      {narrative && (
        <div className="print-page mx-auto max-w-2xl rounded-2xl border border-panel-line bg-white p-10 text-[#1a1a1a] shadow-instrument print:rounded-none print:border-0 print:shadow-none">
          <div className="mb-8 border-b border-black/10 pb-6">
            <h2 className="text-display text-xl font-semibold">{narrative.title}</h2>
            <p className="mt-2 text-sm text-black/50">{narrative.dateLine}</p>
            <p className="text-sm text-black/50">{narrative.scenarioLine}</p>
          </div>

          <div className="space-y-4 text-[15px] leading-relaxed">
            {narrative.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="my-8 grid grid-cols-2 gap-4 rounded-xl border border-black/10 bg-black/[0.02] p-5 text-sm">
            <SummaryFigure label="Выручка" value={formatCurrency(bankView.revenue)} />
            <SummaryFigure label="Платёж банку" value={formatCurrency(bankView.bankPaymentThisMonth)} />
            <SummaryFigure label="Остаток долга" value={formatCurrency(bankView.bankDebtRemaining)} />
            <SummaryFigure
              label="Доля банка / бизнеса"
              value={`${bankView.bankSharePct}% / ${bankView.businessSharePct}%`}
            />
          </div>

          <p className="text-[15px] leading-relaxed text-black/80">{narrative.closing}</p>

          <div className="mt-12 flex justify-between text-sm text-black/50">
            <div>Подпись: _______________________</div>
            <div>Дата: _______________________</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryFigure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-mono text-[10px] uppercase tracking-[0.12em] text-black/40">{label}</div>
      <div className="text-mono tabular text-base font-semibold">{value}</div>
    </div>
  );
}
