// Local persistence only (ТЗ §19): IndexedDB via idb-keyval + JSON backup/import.
// No server, no accounts, no network calls — everything lives in this browser.
import { get, set } from 'idb-keyval';

const STORE_KEY = 'financial-recovery-plan:v1';

export async function loadPersistedState<T>(): Promise<T | undefined> {
  try {
    return await get<T>(STORE_KEY);
  } catch {
    return undefined;
  }
}

export async function persistState<T>(state: T): Promise<void> {
  try {
    await set(STORE_KEY, state);
  } catch {
    // IndexedDB unavailable (private mode, storage quota) — fail silently, in-memory state still works.
  }
}
