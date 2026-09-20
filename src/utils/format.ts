const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const nfCompact = new Intl.NumberFormat('ru-RU', { notation: 'compact', maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '—';
  return `${nf.format(Math.round(value))} ₸`;
}

export function formatCurrencyCompact(value: number): string {
  if (!isFinite(value)) return '—';
  return `${nfCompact.format(value)} ₸`;
}

export function formatNumber(value: number): string {
  if (!isFinite(value)) return '—';
  return nf.format(Math.round(value));
}

export function formatPct(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function formatMonths(months: number | null): string {
  if (months === null) return '—';
  if (months === 0) return 'уже погашено';
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 0) return `${months} мес.`;
  if (rest === 0) return `${years} г.`;
  return `${years} г. ${rest} мес.`;
}
