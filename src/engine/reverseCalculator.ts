/**
 * Reverse Calculator (ТЗ §10) — "I want to pay off the debt in X months".
 * Works backward from a target horizon to the required payment and revenue,
 * using the same distribution parameters the Financial Engine uses forward.
 */
import type { DistributionParams, ScenarioParams } from './types';

export interface ReverseCalculatorResult {
  targetMonths: number;
  totalDebt: number;
  requiredMonthlyPayment: number;
  requiredRevenue: number;
  requiredRevenueSharePct: number;
  currentRevenue: number;
  deficit: number; // positive: current revenue falls short; negative: current revenue already exceeds requirement
}

export function computeReverseCalculator(
  scenario: ScenarioParams,
  targetMonths: number,
): ReverseCalculatorResult {
  const totalDebt = scenario.debt.bankDebt + scenario.debt.otherDebt;
  const obligationsPct: DistributionParams['bankPct'] = scenario.distribution.bankPct + scenario.distribution.otherPct;

  const requiredMonthlyPayment = targetMonths > 0 ? totalDebt / targetMonths : Infinity;
  const requiredRevenue = obligationsPct > 0 ? requiredMonthlyPayment / (obligationsPct / 100) : Infinity;

  return {
    targetMonths,
    totalDebt,
    requiredMonthlyPayment,
    requiredRevenue,
    requiredRevenueSharePct: obligationsPct,
    currentRevenue: scenario.revenue.monthlyRevenue,
    deficit: requiredRevenue - scenario.revenue.monthlyRevenue,
  };
}
