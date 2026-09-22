import { create } from 'zustand';
import type { MonthlyActual, ScenarioParams } from '../engine/types';
import { createDefaultScenarios, cloneScenarioAsCustom } from '../engine/scenarioEngine';
import type { WhatIfOverrides } from '../engine/whatIfEngine';
import { defaultRevenuePlanParams, type RevenuePlanParams } from '../engine/revenuePlanEngine';
import { loadPersistedState, persistState } from './db';

// Two audiences only: the owner's full console, and the bank-safe presentation
// screen (built entirely from BankView — see engine/bankViewModel.ts).
export type ViewMode = 'console' | 'presentation';
export type ConsoleScreen =
  | 'dashboard'
  | 'planActual'
  | 'whatIf'
  | 'reverse'
  | 'revenuePlan'
  | 'scenarios'
  | 'summary'
  | 'export';

export interface PersistedShape {
  version: 1;
  scenarios: ScenarioParams[];
  activeScenarioId: string;
  history: MonthlyActual[];
  approvedScenarioId: string | null;
  approvedAt: string | null;
  revenuePlan: RevenuePlanParams;
}

interface AppState extends PersistedShape {
  hydrated: boolean;
  viewMode: ViewMode;
  consoleScreen: ConsoleScreen;
  whatIfOverrides: WhatIfOverrides;
  whatIfActive: boolean;

  hydrate: () => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  setConsoleScreen: (screen: ConsoleScreen) => void;

  activeScenario: () => ScenarioParams;
  updateActiveScenario: (patch: (s: ScenarioParams) => ScenarioParams) => void;
  setActiveScenarioId: (id: string) => void;
  addCustomScenarioFromActive: () => void;
  removeScenario: (id: string) => void;

  setWhatIf: (overrides: WhatIfOverrides) => void;
  clearWhatIf: () => void;
  toggleWhatIf: (active: boolean) => void;

  /** Approves the active scenario and returns the approval timestamp, so a caller can build a document from it immediately without waiting for a re-render. */
  approveActiveScenario: () => string;
  clearApproval: () => void;

  upsertHistoryMonth: (entry: MonthlyActual) => void;
  removeHistoryMonth: (month: string) => void;

  updateRevenuePlan: (patch: Partial<RevenuePlanParams>) => void;

  importState: (data: PersistedShape) => void;
  resetAll: () => void;
}

function defaultShape(): PersistedShape {
  const scenarios = createDefaultScenarios();
  return {
    version: 1,
    scenarios,
    activeScenarioId: scenarios[1].id, // "Базовый" by default
    history: [],
    approvedScenarioId: null,
    approvedAt: null,
    revenuePlan: defaultRevenuePlanParams(),
  };
}

let persistScheduled: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(state: PersistedShape) {
  if (persistScheduled) clearTimeout(persistScheduled);
  persistScheduled = setTimeout(() => {
    void persistState(state);
  }, 250);
}

/** Builds the persisted snapshot from live store state, filling in any fields the caller didn't touch. */
function snapshotFrom(state: AppState, overrides: Partial<PersistedShape> = {}): PersistedShape {
  return {
    version: 1,
    scenarios: state.scenarios,
    activeScenarioId: state.activeScenarioId,
    history: state.history,
    approvedScenarioId: state.approvedScenarioId,
    approvedAt: state.approvedAt,
    revenuePlan: state.revenuePlan,
    ...overrides,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  ...defaultShape(),
  hydrated: false,
  viewMode: 'console',
  consoleScreen: 'dashboard',
  whatIfOverrides: {},
  whatIfActive: false,

  hydrate: async () => {
    const persisted = await loadPersistedState<PersistedShape>();
    if (persisted && persisted.scenarios?.length) {
      set({
        ...persisted,
        approvedScenarioId: persisted.approvedScenarioId ?? null,
        approvedAt: persisted.approvedAt ?? null,
        revenuePlan: persisted.revenuePlan ?? defaultRevenuePlanParams(),
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setConsoleScreen: (screen) => set({ consoleScreen: screen }),

  activeScenario: () => {
    const { scenarios, activeScenarioId } = get();
    return scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0];
  },

  updateActiveScenario: (patch) => {
    set((state) => {
      const scenarios = state.scenarios.map((s) =>
        s.id === state.activeScenarioId ? patch(structuredClone(s)) : s,
      );
      // Editing the approved scenario's numbers invalidates the approval — the
      // printed memo must always match what was actually signed off on.
      const wasApproved = state.approvedScenarioId === state.activeScenarioId;
      const approvedScenarioId = wasApproved ? null : state.approvedScenarioId;
      const approvedAt = wasApproved ? null : state.approvedAt;
      schedulePersist(snapshotFrom(state, { scenarios, approvedScenarioId, approvedAt }));
      return { scenarios, approvedScenarioId, approvedAt };
    });
  },

  setActiveScenarioId: (id) => set({ activeScenarioId: id }),

  addCustomScenarioFromActive: () => {
    set((state) => {
      const active = state.scenarios.find((s) => s.id === state.activeScenarioId) ?? state.scenarios[0];
      const clone = cloneScenarioAsCustom(active, `${active.name} (копия)`);
      const scenarios = [...state.scenarios, clone];
      schedulePersist(snapshotFrom(state, { scenarios, activeScenarioId: clone.id }));
      return { scenarios, activeScenarioId: clone.id };
    });
  },

  removeScenario: (id) => {
    set((state) => {
      if (state.scenarios.length <= 1) return state;
      const scenarios = state.scenarios.filter((s) => s.id !== id);
      const activeScenarioId = state.activeScenarioId === id ? scenarios[0].id : state.activeScenarioId;
      schedulePersist(snapshotFrom(state, { scenarios, activeScenarioId }));
      return { scenarios, activeScenarioId };
    });
  },

  setWhatIf: (overrides) => set((state) => ({ whatIfOverrides: { ...state.whatIfOverrides, ...overrides }, whatIfActive: true })),
  clearWhatIf: () => set({ whatIfOverrides: {}, whatIfActive: false }),
  toggleWhatIf: (active) => set({ whatIfActive: active }),

  approveActiveScenario: () => {
    const approvedAt = new Date().toISOString();
    set((state) => {
      const approvedScenarioId = state.activeScenarioId;
      schedulePersist(snapshotFrom(state, { approvedScenarioId, approvedAt }));
      return { approvedScenarioId, approvedAt, consoleScreen: 'summary' as const };
    });
    return approvedAt;
  },
  clearApproval: () => {
    set((state) => {
      schedulePersist(snapshotFrom(state, { approvedScenarioId: null, approvedAt: null }));
      // Mirrors approveActiveScenario's navigation: undoing the approval sends you back
      // to where you'd edit the numbers, instead of stranding you on the now-empty summary.
      return { approvedScenarioId: null, approvedAt: null, consoleScreen: 'dashboard' as const };
    });
  },

  upsertHistoryMonth: (entry) => {
    set((state) => {
      const existingIndex = state.history.findIndex((h) => h.month === entry.month);
      const history = [...state.history];
      if (existingIndex >= 0) history[existingIndex] = entry;
      else history.push(entry);
      history.sort((a, b) => a.month.localeCompare(b.month));
      schedulePersist(snapshotFrom(state, { history }));
      return { history };
    });
  },

  removeHistoryMonth: (month) => {
    set((state) => {
      const history = state.history.filter((h) => h.month !== month);
      schedulePersist(snapshotFrom(state, { history }));
      return { history };
    });
  },

  updateRevenuePlan: (patch) => {
    set((state) => {
      const revenuePlan = { ...state.revenuePlan, ...patch };
      schedulePersist(snapshotFrom(state, { revenuePlan }));
      return { revenuePlan };
    });
  },

  importState: (data) => {
    // Older backups predate the approval feature — default those fields in rather than importing `undefined`.
    const normalized: PersistedShape = {
      ...data,
      approvedScenarioId: data.approvedScenarioId ?? null,
      approvedAt: data.approvedAt ?? null,
      revenuePlan: data.revenuePlan ?? defaultRevenuePlanParams(),
    };
    set({ ...normalized });
    schedulePersist(normalized);
  },

  resetAll: () => {
    const shape = defaultShape();
    set({ ...shape, whatIfOverrides: {}, whatIfActive: false });
    schedulePersist(shape);
  },
}));
