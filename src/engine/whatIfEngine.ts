/**
 * What-if Engine (ТЗ §9) — computes a "before / after" pair without ever
 * mutating the base scenario. Overrides are applied to a deep-cloned copy;
 * the caller's original scenario object is untouched.
 */
import { computeModel } from './financialEngine';
import type { FinancialModel, ScenarioParams } from './types';

export type WhatIfOverrides = {
  monthlyRevenue?: number;
  bankPct?: number;
  otherPct?: number;
  businessPct?: number;
  ownerSalary?: number;
  employeeReserve?: number;
  taxes?: number;
  operatingExpenses?: number;
  reserveFund?: number;
  marketingDevelopment?: number;
  bankDebt?: number;
  otherDebt?: number;
  bankExtraPayment?: number;
  otherExtraPayment?: number;
  growthRatePct?: number;
};

export interface WhatIfResult {
  before: FinancialModel;
  after: FinancialModel;
  overriddenScenario: ScenarioParams;
}

export function applyWhatIf(base: ScenarioParams, overrides: WhatIfOverrides): ScenarioParams {
  const draft = structuredClone(base);

  if (overrides.monthlyRevenue !== undefined) draft.revenue.monthlyRevenue = overrides.monthlyRevenue;
  if (overrides.growthRatePct !== undefined) draft.growthRatePct = overrides.growthRatePct;

  if (overrides.bankPct !== undefined) draft.distribution.bankPct = overrides.bankPct;
  if (overrides.otherPct !== undefined) draft.distribution.otherPct = overrides.otherPct;
  if (overrides.businessPct !== undefined) draft.distribution.businessPct = overrides.businessPct;

  if (overrides.ownerSalary !== undefined) draft.expenses.ownerSalary = overrides.ownerSalary;
  if (overrides.employeeReserve !== undefined) draft.expenses.employeeReserve = overrides.employeeReserve;
  if (overrides.taxes !== undefined) draft.expenses.taxes = overrides.taxes;
  if (overrides.operatingExpenses !== undefined) draft.expenses.operatingExpenses = overrides.operatingExpenses;
  if (overrides.reserveFund !== undefined) draft.expenses.reserveFund = overrides.reserveFund;
  if (overrides.marketingDevelopment !== undefined)
    draft.expenses.marketingDevelopment = overrides.marketingDevelopment;

  if (overrides.bankDebt !== undefined) draft.debt.bankDebt = overrides.bankDebt;
  if (overrides.otherDebt !== undefined) draft.debt.otherDebt = overrides.otherDebt;
  if (overrides.bankExtraPayment !== undefined) draft.debt.bankExtraPayment = overrides.bankExtraPayment;
  if (overrides.otherExtraPayment !== undefined) draft.debt.otherExtraPayment = overrides.otherExtraPayment;

  return draft;
}

export function runWhatIf(base: ScenarioParams, overrides: WhatIfOverrides): WhatIfResult {
  const overriddenScenario = applyWhatIf(base, overrides);
  return {
    before: computeModel(base),
    after: computeModel(overriddenScenario),
    overriddenScenario,
  };
}
