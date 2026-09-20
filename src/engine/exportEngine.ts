/**
 * Export Engine (ТЗ §17) — two independent export paths.
 * `buildFullExportPayload` reads the whole scenario + model; `buildBankExportPayload`
 * only ever touches a `BankView`, so a Bank Export can never carry Full data
 * even if this module is extended later.
 */
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FinancialModel, MonthlyActual, ScenarioParams } from './types';
import type { BankView } from './bankViewModel';
import { serializeBankView } from './bankViewModel';
import { formatCurrency } from '../utils/format';

export type ExportKind = 'full' | 'bank';
export type ExportFormat = 'json' | 'csv' | 'xlsx' | 'pdf';

export function buildFullExportPayload(
  scenario: ScenarioParams,
  model: FinancialModel,
  history: MonthlyActual[],
) {
  return {
    exportType: 'full' as const,
    generatedAt: new Date().toISOString(),
    scenario,
    flow: model.flow,
    debtForecast: {
      bankPayoffMonth: model.debtForecast.bankPayoffMonth,
      otherPayoffMonth: model.debtForecast.otherPayoffMonth,
      fullPayoffMonth: model.debtForecast.fullPayoffMonth,
      months: model.debtForecast.months,
    },
    minimumRequiredRevenue: model.minimumRequiredRevenue,
    planVsActual: history,
  };
}

export function buildBankExportPayload(
  bankView: BankView,
): { exportType: 'bank'; generatedAt: string } & BankView {
  return {
    exportType: 'bank' as const,
    generatedAt: new Date().toISOString(),
    ...serializeBankView(bankView),
  } as { exportType: 'bank'; generatedAt: string } & BankView;
}

export function toJSON(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

export type PreviewUnit = 'currency' | 'percent' | 'months' | 'text';
export interface PreviewRow {
  Показатель: string;
  Значение: number | string;
  unit: PreviewUnit;
}

export function formatPreviewValue(value: number | string, unit: PreviewUnit): string {
  if (typeof value !== 'number') return String(value);
  if (unit === 'currency') return formatCurrency(value);
  if (unit === 'percent') return `${value.toFixed(0)}%`;
  if (unit === 'months') return `${value} мес.`;
  return String(value);
}

export function flattenForTable(
  payload: ReturnType<typeof buildFullExportPayload> | ReturnType<typeof buildBankExportPayload>,
): PreviewRow[] {
  if (payload.exportType === 'bank') {
    const p = payload as ReturnType<typeof buildBankExportPayload>;
    return [
      { Показатель: 'Выручка', Значение: p.revenue, unit: 'currency' },
      { Показатель: 'Доля банка, %', Значение: p.bankSharePct, unit: 'percent' },
      { Показатель: 'Доля бизнеса, %', Значение: p.businessSharePct, unit: 'percent' },
      { Показатель: 'Платёж банку в этом месяце', Значение: p.bankPaymentThisMonth, unit: 'currency' },
      { Показатель: 'Остаток долга банку', Значение: p.bankDebtRemaining, unit: 'currency' },
      { Показатель: 'Прогнозный месяц погашения', Значение: p.bankPayoffMonth ?? '—', unit: 'months' },
    ];
  }
  const p = payload as ReturnType<typeof buildFullExportPayload>;
  return [
    { Показатель: 'Выручка', Значение: p.flow.revenue, unit: 'currency' },
    { Показатель: 'Банк', Значение: p.flow.bank, unit: 'currency' },
    { Показатель: 'Другие обязательства', Значение: p.flow.other, unit: 'currency' },
    { Показатель: 'Бюджет бизнеса', Значение: p.flow.businessBudget, unit: 'currency' },
    { Показатель: 'Расходы бизнеса', Значение: p.flow.businessExpensesTotal, unit: 'currency' },
    { Показатель: 'Свободный денежный поток', Значение: p.flow.freeCashFlow, unit: 'currency' },
    { Показатель: 'Минимально необходимая выручка', Значение: p.minimumRequiredRevenue, unit: 'currency' },
    { Показатель: 'Месяц полного погашения', Значение: p.debtForecast.fullPayoffMonth ?? '—', unit: 'months' },
  ];
}

export function toCSV(payload: ReturnType<typeof buildFullExportPayload> | ReturnType<typeof buildBankExportPayload>): string {
  const rows = flattenForTable(payload);
  const header = 'Показатель,Значение';
  const body = rows.map((r) => `"${r.Показатель}","${r.Значение}"`).join('\n');
  return `${header}\n${body}`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(payload: unknown, filename: string) {
  download(new Blob([toJSON(payload)], { type: 'application/json' }), filename);
}

export function downloadCSV(
  payload: ReturnType<typeof buildFullExportPayload> | ReturnType<typeof buildBankExportPayload>,
  filename: string,
) {
  download(new Blob([toCSV(payload)], { type: 'text/csv;charset=utf-8' }), filename);
}

export function downloadXLSX(
  payload: ReturnType<typeof buildFullExportPayload> | ReturnType<typeof buildBankExportPayload>,
  filename: string,
) {
  const rows = flattenForTable(payload).map((r) => ({
    Показатель: r.Показатель,
    Значение: formatPreviewValue(r.Значение, r.unit),
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Модель');
  XLSX.writeFile(book, filename);
}

export function downloadPDF(
  payload: ReturnType<typeof buildFullExportPayload> | ReturnType<typeof buildBankExportPayload>,
  filename: string,
  title: string,
) {
  const rows = flattenForTable(payload);
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 18);
  doc.setFontSize(9);
  doc.text(`Сформировано: ${new Date().toLocaleDateString('ru-RU')}`, 14, 25);

  autoTable(doc, {
    startY: 32,
    head: [['Показатель', 'Значение']],
    body: rows.map((r) => [r.Показатель, formatPreviewValue(r.Значение, r.unit)]),
    headStyles: { fillColor: [20, 27, 41] },
  });

  doc.save(filename);
}
