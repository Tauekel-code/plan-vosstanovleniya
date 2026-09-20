/**
 * jsPDF's built-in fonts (Helvetica/Times/Courier) only cover WinAnsi/Latin
 * glyphs — any Cyrillic text renders as garbled mojibake without this.
 * Registers PT Sans (SIL Open Font License, redistributable) once per
 * document and switches the doc to it.
 */
import type { jsPDF } from 'jspdf';
import { PT_SANS_BOLD_BASE64, PT_SANS_REGULAR_BASE64 } from '../assets/fonts/ptSansBase64';

export function useCyrillicFont(doc: jsPDF): void {
  doc.addFileToVFS('PTSans-Regular.ttf', PT_SANS_REGULAR_BASE64);
  doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
  doc.addFileToVFS('PTSans-Bold.ttf', PT_SANS_BOLD_BASE64);
  doc.addFont('PTSans-Bold.ttf', 'PTSans', 'bold');
  doc.setFont('PTSans', 'normal');
}
