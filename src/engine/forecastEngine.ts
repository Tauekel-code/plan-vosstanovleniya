/**
 * Forecast Engine (ТЗ §8) — historical averages and a trend projection.
 * Never presents a forecast as a guaranteed number; callers should always
 * surface `warning` alongside any projected figure.
 */
import { addMonths, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { MonthlyActual } from './types';

export interface ForecastResult {
  avg3: number | null;
  avg6: number | null;
  avg12: number | null;
  trendRevenue: number | null;
  sampleSize: number;
  warning: string | null;
}

const MIN_SAMPLES_FOR_TREND = 3;

function actualsOnly(history: MonthlyActual[]): number[] {
  return history
    .filter((m) => m.actualRevenue !== null)
    .map((m) => m.actualRevenue as number);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function lastN(values: number[], n: number): number[] {
  return values.slice(Math.max(0, values.length - n));
}

/** Simple linear regression over the actuals' index, projected one step ahead. */
function trend(values: number[]): number | null {
  if (values.length < MIN_SAMPLES_FOR_TREND) return null;
  const n = values.length;
  const xs = values.map((_, i) => i);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (values[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return intercept + slope * n; // project one step past the last known point
}

export function computeForecast(history: MonthlyActual[]): ForecastResult {
  const actuals = actualsOnly(history);

  const result: ForecastResult = {
    avg3: average(lastN(actuals, 3)),
    avg6: average(lastN(actuals, 6)),
    avg12: average(lastN(actuals, 12)),
    trendRevenue: trend(actuals),
    sampleSize: actuals.length,
    warning: null,
  };

  if (actuals.length < MIN_SAMPLES_FOR_TREND) {
    result.warning = 'Недостаточно фактических данных для надёжного прогноза.';
  }

  return result;
}

export function projectedPayoffDate(monthsFromNow: number | null): string | null {
  if (monthsFromNow === null) return null;
  return format(addMonths(new Date(), monthsFromNow), 'LLLL yyyy', { locale: ru });
}
