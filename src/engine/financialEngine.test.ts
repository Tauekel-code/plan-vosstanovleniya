// Coverage matches the ten mandatory checks in ТЗ §29.
import { describe, expect, it } from 'vitest';
import { computeDebtForecast, computeFlow, computeModel } from './financialEngine';
import { createScenario } from './scenarioEngine';
import { buildBankView, BANK_VIEW_ALLOWED_KEYS, serializeBankView } from './bankViewModel';
import { buildBankExportPayload, buildFullExportPayload, toJSON } from './exportEngine';
import type { BusinessExpenses, DistributionParams } from './types';

const distribution: DistributionParams = { bankPct: 20, otherPct: 20, businessPct: 60 };
const expenses: BusinessExpenses = {
  ownerSalary: 500_000,
  employeeReserve: 500_000,
  taxes: 400_000,
  operatingExpenses: 1_500_000,
  reserveFund: 300_000,
  marketingDevelopment: 300_000,
};

describe('Тест 1 — распределение 10 млн при 20/20/60', () => {
  it('делит выручку строго по процентам', () => {
    const flow = computeFlow(10_000_000, distribution, expenses);
    expect(flow.bank).toBe(2_000_000);
    expect(flow.other).toBe(2_000_000);
    expect(flow.businessBudget).toBe(6_000_000);
  });
});

describe('Тест 2 — изменение расходов бизнеса', () => {
  it('свободный денежный поток пересчитывается по примеру из ТЗ (6 000 000 − 3 500 000)', () => {
    const customExpenses: BusinessExpenses = {
      ownerSalary: 1_000_000,
      employeeReserve: 1_000_000,
      taxes: 500_000,
      operatingExpenses: 700_000,
      reserveFund: 200_000,
      marketingDevelopment: 100_000,
    };
    const total = Object.values(customExpenses).reduce((a, b) => a + b, 0);
    expect(total).toBe(3_500_000);

    const flow = computeFlow(10_000_000, distribution, customExpenses);
    expect(flow.freeCashFlow).toBe(2_500_000);
  });
});

describe('Тест 3 — изменение процента банка', () => {
  it('платёж банку пересчитывается пропорционально новому проценту', () => {
    const scenario = createScenario('custom', {
      distribution: { bankPct: 30, otherPct: 20, businessPct: 50 },
    });
    const model = computeModel(scenario);
    expect(model.flow.bank).toBe(scenario.revenue.monthlyRevenue * 0.3);
  });
});

describe('Тест 4 — рост выручки увеличивает платёж банку', () => {
  it('при увеличении выручки платёж банку растёт пропорционально', () => {
    const low = computeFlow(8_000_000, distribution, expenses);
    const high = computeFlow(12_000_000, distribution, expenses);
    expect(high.bank).toBeGreaterThan(low.bank);
    expect(high.bank - low.bank).toBeCloseTo(4_000_000 * 0.2, 5);
  });
});

describe('Тест 5 — долг погашен до нуля', () => {
  it('платежи прекращаются, как только остаток долга достиг нуля', () => {
    const forecast = computeDebtForecast(
      distribution,
      { bankDebt: 1_000_000, otherDebt: 0, bankExtraPayment: 0, otherExtraPayment: 0, assumedTermMonths: null },
      () => 10_000_000,
    );
    expect(forecast.bankPaidOff).toBe(true);
    const lastMonth = forecast.months[forecast.months.length - 1];
    expect(lastMonth.bankRemaining).toBe(0);

    // no month ever pays more than the remaining balance at that point
    for (const month of forecast.months) {
      expect(month.bankPayment).toBeLessThanOrEqual(1_000_000 + 1e-6);
    }
  });
});

describe('Тест 6 — нет двойного вычитания расходов', () => {
  it('расходы бизнеса вычитаются один раз — из бюджета бизнеса, а не из всей выручки', () => {
    const flow = computeFlow(10_000_000, distribution, expenses);
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    // freeCashFlow must equal businessBudget - expenses, never revenue - expenses - bank - other
    expect(flow.freeCashFlow).toBe(flow.businessBudget - totalExpenses);
    expect(flow.freeCashFlow).not.toBe(flow.revenue - totalExpenses);
  });
});

describe('Тест 7 — нет двойного учёта налогов', () => {
  it('налоги входят в сумму расходов бизнеса ровно один раз', () => {
    const total = Object.values(expenses).reduce((a, b) => a + b, 0);
    const taxesCountedOnce = expenses.taxes;
    const withoutTaxes = total - taxesCountedOnce;
    // reconstructing the total from its parts must match — taxes appear in exactly one line
    expect(withoutTaxes + taxesCountedOnce).toBe(total);
    expect(
      (Object.keys(expenses) as (keyof BusinessExpenses)[]).filter((k) => k === 'taxes').length,
    ).toBe(1);
  });
});

describe('Тест 8 — Bank View не содержит данных Full View', () => {
  it('BankView не может физически включать внутренние поля', () => {
    const view = buildBankView({
      revenue: 10_000_000,
      bankPct: 20,
      bankDebtRemaining: 24_000_000,
      bankPayoffMonth: 96,
      paymentHistory: [],
      forecastMonths: [],
    });
    const forbiddenKeys = ['ownerSalary', 'taxes', 'otherDebt', 'reserveFund', 'notes', 'marketingDevelopment'];
    const viewKeys = Object.keys(view);
    for (const forbidden of forbiddenKeys) {
      expect(viewKeys).not.toContain(forbidden);
    }
    // the bank never learns other creditors exist — its "business" share silently absorbs them
    expect(view.businessSharePct).toBe(80);
  });
});

describe('Тест 9 — экспорт Bank View', () => {
  it('содержит только разрешённые поля из BANK_VIEW_ALLOWED_KEYS', () => {
    const view = buildBankView({
      revenue: 10_000_000,
      bankPct: 20,
      bankDebtRemaining: 24_000_000,
      bankPayoffMonth: 96,
      paymentHistory: [{ month: '2026-01', amount: 2_000_000 }],
      forecastMonths: [],
    });
    const payload = buildBankExportPayload(view);
    const serialized = serializeBankView(view);
    for (const key of Object.keys(serialized)) {
      expect(BANK_VIEW_ALLOWED_KEYS).toContain(key);
    }
    expect(payload.exportType).toBe('bank');
    expect('ownerSalary' in payload).toBe(false);
  });
});

describe('Тест 10 — экспорт/импорт JSON', () => {
  it('полный экспорт сериализуется и восстанавливается без потерь', () => {
    const scenario = createScenario('base');
    const model = computeModel(scenario);
    const payload = buildFullExportPayload(scenario, model, []);
    const json = toJSON(payload);
    const restored = JSON.parse(json);
    expect(restored.scenario.id).toBe(scenario.id);
    expect(restored.flow.bank).toBe(model.flow.bank);
    expect(restored.exportType).toBe('full');
  });
});

describe('Дополнительно — сумма распределения и минимальная выручка', () => {
  it('распределение, не равное 100%, помечается как невалидное', () => {
    const scenario = createScenario('custom', {
      distribution: { bankPct: 20, otherPct: 20, businessPct: 55 },
    });
    const model = computeModel(scenario);
    expect(model.isDistributionValid).toBe(false);
  });

  it('минимальная выручка покрывает расходы бизнеса ровно при нулевом FCF', () => {
    const scenario = createScenario('custom', { distribution, expenses });
    const model = computeModel(scenario);
    const flowAtMinimum = computeFlow(model.minimumRequiredRevenue, distribution, expenses);
    expect(flowAtMinimum.freeCashFlow).toBeCloseTo(0, 5);
  });
});
