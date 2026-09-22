import { describe, expect, it } from 'vitest';
import { computeRevenuePlan } from './revenuePlanEngine';

describe('Revenue Plan — продажи и абонплата', () => {
  it('доход от продаж = количество × цена, месяц за месяцем неизменен при постоянных продажах', () => {
    const result = computeRevenuePlan({
      avgUnitsPerMonth: 10,
      unitPrice: 200_000,
      monthlySupportFee: 20_000,
      startingSubscribers: 0,
      horizonMonths: 6,
    });
    for (const month of result.months) {
      expect(month.salesRevenue).toBe(2_000_000);
    }
  });

  it('база подписчиков и абонплата растут каждый месяц на величину продаж', () => {
    const result = computeRevenuePlan({
      avgUnitsPerMonth: 10,
      unitPrice: 200_000,
      monthlySupportFee: 20_000,
      startingSubscribers: 0,
      horizonMonths: 3,
    });
    expect(result.months[0].cumulativeSubscribers).toBe(10);
    expect(result.months[1].cumulativeSubscribers).toBe(20);
    expect(result.months[2].cumulativeSubscribers).toBe(30);

    expect(result.months[0].supportRevenue).toBe(200_000); // 10 * 20 000
    expect(result.months[1].supportRevenue).toBe(400_000); // 20 * 20 000
    expect(result.months[2].supportRevenue).toBe(600_000); // 30 * 20 000
  });

  it('стартовая база подписчиков учитывается с первого месяца', () => {
    const result = computeRevenuePlan({
      avgUnitsPerMonth: 5,
      unitPrice: 200_000,
      monthlySupportFee: 20_000,
      startingSubscribers: 50,
      horizonMonths: 1,
    });
    expect(result.months[0].cumulativeSubscribers).toBe(55);
    expect(result.months[0].supportRevenue).toBe(1_100_000);
  });

  it('итоговая выручка = продажи + абонплата', () => {
    const result = computeRevenuePlan({
      avgUnitsPerMonth: 8,
      unitPrice: 200_000,
      monthlySupportFee: 20_000,
      startingSubscribers: 0,
      horizonMonths: 4,
    });
    for (const month of result.months) {
      expect(month.totalRevenue).toBe(month.salesRevenue + month.supportRevenue);
    }
  });

  it('абонплата растёт со временем даже при неизменных продажах в месяц', () => {
    const result = computeRevenuePlan({
      avgUnitsPerMonth: 10,
      unitPrice: 200_000,
      monthlySupportFee: 20_000,
      startingSubscribers: 0,
      horizonMonths: 12,
    });
    expect(result.lastMonth.supportRevenue).toBeGreaterThan(result.firstMonth.supportRevenue);
    expect(result.lastMonth.salesRevenue).toBe(result.firstMonth.salesRevenue);
  });
});
