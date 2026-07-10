import type { DayEntry, PhysicalSymptom, CycleData, Discharge, Skin, SleepQuality } from '../types/cycle';

const LEGACY_SYMPTOM_MAP: Record<string, PhysicalSymptom> = {
  Crampes: 'crampes',
  Migraine: 'migraine',
  'Seins sensibles': 'seins_sensibles',
  Ballonnements: 'ballonnements',
};

function toArray<T extends string>(value: T | T[] | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value : [value];
}

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

  e.discharge = toArray<Discharge>(e.discharge as Discharge | Discharge[] | undefined);
  e.skin = toArray<Skin>(e.skin as Skin | Skin[] | undefined);
  e.sleep = toArray<SleepQuality>(e.sleep as SleepQuality | SleepQuality[] | undefined);

  if (e.physical?.includes('acne' as PhysicalSymptom)) {
    e.physical = e.physical.filter((x) => x !== ('acne' as PhysicalSymptom));
    const skin = [...(e.skin ?? [])];
    if (!skin.includes('acne')) skin.push('acne');
    e.skin = skin;
  }

  return e;
}

export function sanitizeDayEntry(e: DayEntry): DayEntry {
  const out = migrateDayEntry(e);
  if (out.physical?.length === 0) delete out.physical;
  if (out.mood?.length === 0) delete out.mood;
  if (out.cravings?.length === 0) delete out.cravings;
  if (out.sexual?.length === 0) delete out.sexual;
  if (out.discharge?.length === 0) delete out.discharge;
  if (out.skin?.length === 0) delete out.skin;
  if (out.sleep?.length === 0) delete out.sleep;
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

/** Copie le suivi d'hier sans les règles ni le journal. */
export function copyYesterdayPatch(yesterday: DayEntry): Partial<DayEntry> {
  const patch: Partial<DayEntry> = {};
  if (yesterday.physical?.length) patch.physical = [...yesterday.physical];
  if (yesterday.mood?.length) patch.mood = [...yesterday.mood];
  if (yesterday.sleep?.length) patch.sleep = [...yesterday.sleep];
  if (yesterday.cravings?.length) patch.cravings = [...yesterday.cravings];
  if (yesterday.sexual?.length) patch.sexual = [...yesterday.sexual];
  if (yesterday.skin?.length) patch.skin = [...yesterday.skin];
  if (yesterday.discharge?.length) patch.discharge = [...yesterday.discharge];
  return patch;
}
