import type { CycleData } from '../types/cycle';
import { addDays, parseDateKey } from './dates';
import { getCycleContextForDate } from './cyclePhase';

export function getNextPeriodStartDate(data: CycleData, fromDate: string): string | null {
  const ctx = getCycleContextForDate(data, fromDate);
  if (!ctx) return null;
  return addDays(ctx.periodStart, ctx.cycleLength);
}

export function formatNextPeriodLabel(data: CycleData, fromDate: string): string | null {
  const next = getNextPeriodStartDate(data, fromDate);
  if (!next) return null;
  const d = parseDateKey(next);
  const today = parseDateKey(fromDate);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  const formatted = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  if (diff <= 0) return "Règles prévues aujourd'hui";
  if (diff === 1) return 'Règles prévues demain';
  return `Règles prévues vers le ${formatted}`;
}
