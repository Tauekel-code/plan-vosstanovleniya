import type { DistributionParams, FlowBreakdown, ValidationIssue } from './types';

const EPS = 0.01;

export function validateDistribution(d: DistributionParams): ValidationIssue[] {
  const sum = d.bankPct + d.otherPct + d.businessPct;
  if (Math.abs(sum - 100) > EPS) {
    return [
      {
        code: 'DISTRIBUTION_NOT_100',
        severity: 'error',
        message: `Сумма распределения выручки равна ${sum.toFixed(1)}%, а должна быть 100%. Скорректируйте доли банка, других обязательств и бизнеса.`,
      },
    ];
  }
  return [];
}

export function validateFlow(flow: FlowBreakdown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (flow.expensesExceedBudget) {
    issues.push({
      code: 'EXPENSES_EXCEED_BUDGET',
      severity: 'warning',
      message: 'Расходы бизнеса превышают бюджет бизнеса. Свободный денежный поток отрицательный — модель неустойчива при текущей выручке.',
    });
  }

  if (flow.revenue < 0) {
    issues.push({
      code: 'NEGATIVE_REVENUE',
      severity: 'error',
      message: 'Выручка не может быть отрицательной.',
    });
  }

  return issues;
}

export function validatePayment(payment: number, remainingDebt: number, label: string): ValidationIssue[] {
  if (payment > remainingDebt + EPS) {
    return [
      {
        code: 'PAYMENT_EXCEEDS_DEBT',
        severity: 'warning',
        message: `Платёж (${label}) превышает остаток долга. Платёж будет ограничен остатком.`,
      },
    ];
  }
  return [];
}
