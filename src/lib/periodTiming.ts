import type { CycleData } from '../types/cycle';
import { addDays } from './dates';
import { getCycleContextForDate, getDaysUntilNextPeriod } from './cyclePhase';

/** Règles prévues aujourd'hui ou déjà passées, sans jour de règles loggé ce jour. */
export function isPeriodDueOrLate(data: CycleData, date: string): boolean {
  const entry = data[date];
  if (entry?.period) return false;

  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return false;

  const daysUntil = getDaysUntilNextPeriod(data, date);
  if (daysUntil === 0) return true;

  const nextStart = addDays(ctx.periodStart, ctx.cycleLength);
  return date >= nextStart;
}

export function getPeriodOverdueDays(data: CycleData, date: string): number {
  const ctx = getCycleContextForDate(data, date);
  if (!ctx) return 0;
  const nextStart = addDays(ctx.periodStart, ctx.cycleLength);
  if (date <= nextStart) return 0;
  const ms = new Date(date + 'T12:00:00').getTime() - new Date(nextStart + 'T12:00:00').getTime();
  return Math.max(0, Math.round(ms / 86400000));
}
