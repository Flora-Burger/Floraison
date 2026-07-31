import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CyclePhaseId } from '../types/cycle';
import { todayKey } from './dates';

const PREFIX = 'floraison_phase_notes:';
const MAX_HISTORY = 24;

export type PhaseNotesState = Partial<Record<CyclePhaseId, string>>;

export type PhaseNoteHistoryEntry = {
  cycleStart: string;
  phase: CyclePhaseId;
  text: string;
  updatedAt: string;
};

export type PhaseNotesStore = {
  current: PhaseNotesState;
  history: PhaseNoteHistoryEntry[];
};

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

function emptyStore(): PhaseNotesStore {
  return { current: {}, history: [] };
}

function normalizeStore(raw: unknown): PhaseNotesStore {
  if (!raw || typeof raw !== 'object') return emptyStore();
  const obj = raw as Record<string, unknown>;

  // Ancien format : Partial<Record<CyclePhaseId, string>>
  if (!('current' in obj) && !('history' in obj)) {
    const current: PhaseNotesState = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && v.trim()) {
        current[k as CyclePhaseId] = v;
      }
    }
    return { current, history: [] };
  }

  const current =
    obj.current && typeof obj.current === 'object'
      ? (obj.current as PhaseNotesState)
      : {};
  const history = Array.isArray(obj.history)
    ? (obj.history as PhaseNoteHistoryEntry[]).filter(
        (e) =>
          e &&
          typeof e.cycleStart === 'string' &&
          typeof e.phase === 'string' &&
          typeof e.text === 'string',
      )
    : [];
  return { current, history };
}

export async function loadPhaseNotesStore(userId: string): Promise<PhaseNotesStore> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return emptyStore();
    return normalizeStore(JSON.parse(raw));
  } catch {
    return emptyStore();
  }
}

export async function loadPhaseNotes(userId: string): Promise<PhaseNotesState> {
  const store = await loadPhaseNotesStore(userId);
  return store.current;
}

async function persistStore(userId: string, store: PhaseNotesStore): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(store));
}

export async function savePhaseNote(
  userId: string,
  phase: CyclePhaseId,
  text: string,
  cycleStart: string,
): Promise<void> {
  const store = await loadPhaseNotesStore(userId);
  const trimmed = text.trim();

  if (!trimmed) {
    delete store.current[phase];
    store.history = store.history.filter(
      (e) => !(e.cycleStart === cycleStart && e.phase === phase),
    );
  } else {
    store.current[phase] = trimmed;
    const idx = store.history.findIndex(
      (e) => e.cycleStart === cycleStart && e.phase === phase,
    );
    const entry: PhaseNoteHistoryEntry = {
      cycleStart,
      phase,
      text: trimmed,
      updatedAt: todayKey(),
    };
    if (idx >= 0) store.history[idx] = entry;
    else store.history.push(entry);

    store.history.sort((a, b) => b.cycleStart.localeCompare(a.cycleStart));
    if (store.history.length > MAX_HISTORY) {
      store.history = store.history.slice(0, MAX_HISTORY);
    }
  }

  await persistStore(userId, store);
}

/** Notes passées pour une phase (hors cycle courant). */
export async function loadPhaseNoteHistory(
  userId: string,
  phase: CyclePhaseId,
  currentCycleStart?: string,
): Promise<PhaseNoteHistoryEntry[]> {
  const store = await loadPhaseNotesStore(userId);
  return store.history
    .filter(
      (e) =>
        e.phase === phase &&
        e.text.trim() &&
        (!currentCycleStart || e.cycleStart !== currentCycleStart),
    )
    .sort((a, b) => b.cycleStart.localeCompare(a.cycleStart));
}

export async function clearPhaseNotes(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}
