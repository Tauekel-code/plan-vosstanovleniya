/**
 * Revenue Plan — a bottom-up alternative to typing a flat monthly revenue
 * number: revenue built from unit economics instead. Two income lines that
 * behave completely differently over time:
 *
 *   sales revenue   = units sold this month × unit price        (flat, if the
 *                      monthly sales rate is held constant)
 *   support revenue  = cumulative subscriber base × monthly fee  (compounds —
 *                      every unit ever sold keeps paying every month after)
 *
 * The point of separating them: a buyer only has to believe a constant,
 * modest monthly sales rate for the recurring support income to keep growing
 * on its own — useful to show both to the owner and, later, a creditor.
 */

export interface RevenuePlanParams {
  avgUnitsPerMonth: number;
  unitPrice: number;
  monthlySupportFee: number;
  startingSubscribers: number;
  horizonMonths: number;
}

export interface RevenuePlanMonth {
  monthIndex: number;
  unitsSold: number;
  cumulativeSubscribers: number;
  salesRevenue: number;
  supportRevenue: number;
  totalRevenue: number;
}

export interface RevenuePlanResult {
  months: RevenuePlanMonth[];
  firstMonth: RevenuePlanMonth;
  lastMonth: RevenuePlanMonth;
}

export function defaultRevenuePlanParams(): RevenuePlanParams {
  return {
    avgUnitsPerMonth: 10,
    unitPrice: 200_000,
    monthlySupportFee: 20_000,
    startingSubscribers: 0,
    horizonMonths: 24,
  };
}

export function computeRevenuePlan(params: RevenuePlanParams): RevenuePlanResult {
  const months: RevenuePlanMonth[] = [];
  let cumulative = Math.max(0, params.startingSubscribers);

  for (let m = 1; m <= params.horizonMonths; m++) {
    cumulative += params.avgUnitsPerMonth;
    const salesRevenue = params.avgUnitsPerMonth * params.unitPrice;
    const supportRevenue = cumulative * params.monthlySupportFee;
    months.push({
      monthIndex: m,
      unitsSold: params.avgUnitsPerMonth,
      cumulativeSubscribers: cumulative,
      salesRevenue,
      supportRevenue,
      totalRevenue: salesRevenue + supportRevenue,
    });
  }

  return { months, firstMonth: months[0], lastMonth: months[months.length - 1] };
}
