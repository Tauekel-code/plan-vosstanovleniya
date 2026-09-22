import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { ConsoleShell } from './components/layout/ConsoleShell';
import { PresentationView } from './components/presentation/PresentationView';
import { Dashboard } from './components/dashboard/Dashboard';
import { PlanActual } from './components/planactual/PlanActual';
import { WhatIf } from './components/whatif/WhatIf';
import { ReverseCalculator } from './components/reverse/ReverseCalculator';
import { RevenuePlan } from './components/revenueplan/RevenuePlan';
import { Scenarios } from './components/scenarios/Scenarios';
import { ExportPanel } from './components/export/ExportPanel';
import { BankSummary } from './components/summary/BankSummary';

export default function App() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const viewMode = useAppStore((s) => s.viewMode);
  const consoleScreen = useAppStore((s) => s.consoleScreen);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-ink text-white/40">
        <div className="text-mono text-sm">Загрузка модели…</div>
      </div>
    );
  }

  if (viewMode === 'presentation') {
    return <PresentationView />;
  }

  return (
    <ConsoleShell>
      {consoleScreen === 'dashboard' && <Dashboard />}
      {consoleScreen === 'planActual' && <PlanActual />}
      {consoleScreen === 'whatIf' && <WhatIf />}
      {consoleScreen === 'reverse' && <ReverseCalculator />}
      {consoleScreen === 'revenuePlan' && <RevenuePlan />}
      {consoleScreen === 'scenarios' && <Scenarios />}
      {consoleScreen === 'summary' && <BankSummary />}
      {consoleScreen === 'export' && <ExportPanel />}
    </ConsoleShell>
  );
}
