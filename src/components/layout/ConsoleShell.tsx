import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function ConsoleShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink bg-instrument-grid text-white print:h-auto print:overflow-visible print:bg-white">
      {/* Persistent sidebar on desktop */}
      <div className="hidden lg:block print:hidden">
        <Sidebar />
      </div>

      {/* Mobile slide-in drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden print:hidden">
          <div className="absolute inset-0 bg-ink/70" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0">
            <Sidebar onNavigate={() => setNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col print:block">
        <div className="print:hidden">
          <TopBar onOpenNav={() => setNavOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 print:overflow-visible print:p-0">
          <div className="mx-auto max-w-6xl print:max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
}
