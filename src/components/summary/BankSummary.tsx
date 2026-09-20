import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeDebtForecast } from '../../engine/financialEngine';
import { buildBankView } from '../../engine/bankViewModel';
import { buildBankNarrative } from '../../engine/narrative';
import { downloadNarrativePdf, narrativePdfBlob } from '../../engine/exportEngine';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/format';

function pdfFilename(scenarioName: string) {
  const safeName = scenarioName.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-');
  return `opisanie-${safeName}.pdf`;
}

export function BankSummary() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const approvedScenarioId = useAppStore((s) => s.approvedScenarioId);
  const approvedAt = useAppStore((s) => s.approvedAt);
  const approveActiveScenario = useAppStore((s) => s.approveActiveScenario);
  const clearApproval = useAppStore((s) => s.clearApproval);

  const scenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  const isApproved = approvedScenarioId === activeScenarioId && approvedAt !== null;

  const bankView = useMemo(() => {
    const forecast = computeDebtForecast(
      { bankPct: scenario.distribution.bankPct, otherPct: 0, businessPct: 100 - scenario.distribution.bankPct },
      { bankDebt: scenario.debt.bankDebt, otherDebt: 0, bankExtraPayment: 0, otherExtraPayment: 0, assumedTermMonths: null },
      () => scenario.revenue.monthlyRevenue,
      240,
    );
    return buildBankView({
      revenue: scenario.revenue.monthlyRevenue,
      bankPct: scenario.distribution.bankPct,
      bankDebtRemaining: scenario.debt.bankDebt,
      bankPayoffMonth: forecast.bankPayoffMonth,
      paymentHistory: [],
      forecastMonths: forecast.months,
    });
  }, [scenario]);

  const narrative = isApproved ? buildBankNarrative(bankView, scenario.name, approvedAt!) : null;
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  function handleDownload() {
    if (!narrative) return;
    downloadNarrativePdf(narrative, bankView, pdfFilename(scenario.name));
  }

  async function handleShare() {
    if (!narrative) return;
    setSharing(true);
    setShareNotice(null);
    try {
      const blob = narrativePdfBlob(narrative, bankView);
      const file = new File([blob], pdfFilename(scenario.name), { type: 'application/pdf' });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title: string; text: string }) => Promise<void>;
      };
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: narrative.title, text: narrative.scenarioLine });
      } else {
        downloadNarrativePdf(narrative, bankView, pdfFilename(scenario.name));
        setShareNotice('Этот браузер не умеет отправлять файлы напрямую — PDF скачан, приложите его вручную в письмо или мессенджер.');
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
            Сценарий «{scenario.name}» ещё не утверждён. Проверьте цифры на главном экране и утвердите его — тогда
            здесь появится готовый текст меморандума для печати.
          </p>
          <Button variant="primary" className="mt-5" onClick={approveActiveScenario}>
            Утвердить сценарий «{scenario.name}»
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
