import type { CycleData } from '../types/cycle';
import { addDays, parseDateKey } from './dates';
import { getCycleRegularity } from './cycleMath';
import { getCycleContextForDate } from './cyclePhase';

export type NextPeriodWindow = {
  /** Estimation centrale (moyenne). */
  center: string;
  /** Début de la fourchette inclusive. */
  start: string;
  /** Fin de la fourchette inclusive. */
  end: string;
  /** true si la fourchette vient de la variabilité réelle des cycles. */
  fromHistory: boolean;
};

export function getNextPeriodStartDate(data: CycleData, fromDate: string): string | null {
  const ctx = getCycleContextForDate(data, fromDate);
  if (!ctx) return null;
  return addDays(ctx.periodStart, ctx.cycleLength);
}

/**
 * Fourchette de prochaines règles : minGap–maxGap si assez d’historique,
 * sinon centre ±1 jour (estimation indicative).
 */
export function getNextPeriodWindow(
  data: CycleData,
  fromDate: string,
): NextPeriodWindow | null {
  const ctx = getCycleContextForDate(data, fromDate);
  if (!ctx) return null;

  const center = addDays(ctx.periodStart, ctx.cycleLength);
  const regularity = getCycleRegularity(data);

  if (
    regularity.status !== 'insufficient' &&
    typeof regularity.minGap === 'number' &&
    typeof regularity.maxGap === 'number'
  ) {
    const start = addDays(ctx.periodStart, regularity.minGap);
    const end = addDays(ctx.periodStart, regularity.maxGap);
    return {
      center,
      start: start <= end ? start : end,
      end: start <= end ? end : start,
      fromHistory: true,
    };
  }

  return {
    center,
    start: addDays(center, -1),
    end: addDays(center, 1),
    fromHistory: false,
  };
}

function formatDayMonth(key: string): string {
  return parseDateKey(key).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
}

function formatDayMonthShort(key: string): string {
  return parseDateKey(key).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

/** Libellé unique (rétrocompat) — préfère la fourchette quand possible. */
export function formatNextPeriodLabel(data: CycleData, fromDate: string): string | null {
  return formatNextPeriodRangeLabel(data, fromDate);
}

export function formatNextPeriodRangeLabel(
  data: CycleData,
  fromDate: string,
): string | null {
  const window = getNextPeriodWindow(data, fromDate);
  if (!window) return null;

  const today = parseDateKey(fromDate);
  const startD = parseDateKey(window.start);
  const endD = parseDateKey(window.end);
  const daysToStart = Math.round((startD.getTime() - today.getTime()) / 86400000);
  const daysToEnd = Math.round((endD.getTime() - today.getTime()) / 86400000);

  if (daysToEnd < 0) {
    const overdue = Math.abs(daysToEnd);
    if (overdue === 0) return "Règles prévues aujourd'hui";
    return overdue === 1
      ? 'Règles attendues depuis hier — encore en attente'
      : `Règles attendues depuis ${overdue} jours — encore en attente`;
  }

  if (daysToStart <= 0 && daysToEnd >= 0) {
    if (window.start === window.end) return "Règles prévues aujourd'hui";
    return `Règles prévues entre aujourd'hui et le ${formatDayMonth(window.end)}`;
  }

  if (window.start === window.end) {
    if (daysToStart === 1) return 'Règles prévues demain';
    return `Règles prévues vers le ${formatDayMonth(window.center)}`;
  }

  if (daysToStart === 1 && daysToEnd === 1) return 'Règles prévues demain';

  const sameMonth =
    startD.getMonth() === endD.getMonth() && startD.getFullYear() === endD.getFullYear();
  if (sameMonth) {
    const startDay = startD.getDate();
    const endLabel = formatDayMonth(window.end);
    return `Règles prévues entre le ${startDay} et le ${endLabel}`;
  }

  return `Règles prévues entre le ${formatDayMonthShort(window.start)} et le ${formatDayMonthShort(window.end)}`;
}
