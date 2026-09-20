/**
 * Generates a business-register written summary of the bank-safe view of a
 * scenario — the text a printed memo to a bank hands over. Built strictly on
 * top of BankView, so it inherits the same §14 data boundary as everything
 * else shown to a creditor: no internal expense breakdown, no other
 * creditors, no owner compensation.
 */
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BankView } from './bankViewModel';
import { formatCurrency, formatMonths } from '../utils/format';

export interface BankNarrative {
  title: string;
  dateLine: string;
  scenarioLine: string;
  paragraphs: string[];
  closing: string;
}

export function narrativePdfFilename(scenarioName: string): string {
  const safeName = scenarioName.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-');
  return `opisanie-${safeName}.pdf`;
}

export function buildBankNarrative(
  bankView: BankView,
  scenarioName: string,
  approvedAt: string,
): BankNarrative {
  const approvedDate = format(new Date(approvedAt), 'd MMMM yyyy', { locale: ru });
  const payoff = formatMonths(bankView.bankPayoffMonth);

  const paragraphs: string[] = [
    `Настоящий документ описывает согласованный механизм восстановления денежного потока и последовательного погашения обязательств перед банком. Сценарий «${scenarioName}» утверждён ${approvedDate} и является рабочей моделью, на основании которой строится график погашения.`,

    `При текущем уровне месячной выручки ${formatCurrency(bankView.revenue)} на обслуживание обязательств перед банком направляется ${bankView.bankSharePct} % — это ${formatCurrency(bankView.bankPaymentThisMonth)} ежемесячно. Оставшаяся часть выручки, ${bankView.businessSharePct} %, обеспечивает операционную деятельность компании, за счёт которой поддерживается и наращивается сама выручка.`,

    `Текущий остаток задолженности перед банком составляет ${formatCurrency(bankView.bankDebtRemaining)}. При сохранении заданного порядка распределения выручки и текущего темпа поступлений прогнозный срок полного погашения — ${payoff}`,

    `Ключевая особенность модели: размер платежа банку рассчитывается как фиксированная доля от фактической выручки, а не как оценка на основе прогноза. Это означает, что рост деловой активности компании напрямую и пропорционально увеличивает сумму, направляемую на погашение, без необходимости пересмотра условий.`,
  ];

  const closing = `Мы не обещаем гарантированный результат — мы предлагаем прозрачный и проверяемый механизм, при котором увеличение выручки напрямую конвертируется в ускоренное погашение обязательств. Любые изменения фактической выручки отражаются в этом расчёте в реальном времени и могут быть продемонстрированы на встрече.`;

  return {
    title: 'Меморандум о плане восстановления денежного потока',
    dateLine: `Дата документа: ${approvedDate}`,
    scenarioLine: `Сценарий: ${scenarioName}`,
    paragraphs,
    closing,
  };
}
