import type { DayEntry, PhysicalSymptom, CycleData } from '../types/cycle';

const LEGACY_SYMPTOM_MAP: Record<string, PhysicalSymptom> = {
  Crampes: 'crampes',
  Migraine: 'migraine',
  'Seins sensibles': 'seins_sensibles',
  Ballonnements: 'ballonnements',
};

export function migrateDayEntry(raw: DayEntry): DayEntry {
  const e: DayEntry = { ...raw };

  if (typeof (e as { mood?: unknown }).mood === 'number') {
    delete e.mood;
  }

  const legacyLibido = (raw as { libido?: number }).libido;
  if (legacyLibido !== undefined) {
    const sexual = [...(e.sexual ?? [])];
    if (legacyLibido === 1 && !sexual.includes('libido_basse')) sexual.push('libido_basse');
    if (legacyLibido === 3 && !sexual.includes('libido_elevee')) sexual.push('libido_elevee');
    if (sexual.length > 0) e.sexual = sexual;
    delete (e as { libido?: number }).libido;
  }

  if (e.symptoms?.length) {
    const physical = [...(e.physical ?? [])];
    for (const s of e.symptoms) {
      const mapped = LEGACY_SYMPTOM_MAP[s];
      if (mapped && !physical.includes(mapped)) physical.push(mapped);
    }
    if (physical.length > 0) e.physical = physical;
    delete e.symptoms;
  }

  return e;
}

export function sanitizeDayEntry(e: DayEntry): DayEntry {
  const out = migrateDayEntry(e);
  if (out.physical?.length === 0) delete out.physical;
  if (out.mood?.length === 0) delete out.mood;
  if (out.cravings?.length === 0) delete out.cravings;
  if (out.sexual?.length === 0) delete out.sexual;
  delete out.symptoms;
  delete (out as { libido?: number }).libido;
  return out;
}

export function migrateCycleData(data: CycleData): CycleData {
  const out: CycleData = {};
  for (const [date, entry] of Object.entries(data)) {
    out[date] = sanitizeDayEntry(entry);
  }
  return out;
}

export function toggleMulti<T extends string>(current: T[] | undefined, value: T): T[] {
  const list = current ?? [];
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export function toggleSingle<T extends string>(current: T | undefined, value: T): T | undefined {
  return current === value ? undefined : value;
}

export function applyDayPatch(current: DayEntry, patch: Partial<DayEntry>): DayEntry {
  const merged: DayEntry = { ...current, ...patch };
  (Object.keys(patch) as (keyof DayEntry)[]).forEach((key) => {
    if (patch[key] === undefined) delete merged[key];
  });
  return sanitizeDayEntry(merged);
}
