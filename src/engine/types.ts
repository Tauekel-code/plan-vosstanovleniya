// Core domain types shared by every engine module.
// This file has zero UI dependencies — engines must stay independent of the interface (ТЗ §20).

export interface DistributionParams {
  bankPct: number; // 0..100
  otherPct: number; // 0..100
  businessPct: number; // 0..100
}

export interface BusinessExpenses {
  ownerSalary: number;
  employeeReserve: number;
  taxes: number;
  operatingExpenses: number;
  reserveFund: number;
  marketingDevelopment: number;
}

export interface DebtState {
  bankDebt: number;
  otherDebt: number;
  bankExtraPayment: number; // additional payment beyond the distributed share
  otherExtraPayment: number;
  assumedTermMonths: number | null; // user's assumed payoff horizon, optional
}

export interface RevenueParams {
  monthlyRevenue: number; // current/working revenue used for live calculations
  plannedRevenue: number;
  forecastRevenue: number;
}

export interface ScenarioParams {
  id: string;
  name: string;
  kind: 'conservative' | 'base' | 'growth' | 'custom';
  revenue: RevenueParams;
  growthRatePct: number; // monthly growth assumption used by forecast/scenario projections
  distribution: DistributionParams;
  expenses: BusinessExpenses;
  debt: DebtState;
  notes?: string;
}

// Result of Step 1-5 of the ТЗ §2 calculation chain, for one revenue value.
export interface FlowBreakdown {
  revenue: number;
  bank: number;
  other: number;
  businessBudget: number;
  businessExpensesTotal: number;
  expensesBreakdown: BusinessExpenses;
  freeCashFlow: number;
  expensesExceedBudget: boolean;
}

export interface DebtForecastMonth {
  monthIndex: number;
  bankPayment: number;
  otherPayment: number;
  bankRemaining: number;
  otherRemaining: number;
  totalRemaining: number;
}

export interface DebtForecast {
  months: DebtForecastMonth[];
  bankPayoffMonth: number | null;
  otherPayoffMonth: number | null;
  fullPayoffMonth: number | null;
  bankPaidOff: boolean;
}

export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface FinancialModel {
  flow: FlowBreakdown;
  debtForecast: DebtForecast;
  minimumRequiredRevenue: number;
  issues: ValidationIssue[];
  isDistributionValid: boolean;
}

export interface MonthlyActual {
  month: string; // ISO yyyy-MM
  actualRevenue: number | null;
  plannedRevenue: number;
}
