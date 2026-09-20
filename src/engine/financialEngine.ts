/**
 * Financial Engine — the single source of truth (ТЗ §2, §3, §21).
 *
 * Fixed calculation order, never bypassed by any screen, chart, export or
 * presentation mode:
 *
 *   revenue → distribution (bank / other / business) → business budget
 *   → business expenses → free cash flow → debt forecast
 *
 * Business expenses are subtracted from the business budget exactly once.
 * Nothing here re-subtracts expenses or taxes from total revenue.
 */
import type {
  BusinessExpenses,
  DebtForecast,
  DebtForecastMonth,
  DebtState,
  DistributionParams,
  FinancialModel,
  FlowBreakdown,
  ScenarioParams,
  ValidationIssue,
} from './types';
import { validateDistribution, validateFlow, validatePayment } from './validation';

const DEFAULT_HORIZON_MONTHS = 480; // 40 years safety cap — prevents runaway loops when payments can't cover debt

export function sumExpenses(e: BusinessExpenses): number {
  return (
    e.ownerSalary +
    e.employeeReserve +
    e.taxes +
    e.operatingExpenses +
    e.reserveFund +
    e.marketingDevelopment
  );
}

/** Steps 1–5: revenue → distribution → business budget → expenses → free cash flow. */
export function computeFlow(
  revenue: number,
  distribution: DistributionParams,
  expenses: BusinessExpenses,
): FlowBreakdown {
  const bank = revenue * (distribution.bankPct / 100);
  const other = revenue * (distribution.otherPct / 100);
  const businessBudget = revenue * (distribution.businessPct / 100);
  const businessExpensesTotal = sumExpenses(expenses);
  const freeCashFlow = businessBudget - businessExpensesTotal;

  return {
    revenue,
    bank,
    other,
    businessBudget,
    businessExpensesTotal,
    expensesBreakdown: expenses,
    freeCashFlow,
    expensesExceedBudget: freeCashFlow < 0,
  };
}

/** Step 6: month-by-month debt amortisation from the distributed bank/other shares. */
export function computeDebtForecast(
  distribution: DistributionParams,
  debt: DebtState,
  revenueForMonth: (monthIndex: number) => number,
  horizonMonths: number = DEFAULT_HORIZON_MONTHS,
): DebtForecast {
  let bankRemaining = Math.max(0, debt.bankDebt);
  let otherRemaining = Math.max(0, debt.otherDebt);
  const months: DebtForecastMonth[] = [];

  let bankPayoffMonth: number | null = bankRemaining <= 0 ? 0 : null;
  let otherPayoffMonth: number | null = otherRemaining <= 0 ? 0 : null;

  for (let m = 1; m <= horizonMonths; m++) {
    const revenue = Math.max(0, revenueForMonth(m));
    const bankShare = revenue * (distribution.bankPct / 100) + debt.bankExtraPayment;
    const otherShare = revenue * (distribution.otherPct / 100) + debt.otherExtraPayment;

    // Rule §12: once the bank debt is at zero, its freed share is not auto-collected anywhere.
    const bankPayment = bankRemaining > 0 ? Math.min(bankShare, bankRemaining) : 0;
    const otherPayment = otherRemaining > 0 ? Math.min(otherShare, otherRemaining) : 0;

    bankRemaining = Math.max(0, bankRemaining - bankPayment);
    otherRemaining = Math.max(0, otherRemaining - otherPayment);

    if (bankPayoffMonth === null && bankRemaining <= 0) bankPayoffMonth = m;
    if (otherPayoffMonth === null && otherRemaining <= 0) otherPayoffMonth = m;

    months.push({
      monthIndex: m,
      bankPayment,
      otherPayment,
      bankRemaining,
      otherRemaining,
      totalRemaining: bankRemaining + otherRemaining,
    });

    if (bankRemaining <= 0 && otherRemaining <= 0) break;
  }

  const fullPayoffMonth =
    bankPayoffMonth !== null && otherPayoffMonth !== null
      ? Math.max(bankPayoffMonth, otherPayoffMonth)
      : null;

  return {
    months,
    bankPayoffMonth,
    otherPayoffMonth,
    fullPayoffMonth,
    bankPaidOff: bankRemaining <= 0,
  };
}

/** §22: revenue level at which business expenses are fully covered and free cash flow >= 0. */
export function computeMinimumRequiredRevenue(
  distribution: DistributionParams,
  expenses: BusinessExpenses,
): number {
  if (distribution.businessPct <= 0) return Infinity;
  const total = sumExpenses(expenses);
  return total / (distribution.businessPct / 100);
}

export interface ComputeModelOptions {
  horizonMonths?: number;
  /** Growth applied to the *current* monthlyRevenue for the debt-forecast projection, compounded monthly. */
  growthRatePct?: number;
}

/** Assembles the full model for a scenario's current live revenue — the one path every screen reads from. */
export function computeModel(scenario: ScenarioParams, options: ComputeModelOptions = {}): FinancialModel {
  const growthRatePct = options.growthRatePct ?? scenario.growthRatePct ?? 0;
  const flow = computeFlow(scenario.revenue.monthlyRevenue, scenario.distribution, scenario.expenses);

  const revenueForMonth = (monthIndex: number) =>
    scenario.revenue.monthlyRevenue * Math.pow(1 + growthRatePct / 100, monthIndex);

  const debtForecast = computeDebtForecast(
    scenario.distribution,
    scenario.debt,
    revenueForMonth,
    options.horizonMonths,
  );

  const minimumRequiredRevenue = computeMinimumRequiredRevenue(scenario.distribution, scenario.expenses);

  const issues: ValidationIssue[] = [
    ...validateDistribution(scenario.distribution),
    ...validateFlow(flow),
    ...validatePayment(flow.bank + scenario.debt.bankExtraPayment, scenario.debt.bankDebt, 'банк'),
    ...validatePayment(flow.other + scenario.debt.otherExtraPayment, scenario.debt.otherDebt, 'другие обязательства'),
  ];

  const isDistributionValid = !issues.some((i) => i.code === 'DISTRIBUTION_NOT_100');

  return { flow, debtForecast, minimumRequiredRevenue, issues, isDistributionValid };
}
