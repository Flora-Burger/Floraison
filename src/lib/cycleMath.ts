import type { CycleData } from '../types/cycle';
import { addDays, daysBetween } from './dates';

export const DEFAULT_CYCLE_LENGTH = 28;
export const DEFAULT_PERIOD_DAYS = 5;
export const DEFAULT_LUTEAL_PHASE = 14;
export const FERTILITY_DAYS_BEFORE = 5;
export const FERTILITY_DAYS_AFTER = 1;

export function getPeriodStarts(data: CycleData): string[] {
  const periodDates = Object.keys(data)
    .filter((d) => data[d]?.period)
    .sort();
  return periodDates.filter((date) => !data[addDays(date, -1)]?.period);
}

export function getPeriodBlockLengths(data: CycleData): number[] {
  return getPeriodStarts(data).map((start) => {
    let len = 0;
    let d = start;
    while (data[d]?.period) {
      len++;
      d = addDays(d, 1);
    }
    return len;
  });
}

export function computeAvgCycleLength(data: CycleData): number {
  const starts = getPeriodStarts(data);
  if (starts.length < 2) return DEFAULT_CYCLE_LENGTH;
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const gap = daysBetween(starts[i - 1], starts[i]);
    if (gap >= 20 && gap <= 45) gaps.push(gap);
  }
  if (gaps.length === 0) return DEFAULT_CYCLE_LENGTH;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

export function computeAvgPeriodDays(data: CycleData): number {
  const lengths = getPeriodBlockLengths(data).filter((l) => l >= 1 && l <= 10);
  if (lengths.length === 0) return DEFAULT_PERIOD_DAYS;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export function computeOvulationDate(
  periodStart: string,
  cycleLength: number,
  lutealPhase = DEFAULT_LUTEAL_PHASE,
): string {
  return addDays(periodStart, cycleLength - lutealPhase);
}

export function getFertilityWindowDates(
  periodStart: string,
  cycleLength: number,
  lutealPhase = DEFAULT_LUTEAL_PHASE,
): string[] {
  const ovulation = computeOvulationDate(periodStart, cycleLength, lutealPhase);
  const dates: string[] = [];
  for (let offset = -FERTILITY_DAYS_BEFORE; offset <= FERTILITY_DAYS_AFTER; offset++) {
    dates.push(addDays(ovulation, offset));
  }
  return dates;
}

export function findLastPeriodStart(data: CycleData): string | null {
  const periodDates = Object.keys(data)
    .filter((d) => data[d]?.period)
    .sort();
  if (periodDates.length === 0) return null;

  let start = periodDates[periodDates.length - 1];
  for (let i = periodDates.length - 2; i >= 0; i--) {
    const expected = addDays(periodDates[i], 1);
    if (expected === start) {
      start = periodDates[i];
    } else {
      break;
    }
  }
  return start;
}

export function findPeriodStartForDate(data: CycleData, date: string): string | null {
  const starts = getPeriodStarts(data);
  if (starts.length === 0) return null;

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    if (start > date) break;
    const nextStart = i + 1 < starts.length ? starts[i + 1] : null;
    if (nextStart === null || date < nextStart) {
      return start;
    }
  }
  return null;
}
