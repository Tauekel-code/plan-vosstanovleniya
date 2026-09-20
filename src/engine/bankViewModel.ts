/**
 * BankViewModel — physically separated from the full financial model (ТЗ §14).
 *
 * This is not a UI filter: `BankView` is its own type, and `buildBankView`
 * only accepts the handful of primitive values a bank is allowed to see.
 * There is no way to pass owner salary, taxes, other creditors, reserves or
 * notes into this function — the compiler rejects it — so no future screen,
 * export or share link built on top of BankView can leak internal data by
 * accident.
 */
import type { DebtForecastMonth } from './types';

export interface BankViewInput {
  revenue: number;
  bankPct: number;
  bankDebtRemaining: number;
  bankPayoffMonth: number | null;
  paymentHistory: { month: string; amount: number }[];
  forecastMonths: Pick<DebtForecastMonth, 'monthIndex' | 'bankPayment' | 'bankRemaining'>[];
  revenueScenarioDeltaPct?: number; // for the "what if revenue changes" bank-facing slider
  bankPctScenarioValue?: number; // for the "what if bank share changes" bank-facing slider
}

export interface BankView {
  revenue: number;
  bankSharePct: number;
  businessSharePct: number;
  bankPaymentThisMonth: number;
  bankDebtRemaining: number;
  bankPayoffMonth: number | null;
  paymentHistory: { month: string; amount: number }[];
  payoffSchedule: { monthIndex: number; payment: number; remaining: number }[];
  revenueScenarioDeltaPct: number;
  bankPctScenarioValue: number;
}

export function buildBankView(input: BankViewInput): BankView {
  return {
    revenue: input.revenue,
    bankSharePct: input.bankPct,
    // The bank is never told other creditors exist (ТЗ §14, demo in §26): everything
    // that isn't the bank's share reads simply as "business" from this side of the wall.
    businessSharePct: 100 - input.bankPct,
    bankPaymentThisMonth: input.revenue * (input.bankPct / 100),
    bankDebtRemaining: Math.max(0, input.bankDebtRemaining),
    bankPayoffMonth: input.bankPayoffMonth,
    paymentHistory: input.paymentHistory,
    payoffSchedule: input.forecastMonths.map((m) => ({
      monthIndex: m.monthIndex,
      payment: m.bankPayment,
      remaining: m.bankRemaining,
    })),
    revenueScenarioDeltaPct: input.revenueScenarioDeltaPct ?? 0,
    bankPctScenarioValue: input.bankPctScenarioValue ?? input.bankPct,
  };
}

/** Keys allowed in a Bank Export — used as a runtime allowlist so serialization can't widen. */
export const BANK_VIEW_ALLOWED_KEYS: (keyof BankView)[] = [
  'revenue',
  'bankSharePct',
  'businessSharePct',
  'bankPaymentThisMonth',
  'bankDebtRemaining',
  'bankPayoffMonth',
  'paymentHistory',
  'payoffSchedule',
  'revenueScenarioDeltaPct',
  'bankPctScenarioValue',
];

export function serializeBankView(view: BankView): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of BANK_VIEW_ALLOWED_KEYS) out[key] = view[key];
  return out;
}
