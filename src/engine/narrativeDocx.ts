/**
 * Builds the approved-scenario memo as an editable .docx — a PDF can't be
 * marked up or adjusted by whoever receives it, a Word file can. Mirrors the
 * printed layout in BankSummary.tsx: same sections, same numbers, same
 * bank-safe BankView boundary.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import type { BankNarrative } from './narrative';
import type { BankView } from './bankViewModel';
import { formatCurrency } from '../utils/format';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
// Cell-level "none" borders can still lose to Word's default table-level borders on
// the shared inner edges, so the table itself needs every edge silenced too.
const NO_TABLE_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

function figureCell(label: string, value: string) {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    shading: { type: ShadingType.CLEAR, fill: 'F7F7F5' },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 160, bottom: 160, left: 160, right: 160 },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: label.toUpperCase(), size: 16, color: '888888' })],
      }),
      new Paragraph({
        children: [new TextRun({ text: value, size: 24, bold: true })],
      }),
    ],
  });
}

export function buildNarrativeDocxBlob(narrative: BankNarrative, bankView: BankView): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
            children: [new TextRun({ text: narrative.title })],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: narrative.dateLine, size: 20, color: '777777' })],
          }),
          new Paragraph({
            spacing: { after: 280 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD', space: 8 } },
            children: [new TextRun({ text: narrative.scenarioLine, size: 20, color: '777777' })],
          }),

          ...narrative.paragraphs.map(
            (p) =>
              new Paragraph({
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 220, line: 300 },
                children: [new TextRun({ text: p, size: 23 })],
              }),
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_TABLE_BORDERS,
            rows: [
              new TableRow({
                children: [
                  figureCell('Выручка', formatCurrency(bankView.revenue)),
                  figureCell('Платёж банку', formatCurrency(bankView.bankPaymentThisMonth)),
                ],
              }),
              new TableRow({
                children: [
                  figureCell('Остаток долга', formatCurrency(bankView.bankDebtRemaining)),
                  figureCell('Доля банка / бизнеса', `${bankView.bankSharePct}% / ${bankView.businessSharePct}%`),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 280, after: 480, line: 300 },
            alignment: AlignmentType.JUSTIFIED,
            children: [new TextRun({ text: narrative.closing, size: 23, color: '444444' })],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_TABLE_BORDERS,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: NO_BORDERS,
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Подпись: ______________________', size: 20, color: '666666' })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: NO_BORDERS,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: 'Дата: ______________________', size: 20, color: '666666' })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadNarrativeDocx(narrative: BankNarrative, bankView: BankView, filename: string) {
  const blob = await buildNarrativeDocxBlob(narrative, bankView);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
