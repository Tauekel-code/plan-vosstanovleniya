/**
 * Scenario Engine (ТЗ §11) — independent named parameter sets.
 * Each scenario carries its own complete ScenarioParams; none of them share
 * state, so editing one never touches another. All computation still runs
 * through the Financial Engine — this module only manages the parameter sets.
 */
import type { ScenarioParams } from './types';

function baseExpenses() {
  return {
    ownerSalary: 500_000,
    employeeReserve: 500_000,
    taxes: 400_000,
    operatingExpenses: 1_500_000,
    reserveFund: 300_000,
    marketingDevelopment: 300_000,
  };
}

function baseDistribution() {
  return { bankPct: 10, otherPct: 10, businessPct: 80 };
}

export function createScenario(
  kind: ScenarioParams['kind'],
  overrides: Partial<ScenarioParams> = {},
): ScenarioParams {
  const presets: Record<ScenarioParams['kind'], Partial<ScenarioParams>> = {
    conservative: {
      name: 'Консервативный',
      growthRatePct: 0,
      revenue: { monthlyRevenue: 8_000_000, plannedRevenue: 8_000_000, forecastRevenue: 8_000_000 },
    },
    base: {
      name: 'Базовый',
      growthRatePct: 1,
      revenue: { monthlyRevenue: 10_000_000, plannedRevenue: 10_000_000, forecastRevenue: 10_000_000 },
    },
    growth: {
      name: 'Рост',
      growthRatePct: 3,
      revenue: { monthlyRevenue: 10_000_000, plannedRevenue: 10_000_000, forecastRevenue: 10_000_000 },
    },
    custom: {
      name: 'Пользовательский',
      growthRatePct: 0,
      revenue: { monthlyRevenue: 10_000_000, plannedRevenue: 10_000_000, forecastRevenue: 10_000_000 },
    },
  };

  const preset = presets[kind];

  return {
    id: overrides.id ?? crypto.randomUUID(),
    kind,
    name: preset.name ?? kind,
    growthRatePct: preset.growthRatePct ?? 0,
    revenue: preset.revenue ?? { monthlyRevenue: 10_000_000, plannedRevenue: 10_000_000, forecastRevenue: 10_000_000 },
    distribution: baseDistribution(),
    expenses: baseExpenses(),
    debt: {
      bankDebt: 24_000_000,
      otherDebt: 18_000_000,
      bankExtraPayment: 0,
      otherExtraPayment: 0,
      assumedTermMonths: null,
    },
    ...overrides,
  };
}

export function createDefaultScenarios(): ScenarioParams[] {
  return [
    createScenario('conservative'),
    createScenario('base'),
    createScenario('growth'),
  ];
}

export function cloneScenarioAsCustom(source: ScenarioParams, name = 'Пользовательский'): ScenarioParams {
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    kind: 'custom',
    name,
  };
}
