import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { computeDebtForecast } from '../../engine/financialEngine';
import { buildBankView } from '../../engine/bankViewModel';
import { buildBankExportPayload, downloadPDF } from '../../engine/exportEngine';
import { formatCurrency, formatCurrencyCompact, formatMonths } from '../../utils/format';
import { BankSlider } from './BankSlider';
import { CHART_COLORS_LIGHT } from '../charts/ChartTheme';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BANK_COLOR = CHART_COLORS_LIGHT.bank;
const BUSINESS_COLOR = CHART_COLORS_LIGHT.business;

export function PresentationView() {
  const scenarios = useAppStore((s) => s.scenarios);
  const activeScenarioId = useAppStore((s) => s.activeScenarioId);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const baseScenario = scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];

  // Local, ephemeral demo state — mirrors §9's what-if isolation: moving these
  // sliders during a meeting never touches the real plan underneath.
  const [revenue, setRevenue] = useState(baseScenario.revenue.monthlyRevenue);
  const [bankPct, setBankPct] = useState(baseScenario.distribution.bankPct);

  const forecast = useMemo(
    () =>
      computeDebtForecast(
        { bankPct, otherPct: 0, businessPct: 100 - bankPct },
        { bankDebt: baseScenario.debt.bankDebt, otherDebt: 0, bankExtraPayment: 0, otherExtraPayment: 0, assumedTermMonths: null },
        () => revenue,
        240,
      ),
    [bankPct, revenue, baseScenario.debt.bankDebt],
  );

  const bankView = useMemo(
    () =>
      buildBankView({
        revenue,
        bankPct,
        bankDebtRemaining: baseScenario.debt.bankDebt,
        bankPayoffMonth: forecast.bankPayoffMonth,
        paymentHistory: [],
        forecastMonths: forecast.months,
      }),
    [revenue, bankPct, baseScenario.debt.bankDebt, forecast],
  );

  const bankPayment = revenue * (bankPct / 100);
  const businessAmount = revenue - bankPayment;

  const chartData = forecast.months
    .filter((_, i) => i % Math.max(1, Math.floor(forecast.months.length / 40)) === 0)
    .map((m) => ({ month: `М${m.monthIndex}`, Остаток: m.bankRemaining }));

  function handleExport() {
    const payload = buildBankExportPayload(bankView);
    downloadPDF(payload, 'bank-view.pdf', 'План восстановления — версия для банка');
  }

  return (
    <div className="min-h-screen bg-paper text-[#12181F]">
      <header className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-5">
        <button
          onClick={() => setViewMode('console')}
          className="text-left text-sm text-[#8a8471] transition-colors hover:text-[#12181F]"
        >
          ← Назад в рабочий режим
        </button>
        <div className="text-display text-xs font-medium tracking-wide text-[#8a8471] sm:text-sm">
          План восстановления · версия для банка
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-20 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 mt-4 text-center"
        >
          <h1 className="text-display text-3xl font-semibold sm:text-4xl">Механизм восстановления потока</h1>
          <p className="mx-auto mt-3 max-w-xl text-[#6b6558]">
            Мы не обещаем прогноз — мы показываем механизм. Двигайте параметры и смотрите, как меняется результат.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-[#0B0E17]/8 bg-white/60 p-6 shadow-[0_30px_80px_-40px_rgba(11,14,23,0.25)] sm:p-10 md:grid-cols-2 md:gap-10">
          <BankSlider
            label="Месячная выручка"
            value={revenue}
            min={0}
            max={25_000_000}
            step={100_000}
            format={formatCurrencyCompact}
            marks={[5_000_000, 10_000_000, 15_000_000, 20_000_000]}
            colorVar={BUSINESS_COLOR}
            onChange={setRevenue}
          />
          <BankSlider
            label="Доля банка"
            value={bankPct}
            min={5}
            max={40}
            step={1}
            format={(v) => `${v}%`}
            marks={[10, 20, 25, 30]}
            colorVar={BANK_COLOR}
            onChange={setBankPct}
          />
        </div>

        {/* the funnel */}
        <div className="mx-auto mt-14 flex max-w-md flex-col items-center gap-1">
          <FunnelStep label="Выручка" value={formatCurrency(revenue)} />
          <Arrow />
          <FunnelStep
            label={`Банк · ${bankPct}%`}
            value={formatCurrency(bankPayment)}
            color={BANK_COLOR}
          />
          <Arrow />
          <FunnelStep
            label={`Бизнес · ${100 - bankPct}%`}
            value={formatCurrency(businessAmount)}
            color={BUSINESS_COLOR}
          />
          <Arrow />
          <FunnelStep label="Остаток долга банку" value={formatCurrency(bankView.bankDebtRemaining)} />
          <Arrow />
          <FunnelStep
            label="Прогноз погашения"
            value={formatMonths(forecast.bankPayoffMonth)}
            emphasis
          />
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-[#0B0E17]/8 bg-white/60 p-5">
          <div className="mb-3 text-sm font-medium text-[#6b6558]">График снижения задолженности банку</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={CHART_COLORS_LIGHT.grid} vertical={false} />
              <XAxis dataKey="month" stroke={CHART_COLORS_LIGHT.axis} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                stroke={CHART_COLORS_LIGHT.axis}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => formatCurrencyCompact(v)}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{ background: '#fff', border: '1px solid rgba(11,14,23,0.08)', borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="Остаток" stroke={BANK_COLOR} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={handleExport}
            className="rounded-lg border border-[#0B0E17]/15 px-5 py-2.5 text-sm font-medium text-[#12181F] transition-colors hover:bg-[#0B0E17]/5"
          >
            Скачать PDF для банка
          </button>
          <p className="max-w-md text-center text-xs leading-relaxed text-[#8a8471]">
            Мы не обещаем кредитору будущие деньги. Мы показываем механизм, при котором восстановление денежного
            потока автоматически создаёт регулярный источник погашения обязательств.
          </p>
        </div>
      </main>
    </div>
  );
}

function FunnelStep({
  label,
  value,
  color,
  emphasis,
}: {
  label: string;
  value: string;
  color?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="w-full rounded-2xl border border-[#0B0E17]/8 bg-white px-6 py-4 text-center shadow-sm">
      <div className="text-mono text-[11px] uppercase tracking-[0.14em] text-[#8a8471]">{label}</div>
      <div
        className={`text-mono tabular font-semibold ${emphasis ? 'text-3xl' : 'text-2xl'}`}
        style={{ color: color ?? '#12181F' }}
      >
        {value}
      </div>
    </div>
  );
}

function Arrow() {
  return <div className="text-lg text-[#c7c2b2]">↓</div>;
}
