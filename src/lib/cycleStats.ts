import type { CycleData, DayEntry } from '../types/cycle';
import { addDays, daysBetween, todayKey } from './dates';
import { getPeriodStarts } from './cycleMath';
import { isEmptyDayEntry } from './cycleInsights';
import { getNextPeriodStartDate } from './cyclePredictions';

/** Pack « jour difficile » (log rapide). */
export function isHardDayEntry(e: DayEntry | undefined): boolean {
  if (!e) return false;
  return Boolean(
    e.physical?.includes('fatigue') &&
      e.mood?.includes('irritable') &&
      e.mood?.includes('triste'),
  );
}

/** Jours notés entre [start, end) — end exclusif. */
export function countLoggedDaysInRange(
  data: CycleData,
  start: string,
  endExclusive: string,
): number {
  let n = 0;
  let d = start;
  while (d < endExclusive) {
    const entry = data[d];
    if (entry && !isEmptyDayEntry(entry)) n += 1;
    d = addDays(d, 1);
  }
  return n;
}

export function countHardDaysInRange(
  data: CycleData,
  start: string,
  endExclusive: string,
): number {
  let n = 0;
  let d = start;
  while (d < endExclusive) {
    if (isHardDayEntry(data[d])) n += 1;
    d = addDays(d, 1);
  }
  return n;
}

/** Plage du cycle en cours : dernier début → aujourd’hui+1. */
export function currentCycleRange(
  data: CycleData,
  date: string = todayKey(),
): { start: string; endExclusive: string } | null {
  const starts = getPeriodStarts(data);
  if (starts.length === 0) return null;
  const start = starts[starts.length - 1]!;
  if (date < start) return null;
  return { start, endExclusive: addDays(date, 1) };
}

/** Cycle précédent complété (entre deux débuts). */
export function previousCompletedCycleRange(
  data: CycleData,
): { start: string; endExclusive: string; length: number } | null {
  const starts = getPeriodStarts(data);
  if (starts.length < 2) return null;
  const start = starts[starts.length - 2]!;
  const endExclusive = starts[starts.length - 1]!;
  const length = daysBetween(start, endExclusive);
  if (length < 15 || length > 60) return null;
  return { start, endExclusive, length };
}

/**
 * Préparation règles : dans les N jours avant la date prévue (non encore en retard).
 */
export function getPeriodPrepState(
  data: CycleData,
  date: string = todayKey(),
  daysBefore = 3,
): {
  active: boolean;
  daysUntil: number;
  nextPeriod: string;
} | null {
  const next = getNextPeriodStartDate(data, date);
  if (!next) return null;
  const daysUntil = daysBetween(date, next);
  if (daysUntil < 0 || daysUntil > daysBefore) return null;
  return { active: true, daysUntil, nextPeriod: next };
}
